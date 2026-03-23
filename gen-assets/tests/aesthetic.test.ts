import { scoreAesthetics } from '../src/analysis/aesthetic';
import { LogoAsset } from '../src/types';

function makeLogo(name: string, aspectRatio: number | null): LogoAsset {
  return {
    name,
    displayName:    name.charAt(0).toUpperCase() + name.slice(1),
    filePath:       `/tmp/${name}.svg`,
    svgContent:     '<svg/>',
    viewBox:        aspectRatio !== null ? { x: 0, y: 0, width: aspectRatio * 40, height: 40 } : null,
    aspectRatio,
    colors:         [],
    dominantColor:  null,
    hasGradients:   false,
    hasExternalRefs: false,
    fileSize:       100,
  };
}

describe('scoreAesthetics', () => {
  it('returns zero scores for an empty logo set', () => {
    const score = scoreAesthetics([]);
    expect(score.overallScore).toBe(0);
    expect(score.breakdown.logoCount).toBe(0);
    expect(score.suggestions).toContain('No logos found.');
  });

  it('scores 100 visual balance for identical aspect ratios', () => {
    const logos = Array.from({ length: 8 }, (_, i) => makeLogo(`logo${i}`, 3.5));
    const score = scoreAesthetics(logos);
    expect(score.visualBalance).toBe(100);
    expect(score.breakdown.aspectRatioCv).toBe(0);
  });

  it('scores lower visual balance for high aspect ratio variance', () => {
    const logos = [
      makeLogo('narrow',  0.5),
      makeLogo('wide',    10),
      makeLogo('wider',   12),
      makeLogo('medium',  3),
      makeLogo('normal',  4),
      makeLogo('normal2', 4),
    ];
    const score = scoreAesthetics(logos);
    expect(score.visualBalance).toBeLessThan(80);
  });

  it('reports 100 spacing consistency always', () => {
    const logos = Array.from({ length: 6 }, (_, i) => makeLogo(`logo${i}`, 3));
    const score = scoreAesthetics(logos);
    expect(score.spacingConsistency).toBe(100);
  });

  it('scores logoCount 100 for 6–12 logos', () => {
    const logos = Array.from({ length: 8 }, (_, i) => makeLogo(`logo${i}`, 3));
    const score = scoreAesthetics(logos);
    expect(score.logoCountScore).toBe(100);
  });

  it('scores logoCount lower for fewer than 4 logos', () => {
    const logos = [makeLogo('a', 3), makeLogo('b', 3)];
    const score = scoreAesthetics(logos);
    expect(score.logoCountScore).toBeLessThan(75);
  });

  it('flags extreme aspect ratios (>9 or <0.4) as size harmony issues', () => {
    const logos = [
      makeLogo('verywide',   15), // > 9
      makeLogo('normal',     3),
      makeLogo('normal2',    4),
    ];
    const score = scoreAesthetics(logos);
    expect(score.sizeHarmony).toBeLessThan(100);
    expect(score.suggestions.some(s => s.includes('Extreme aspect ratios'))).toBe(true);
  });

  it('suggests grid layout for many logos with high variance', () => {
    const logos = Array.from({ length: 12 }, (_, i) =>
      makeLogo(`logo${i}`, i % 2 === 0 ? 1 : 8),
    );
    const score = scoreAesthetics(logos);
    expect(score.breakdown.suggestedLayout).toBe('grid');
  });

  it('handles logos with null aspectRatio gracefully', () => {
    const logos = [
      makeLogo('withAR',    3.5),
      makeLogo('withoutAR', null),
      makeLogo('withAR2',   4.0),
    ];
    expect(() => scoreAesthetics(logos)).not.toThrow();
  });

  it('overallScore is within 0–100', () => {
    const logos = Array.from({ length: 10 }, (_, i) => makeLogo(`logo${i}`, 2 + i));
    const score = scoreAesthetics(logos);
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
  });

  it('breakdown contains correct logo count', () => {
    const logos = Array.from({ length: 5 }, (_, i) => makeLogo(`logo${i}`, 3));
    const score = scoreAesthetics(logos);
    expect(score.breakdown.logoCount).toBe(5);
  });
});
