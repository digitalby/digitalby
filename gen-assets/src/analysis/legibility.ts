import {
  LogoAsset,
  LogoLegibilityReport,
  SizeLegibilityReport,
  WcagGrade,
  Size,
  ContrastResult,
} from '../types';
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  buildContrastResult,
  isUntestableColor,
} from './colorUtils';
import { ANALYSIS_BACKGROUNDS, SIZE_CONFIGS } from '../config';

const GRADE_RANK: Record<WcagGrade, number> = {
  Fail:       0,
  'AA-Large': 1,
  AA:         2,
  AAA:        3,
};

function bestGrade(grades: WcagGrade[]): WcagGrade {
  if (grades.length === 0) return 'Fail';
  return grades.reduce((best, g) => GRADE_RANK[g] > GRADE_RANK[best] ? g : best);
}

function worstContrastOf(colorHexes: string[], backgroundHex: string): ContrastResult {
  if (colorHexes.length === 0) return buildContrastResult(1);

  const bgRgb = parseColor(backgroundHex);
  if (!bgRgb) return buildContrastResult(1);
  const bgL = relativeLuminance(bgRgb);

  const results = colorHexes
    .map(hex => {
      const fg = parseColor(hex);
      if (!fg) return null;
      return buildContrastResult(contrastRatio(relativeLuminance(fg), bgL));
    })
    .filter((r): r is ContrastResult => r !== null);

  if (results.length === 0) return buildContrastResult(1);
  // Worst (minimum contrast) among primary colors determines legibility floor
  return results.reduce((worst, curr) => curr.ratio < worst.ratio ? curr : worst);
}

export function analyzeLogo(logo: LogoAsset): LogoLegibilityReport {
  const hasUntestableColors = logo.hasGradients || logo.hasExternalRefs;
  const issues: string[] = [];

  const topColors = logo.colors
    .filter(c => !isUntestableColor(c.hex))
    .slice(0, 5)
    .map(c => c.hex);

  if (topColors.length === 0) {
    issues.push('No testable colors could be extracted — logo may rely entirely on gradients, masks, or external references.');
  }
  if (logo.hasGradients) {
    issues.push('Logo uses gradient fills; gradient edge contrast cannot be fully calculated and may vary.');
  }
  if (logo.hasExternalRefs) {
    issues.push('Logo references external resources; visual appearance may differ when rendered in isolation.');
  }

  const onWhite    = worstContrastOf(topColors, ANALYSIS_BACKGROUNDS.white);
  const onBlack    = worstContrastOf(topColors, ANALYSIS_BACKGROUNDS.black);
  const onDarkGray = worstContrastOf(topColors, ANALYSIS_BACKGROUNDS.darkGray);
  const onLightGray = worstContrastOf(topColors, ANALYSIS_BACKGROUNDS.lightGray);

  // A logo is "suitable" for a background type if its worst-case grade passes AA-Large (3:1),
  // the WCAG minimum for non-text UI components.
  const bestOnLight = bestGrade([onWhite.grade, onLightGray.grade]);
  const bestOnDark  = bestGrade([onBlack.grade, onDarkGray.grade]);

  const bestForLight = GRADE_RANK[bestOnLight] >= GRADE_RANK['AA-Large'];
  const bestForDark  = GRADE_RANK[bestOnDark]  >= GRADE_RANK['AA-Large'];

  if (!bestForLight) {
    issues.push(
      `Insufficient contrast on light backgrounds — ${onWhite.ratio}:1 on white, ${onLightGray.ratio}:1 on light gray ` +
      `(minimum 3:1 required for WCAG AA non-text).`,
    );
  }
  if (!bestForDark) {
    issues.push(
      `Insufficient contrast on dark backgrounds — ${onBlack.ratio}:1 on black, ${onDarkGray.ratio}:1 on dark gray ` +
      `(minimum 3:1 required for WCAG AA non-text).`,
    );
  }

  let recommendation: string;
  if (bestForLight && bestForDark) {
    recommendation = 'Versatile — works well on both light and dark backgrounds.';
  } else if (bestForLight && !bestForDark) {
    recommendation = 'Light backgrounds only. Provide a white/light logo variant for dark themes.';
  } else if (!bestForLight && bestForDark) {
    recommendation = 'Dark backgrounds only. Provide a dark/inverted logo variant for light themes.';
  } else {
    recommendation = 'Low contrast on all standard backgrounds. Consider adding a visible container, border, or requesting an accessible SVG from the brand.';
  }

  return {
    logoName:            logo.name,
    displayName:         logo.displayName,
    colorsAnalyzed:      topColors,
    onWhite,
    onBlack,
    onDarkGray,
    onLightGray,
    bestForLight,
    bestForDark,
    overallOnLight:      bestOnLight,
    overallOnDark:       bestOnDark,
    recommendation,
    issues,
    hasUntestableColors,
  };
}

export function analyzeSize(size: Size): SizeLegibilityReport {
  const config = SIZE_CONFIGS[size];
  const { height } = config;
  const issues: string[] = [];

  const minimumSizeCompliant = height >= 20;

  if (height < 20) {
    issues.push(`Height of ${height}px is below 20px — may cause rendering artifacts on high-DPI displays with complex paths.`);
  }
  if (height < 24) {
    issues.push(`At ${height}px, fine logo details (thin strokes, small letterforms) may become illegible. Recommended only for simple wordmarks.`);
  }

  const recommendation =
    height >= 60 ? 'Excellent for hero sections and partner showcase pages.' :
    height >= 40 ? 'Good general-purpose size for testimonial and social proof sections.' :
    height >= 30 ? 'Standard README / inline size. Works well for horizontal logo strips.' :
                   'Minimal. Best for compact contexts where space is constrained.';

  return {
    size,
    pixelHeight:        height,
    isUsableOnLight:    minimumSizeCompliant,
    isUsableOnDark:     minimumSizeCompliant,
    minimumSizeCompliant,
    issues,
    recommendation,
  };
}

export function analyzeAllLogos(logos: LogoAsset[]): LogoLegibilityReport[] {
  return logos.map(analyzeLogo);
}

export function analyzeAllSizes(sizes: Size[]): SizeLegibilityReport[] {
  return sizes.map(analyzeSize);
}
