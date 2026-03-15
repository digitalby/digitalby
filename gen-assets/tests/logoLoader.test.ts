import path from 'path';
import { parseLogo, loadLogos } from '../src/generator/logoLoader';

// Minimal well-formed SVG with a simple fill color
const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
  <rect fill="#EA1D25" width="100" height="40"/>
</svg>`;

// SVG with CSS class-based color (like eBay)
const CSS_CLASS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <defs><style>.cls-1{fill:#0968f6;}.cls-2{fill:#f02d2d;}</style></defs>
  <path class="cls-1" d="M0 0h100v100H0z"/>
  <path class="cls-2" d="M100 0h100v100H100z"/>
</svg>`;

// SVG with inline style attribute
const INLINE_STYLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
  <circle style="fill:#107C10;stroke:#000000" r="25" cx="25" cy="25"/>
</svg>`;

// SVG with gradient (untestable)
const GRADIENT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <defs><linearGradient id="g1"><stop offset="0%" stop-color="#ff0000"/><stop offset="100%" stop-color="#0000ff"/></linearGradient></defs>
  <rect fill="url(#g1)" width="100" height="50"/>
</svg>`;

// SVG without viewBox but with explicit width/height
const NO_VIEWBOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
  <rect fill="#000000" width="200" height="80"/>
</svg>`;

function makeLogoFromContent(content: string, name = 'test'): ReturnType<typeof parseLogo> {
  // Write a temp file and parse it, or mock the FS.
  // For unit tests we call parseLogo directly on a real file path.
  // Here we use a fixture approach writing to a temp path.
  const os = require('os') as typeof import('os');
  const fs = require('fs') as typeof import('fs');
  const tmpFile = path.join(os.tmpdir(), `${name}-test.svg`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return parseLogo(tmpFile);
}

describe('parseLogo – viewBox extraction', () => {
  it('extracts viewBox from a standard SVG', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    expect(logo.viewBox).toEqual({ x: 0, y: 0, width: 100, height: 40 });
    expect(logo.aspectRatio).toBeCloseTo(100 / 40, 5);
  });

  it('falls back to width/height when viewBox is absent', () => {
    const logo = makeLogoFromContent(NO_VIEWBOX_SVG, 'noviewbox');
    expect(logo.viewBox).toEqual({ x: 0, y: 0, width: 200, height: 80 });
    expect(logo.aspectRatio).toBeCloseTo(200 / 80, 5);
  });

  it('returns null viewBox when neither viewBox nor dimensions are present', () => {
    const bare = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>';
    const logo = makeLogoFromContent(bare, 'bare');
    expect(logo.viewBox).toBeNull();
    expect(logo.aspectRatio).toBeNull();
  });
});

describe('parseLogo – color extraction', () => {
  it('extracts direct fill attribute', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    expect(logo.colors.some(c => c.hex === '#ea1d25')).toBe(true);
  });

  it('extracts CSS class-based fill colors', () => {
    const logo = makeLogoFromContent(CSS_CLASS_SVG, 'cssclass');
    const hexes = logo.colors.map(c => c.hex);
    expect(hexes).toContain('#0968f6');
    expect(hexes).toContain('#f02d2d');
  });

  it('extracts inline style fill and stroke', () => {
    const logo = makeLogoFromContent(INLINE_STYLE_SVG, 'inlinestyle');
    const hexes = logo.colors.map(c => c.hex);
    expect(hexes).toContain('#107c10');
    expect(hexes).toContain('#000000');
  });

  it('marks gradient SVGs appropriately', () => {
    const logo = makeLogoFromContent(GRADIENT_SVG, 'gradient');
    expect(logo.hasGradients).toBe(true);
  });

  it('does not mark simple SVGs as having gradients', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    expect(logo.hasGradients).toBe(false);
  });

  it('sorts colors by frequency descending', () => {
    const multiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect fill="#ff0000"/>
      <rect fill="#ff0000"/>
      <rect fill="#ff0000"/>
      <rect fill="#0000ff"/>
    </svg>`;
    const logo = makeLogoFromContent(multiSvg, 'multi');
    expect(logo.colors[0].hex).toBe('#ff0000');
    expect(logo.colors[0].frequency).toBe(3);
  });
});

describe('parseLogo – dominant color', () => {
  it('identifies dominant brand color (non-neutral preferred)', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    // #EA1D25 is a non-neutral brand color, should be dominant
    expect(logo.dominantColor).toBe('#ea1d25');
  });
});

describe('parseLogo – metadata', () => {
  it('sets name from filename (lowercase, no extension)', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'amazon');
    // temp file is named amazon-test.svg, so name = amazon-test; verify lowercase and svg-less
    expect(logo.name).toBe('amazon-test');
    expect(logo.name).not.toContain('.svg');
    expect(logo.name).toBe(logo.name.toLowerCase());
  });

  it('stores raw SVG content', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    expect(logo.svgContent).toContain('<svg');
  });

  it('records file size in bytes', () => {
    const logo = makeLogoFromContent(SIMPLE_SVG, 'simple');
    expect(logo.fileSize).toBeGreaterThan(0);
  });
});

describe('loadLogos', () => {
  it('throws when directory does not exist', async () => {
    await expect(loadLogos('/nonexistent/path/to/logos')).rejects.toThrow('not found');
  });

  it('throws when directory has no SVG files', async () => {
    const os = require('os') as typeof import('os');
    const fs = require('fs') as typeof import('fs');
    const tmpDir = path.join(os.tmpdir(), 'empty-logos-test');
    fs.mkdirSync(tmpDir, { recursive: true });
    await expect(loadLogos(tmpDir)).rejects.toThrow('No SVG files');
  });

  it('loads the real project logos', async () => {
    const logosDir = path.resolve(__dirname, '../assets/logos');
    const logos = await loadLogos(logosDir);
    expect(logos.length).toBeGreaterThan(0);
    expect(logos.every(l => l.svgContent.includes('<svg'))).toBe(true);
    expect(logos.every(l => l.name.length > 0)).toBe(true);
  });
});
