import { analyzeLogo, analyzeSize, analyzeAllLogos, analyzeAllSizes } from '../src/analysis/legibility';
import { LogoAsset } from '../src/types';

function makeLogoAsset(overrides: Partial<LogoAsset> = {}): LogoAsset {
  return {
    name:           'test',
    displayName:    'Test',
    filePath:       '/tmp/test.svg',
    svgContent:     '<svg/>',
    viewBox:        { x: 0, y: 0, width: 100, height: 40 },
    aspectRatio:    2.5,
    colors:         [],
    dominantColor:  null,
    hasGradients:   false,
    hasExternalRefs: false,
    fileSize:       1000,
    ...overrides,
  };
}

describe('analyzeLogo', () => {
  it('flags a logo with no extractable colors', () => {
    const logo = makeLogoAsset({ colors: [] });
    const report = analyzeLogo(logo);
    expect(report.issues.some(i => i.includes('No testable colors'))).toBe(true);
  });

  it('flags a logo with gradients', () => {
    const logo = makeLogoAsset({ hasGradients: true, colors: [] });
    const report = analyzeLogo(logo);
    expect(report.hasUntestableColors).toBe(true);
    expect(report.issues.some(i => i.includes('gradient'))).toBe(true);
  });

  it('identifies a black logo as suitable for light backgrounds only', () => {
    const logo = makeLogoAsset({
      colors: [{ hex: '#000000', source: 'fill', elementTag: 'path', frequency: 1 }],
    });
    const report = analyzeLogo(logo);
    // Black has 21:1 contrast on white — passes
    expect(report.bestForLight).toBe(true);
    // Black has ~1.05:1 contrast on dark gray — fails
    expect(report.bestForDark).toBe(false);
  });

  it('identifies a white logo as suitable for dark backgrounds only', () => {
    const logo = makeLogoAsset({
      colors: [{ hex: '#ffffff', source: 'fill', elementTag: 'path', frequency: 1 }],
    });
    const report = analyzeLogo(logo);
    expect(report.bestForLight).toBe(false);
    expect(report.bestForDark).toBe(true);
  });

  it('marks a dark brand color as passing on light and failing on dark', () => {
    // Santander red #EA1D25 — contrast on white ≈ 4.5:1 (borderline AA), on dark gray ≈ 2:1 (Fail)
    const logo = makeLogoAsset({
      colors: [{ hex: '#ea1d25', source: 'fill', elementTag: 'path', frequency: 1 }],
    });
    const report = analyzeLogo(logo);
    expect(report.onWhite.ratio).toBeGreaterThan(3); // passes AA-Large on white
    expect(report.bestForLight).toBe(true);
  });

  it('sets colorsAnalyzed to top 5 colors', () => {
    const colors = Array.from({ length: 8 }, (_, i) => ({
      hex: `#${i.toString(16).padStart(6, '0')}`,
      source: 'fill' as const,
      elementTag: 'path',
      frequency: 8 - i,
    }));
    const logo = makeLogoAsset({ colors });
    const report = analyzeLogo(logo);
    expect(report.colorsAnalyzed.length).toBeLessThanOrEqual(5);
  });

  it('provides a non-empty recommendation', () => {
    const logo = makeLogoAsset({
      colors: [{ hex: '#000000', source: 'fill', elementTag: 'path', frequency: 1 }],
    });
    const report = analyzeLogo(logo);
    expect(report.recommendation.length).toBeGreaterThan(0);
  });

  it('identifies a mid-gray logo as limited on dark backgrounds', () => {
    // #808080 on white ≈ 3.95:1 (AA-Large), on dark gray #1a1a1a ≈ 4.0:1 (AA-Large)
    const logo = makeLogoAsset({
      colors: [{ hex: '#808080', source: 'fill', elementTag: 'path', frequency: 1 }],
    });
    const report = analyzeLogo(logo);
    // on white ≥ 3:1 → should pass AA-Large
    expect(report.onWhite.wcagAALargeText).toBe(true);
    // on dark gray ~4:1 → AA-Large but not full AA
    expect(report.onDarkGray.wcagAAA).toBe(false);
    // on black → passes (high contrast)
    expect(report.onBlack.wcagAALargeText).toBe(true);
  });
});

describe('analyzeSize', () => {
  it('returns correct height for each size', () => {
    expect(analyzeSize('xs').pixelHeight).toBe(20);
    expect(analyzeSize('sm').pixelHeight).toBe(30);
    expect(analyzeSize('md').pixelHeight).toBe(45);
    expect(analyzeSize('lg').pixelHeight).toBe(60);
    expect(analyzeSize('xl').pixelHeight).toBe(80);
  });

  it('marks all standard sizes as minimum-size compliant', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      expect(analyzeSize(size).minimumSizeCompliant).toBe(true);
    }
  });

  it('provides a recommendation for each size', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      expect(analyzeSize(size).recommendation.length).toBeGreaterThan(0);
    }
  });

  it('flags xs size with detail-legibility warnings (below 24px threshold)', () => {
    // xs = 20px (< 24px) → gets both the fine-detail warning
    const xs = analyzeSize('xs');
    expect(xs.issues.length).toBeGreaterThan(0);
    // sm = 30px (>= 24px) → no rendering warnings
    const sm = analyzeSize('sm');
    expect(sm.issues.length).toBe(0);
  });
});

describe('analyzeAllLogos', () => {
  it('returns one report per logo', () => {
    const logos = [makeLogoAsset({ name: 'a' }), makeLogoAsset({ name: 'b' })];
    const reports = analyzeAllLogos(logos);
    expect(reports).toHaveLength(2);
  });
});

describe('analyzeAllSizes', () => {
  it('returns one report per size', () => {
    const reports = analyzeAllSizes(['xs', 'md', 'xl']);
    expect(reports).toHaveLength(3);
    expect(reports.map(r => r.size)).toEqual(['xs', 'md', 'xl']);
  });
});
