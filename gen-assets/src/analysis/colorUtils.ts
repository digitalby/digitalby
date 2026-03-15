import { RgbColor, ContrastResult, WcagGrade } from '../types';

// Subset of named CSS colors that commonly appear in SVG brand assets
const NAMED_COLORS: Record<string, RgbColor> = {
  black:       { r: 0,   g: 0,   b: 0   },
  white:       { r: 255, g: 255, b: 255 },
  red:         { r: 255, g: 0,   b: 0   },
  green:       { r: 0,   g: 128, b: 0   },
  blue:        { r: 0,   g: 0,   b: 255 },
  yellow:      { r: 255, g: 255, b: 0   },
  orange:      { r: 255, g: 165, b: 0   },
  purple:      { r: 128, g: 0,   b: 128 },
  pink:        { r: 255, g: 192, b: 203 },
  gray:        { r: 128, g: 128, b: 128 },
  grey:        { r: 128, g: 128, b: 128 },
  silver:      { r: 192, g: 192, b: 192 },
  darkgray:    { r: 169, g: 169, b: 169 },
  darkgrey:    { r: 169, g: 169, b: 169 },
  navy:        { r: 0,   g: 0,   b: 128 },
  teal:        { r: 0,   g: 128, b: 128 },
  maroon:      { r: 128, g: 0,   b: 0   },
  cyan:        { r: 0,   g: 255, b: 255 },
  magenta:     { r: 255, g: 0,   b: 255 },
  lime:        { r: 0,   g: 255, b: 0   },
  gold:        { r: 255, g: 215, b: 0   },
  crimson:     { r: 220, g: 20,  b: 60  },
  coral:       { r: 255, g: 127, b: 80  },
  tomato:      { r: 255, g: 99,  b: 71  },
  firebrick:   { r: 178, g: 34,  b: 34  },
  darkred:     { r: 139, g: 0,   b: 0   },
  royalblue:   { r: 65,  g: 105, b: 225 },
  steelblue:   { r: 70,  g: 130, b: 180 },
  forestgreen: { r: 34,  g: 139, b: 34  },
  limegreen:   { r: 50,  g: 205, b: 50  },
  turquoise:   { r: 64,  g: 224, b: 208 },
  indigo:      { r: 75,  g: 0,   b: 130 },
  violet:      { r: 238, g: 130, b: 238 },
  beige:       { r: 245, g: 245, b: 220 },
  ivory:       { r: 255, g: 255, b: 240 },
  snow:        { r: 255, g: 250, b: 250 },
  transparent: { r: 255, g: 255, b: 255 }, // treat as white for analysis
};

/** Linearize a single sRGB channel byte (0-255) per WCAG 2.1 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance: 0 (black) → 1 (white) */
export function relativeLuminance({ r, g, b }: RgbColor): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG 2.1 contrast ratio: 1:1 (no contrast) → 21:1 (max) */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagGrade(ratio: number): WcagGrade {
  if (ratio >= 7)   return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3)   return 'AA-Large';
  return 'Fail';
}

export function buildContrastResult(ratio: number): ContrastResult {
  return {
    ratio:              Math.round(ratio * 100) / 100,
    wcagAA:             ratio >= 4.5,
    wcagAAA:            ratio >= 7,
    wcagAALargeText:    ratio >= 3,
    grade:              getWcagGrade(ratio),
  };
}

/** Parse a hex string (#RGB, #RRGGBB, #RGBA, #RRGGBBAA) to RgbColor */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3 || clean.length === 4) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

/** Convert RgbColor to lowercase hex string (#rrggbb) */
export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Parse any CSS color string to RgbColor. Returns null for non-color or unparseable values. */
export function parseColor(color: string): RgbColor | null {
  if (!color) return null;
  const t = color.trim().toLowerCase();

  if (['none', 'transparent', 'inherit', 'initial', 'unset', 'currentcolor'].includes(t)) {
    return t === 'transparent' ? { r: 255, g: 255, b: 255 } : null;
  }
  if (t.startsWith('url(')) return null;

  if (t.startsWith('#')) return hexToRgb(t);

  const rgbMatch = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return NAMED_COLORS[t] ?? null;
}

/** Returns true when a color value cannot be tested (gradients, currentColor, etc.) */
export function isUntestableColor(color: string): boolean {
  const t = color.trim().toLowerCase();
  return t.startsWith('url(') || t === 'currentcolor' || t === 'inherit';
}

/** Normalise any CSS color string to lowercase hex. Returns null if unparseable. */
export function normalizeToHex(color: string): string | null {
  const rgb = parseColor(color);
  return rgb ? rgbToHex(rgb) : null;
}

/** Compute contrast between two CSS color strings. Returns null if either is unparseable. */
export function cssColorContrast(fg: string, bg: string): ContrastResult | null {
  const fgRgb = parseColor(fg);
  const bgRgb = parseColor(bg);
  if (!fgRgb || !bgRgb) return null;
  const ratio = contrastRatio(relativeLuminance(fgRgb), relativeLuminance(bgRgb));
  return buildContrastResult(ratio);
}
