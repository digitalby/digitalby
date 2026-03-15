import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import type { Element } from 'domhandler';
import { LogoAsset, ExtractedColor, ViewBox } from '../types';
import { DISPLAY_NAMES } from '../config';
import { normalizeToHex, isUntestableColor } from '../analysis/colorUtils';

const COLOR_ATTRS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'] as const;
const STYLE_PROPS = ['fill', 'stroke', 'stop-color'] as const;

function parseViewBox(svgContent: string): ViewBox | null {
  const $ = load(svgContent, { xmlMode: true });
  const svgEl = $('svg').first();

  const vb = svgEl.attr('viewBox');
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }

  // Fall back to explicit width/height attributes
  const w = parseFloat(svgEl.attr('width') ?? '');
  const h = parseFloat(svgEl.attr('height') ?? '');
  if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
    return { x: 0, y: 0, width: w, height: h };
  }

  return null;
}

/**
 * Extract class-name → color mappings from embedded <style> blocks.
 * Returns a map of "className:property" → hex color.
 */
function extractCssClassColors(svgContent: string): Map<string, string> {
  const classColors = new Map<string, string>();
  const styleBlocks = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (!styleBlocks) return classColors;

  for (const block of styleBlocks) {
    const content = block.replace(/<\/?style[^>]*>/gi, '');
    const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(content)) !== null) {
      const className = match[1];
      const declarations = match[2];

      for (const prop of STYLE_PROPS) {
        const propMatch = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(declarations);
        if (propMatch) {
          const hex = normalizeToHex(propMatch[1].trim());
          if (hex) classColors.set(`${className}:${prop}`, hex);
        }
      }
    }
  }

  return classColors;
}

function extractColors(svgContent: string): {
  colors: ExtractedColor[];
  hasGradients: boolean;
  hasExternalRefs: boolean;
} {
  const $ = load(svgContent, { xmlMode: true });
  const colorMap = new Map<string, ExtractedColor>();
  let hasGradients  = $('linearGradient, radialGradient').length > 0;
  let hasExternalRefs = false;

  const cssClassColors = extractCssClassColors(svgContent);

  const addColor = (hex: string, source: ExtractedColor['source'], elementTag: string): void => {
    const key = `${hex}:${source}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.frequency += 1;
    } else {
      colorMap.set(key, { hex, source, elementTag, frequency: 1 });
    }
  };

  $('*').each((_, node) => {
    if (node.type !== 'tag') return;
    const el   = node as Element;
    const tag  = el.name;
    const attr = el.attribs ?? {};

    // Direct color attributes
    for (const attrName of COLOR_ATTRS) {
      const val = attr[attrName];
      if (!val) continue;
      if (isUntestableColor(val)) {
        if (val.toLowerCase().startsWith('url(')) hasGradients = true;
        continue;
      }
      const hex = normalizeToHex(val);
      if (hex) {
        const source: ExtractedColor['source'] =
          attrName === 'stroke'     ? 'stroke'     :
          attrName === 'stop-color' ? 'stop-color' : 'fill';
        addColor(hex, source, tag);
      }
    }

    // Inline style="..." attribute
    const style = attr['style'];
    if (style) {
      for (const prop of STYLE_PROPS) {
        const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(style);
        if (m) {
          const val = m[1].trim();
          if (isUntestableColor(val)) {
            if (val.toLowerCase().startsWith('url(')) hasGradients = true;
          } else {
            const hex = normalizeToHex(val);
            if (hex) addColor(hex, 'style', tag);
          }
        }
      }
    }

    // CSS class-based colors (e.g. eBay uses .cls-1 { fill: #... })
    const classAttr = attr['class'];
    if (classAttr && cssClassColors.size > 0) {
      for (const cls of classAttr.split(/\s+/)) {
        for (const prop of STYLE_PROPS) {
          const hex = cssClassColors.get(`${cls}:${prop}`);
          if (hex) addColor(hex, 'css-class', tag);
        }
      }
    }

    // External href references
    const href = attr['href'] ?? attr['xlink:href'];
    if (href && !href.startsWith('#')) hasExternalRefs = true;
  });

  const colors = Array.from(colorMap.values()).sort((a, b) => b.frequency - a.frequency);
  return { colors, hasGradients, hasExternalRefs };
}

/**
 * Pick a dominant brand color: prefer non-neutral colors (not near-white or near-black),
 * then fall back to the highest-frequency color.
 */
function getDominantColor(colors: ExtractedColor[]): string | null {
  if (colors.length === 0) return null;
  const brandColors = colors.filter(({ hex }) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;
    return brightness > 25 && brightness < 230;
  });
  return (brandColors[0] ?? colors[0]).hex;
}

function getDisplayName(filePath: string): string {
  const baseName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  return DISPLAY_NAMES[baseName] ?? (baseName.charAt(0).toUpperCase() + baseName.slice(1));
}

export async function loadLogos(logosDir: string): Promise<LogoAsset[]> {
  const absoluteDir = path.resolve(logosDir);
  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Logos directory not found: ${absoluteDir}`);
  }

  const files = fs.readdirSync(absoluteDir)
    .filter(f => f.toLowerCase().endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No SVG files found in: ${absoluteDir}`);
  }

  return Promise.all(files.map(f => parseLogo(path.join(absoluteDir, f))));
}

export function parseLogo(filePath: string): LogoAsset {
  const svgContent = fs.readFileSync(filePath, 'utf-8');
  const stats      = fs.statSync(filePath);
  const viewBox    = parseViewBox(svgContent);
  const { colors, hasGradients, hasExternalRefs } = extractColors(svgContent);

  return {
    name:           path.basename(filePath, '.svg').toLowerCase(),
    displayName:    getDisplayName(filePath),
    filePath,
    svgContent,
    viewBox,
    aspectRatio:    viewBox ? viewBox.width / viewBox.height : null,
    colors,
    dominantColor:  getDominantColor(colors),
    hasGradients,
    hasExternalRefs,
    fileSize:       stats.size,
  };
}
