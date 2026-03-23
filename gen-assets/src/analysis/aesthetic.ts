import { LogoAsset, AestheticScore, Layout } from '../types';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.map(v => Math.pow(v - m, 2)).reduce((a, b) => a + b, 0) / values.length);
}

function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  return m === 0 ? 0 : stddev(values) / m;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function scoreFromCv(cv: number, goodThreshold = 0.25, badThreshold = 0.75): number {
  if (cv <= goodThreshold) return 100;
  if (cv >= badThreshold)  return 0;
  return clamp(Math.round(((badThreshold - cv) / (badThreshold - goodThreshold)) * 100), 0, 100);
}

export function scoreAesthetics(logos: LogoAsset[]): AestheticScore {
  const suggestions: string[] = [];

  if (logos.length === 0) {
    return {
      visualBalance: 0, spacingConsistency: 100, sizeHarmony: 0, logoCountScore: 0,
      overallScore: 0,
      breakdown: { meanAspectRatio: 0, aspectRatioCv: 0, aspectRatioMin: 0, aspectRatioMax: 0, logoCount: 0, suggestedLayout: 'inline' },
      suggestions: ['No logos found.'],
    };
  }

  const aspectRatios = logos
    .map(l => l.aspectRatio)
    .filter((ar): ar is number => ar !== null);

  const meanAR  = mean(aspectRatios);
  const arCv    = aspectRatios.length > 1 ? coefficientOfVariation(aspectRatios) : 0;
  const arMin   = aspectRatios.length > 0 ? Math.min(...aspectRatios) : 0;
  const arMax   = aspectRatios.length > 0 ? Math.max(...aspectRatios) : 0;

  // --- Visual balance: how similar are display widths at a fixed height? ---
  // A high CV means some logos will appear far wider/narrower than others.
  const visualBalance = scoreFromCv(arCv, 0.3, 0.8);
  if (arCv > 0.5) {
    suggestions.push(
      `Logo widths vary significantly (CV=${arCv.toFixed(2)}, range ${arMin.toFixed(2)}–${arMax.toFixed(2)}:1). ` +
      'Very wide logos will dominate the strip visually.',
    );
  }

  // --- Spacing consistency: we enforce CSS gap → always 100 ---
  const spacingConsistency = 100;

  // --- Size harmony: penalise logos with extreme aspect ratios ---
  const extremeCount = logos.filter(l => {
    const ar = l.aspectRatio;
    return ar !== null && (ar > 9 || ar < 0.4);
  }).length;
  const sizeHarmony = clamp(Math.round(((logos.length - extremeCount) / logos.length) * 100), 0, 100);
  if (extremeCount > 0) {
    const extremeNames = logos
      .filter(l => l.aspectRatio !== null && (l.aspectRatio > 9 || l.aspectRatio < 0.4))
      .map(l => `${l.displayName} (${l.aspectRatio?.toFixed(1)}:1)`);
    suggestions.push(`Extreme aspect ratios disrupt visual rhythm: ${extremeNames.join(', ')}.`);
  }

  // --- Logo count: sweet spot is 6–12 for a horizontal strip ---
  const count = logos.length;
  const logoCountScore =
    count >= 6 && count <= 12 ? 100 :
    count >= 4 && count <= 16 ? 75  :
    count >= 3                ? 50  : 25;

  if (count < 4)  suggestions.push(`Only ${count} logos — a social proof section typically benefits from ≥6.`);
  if (count > 14) suggestions.push(`${count} logos is many for a single row. Consider wrapping, a grid, or a carousel.`);

  // --- Suggested layout ---
  let suggestedLayout: Layout;
  if      (count <= 5)                       suggestedLayout = 'inline';
  else if (count >= 10 || arCv > 0.6)        suggestedLayout = 'grid';
  else if (meanAR > 5)                       suggestedLayout = 'compact';
  else                                       suggestedLayout = 'inline';

  if (suggestedLayout !== 'inline') {
    suggestions.push(`Consider the "${suggestedLayout}" layout to better handle the current logo set.`);
  }

  // --- Overall score (weighted) ---
  const overallScore = Math.round(
    visualBalance     * 0.35 +
    spacingConsistency * 0.15 +
    sizeHarmony        * 0.30 +
    logoCountScore     * 0.20,
  );

  if (overallScore < 60) {
    suggestions.push('Aesthetic score is below average — reducing aspect ratio variance will have the greatest impact.');
  }

  return {
    visualBalance,
    spacingConsistency,
    sizeHarmony,
    logoCountScore,
    overallScore,
    breakdown: {
      meanAspectRatio: Math.round(meanAR  * 100) / 100,
      aspectRatioCv:   Math.round(arCv    * 100) / 100,
      aspectRatioMin:  Math.round(arMin   * 100) / 100,
      aspectRatioMax:  Math.round(arMax   * 100) / 100,
      logoCount:       count,
      suggestedLayout,
    },
    suggestions,
  };
}
