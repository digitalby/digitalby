import { LogoAsset, AccessibilityAudit, WcagGrade, Size } from '../types';
import { LogoLegibilityReport } from '../types';
import { SIZE_CONFIGS } from '../config';

export function auditAccessibility(
  logos: LogoAsset[],
  legibilityReports: LogoLegibilityReport[],
  sizes: Size[],
): AccessibilityAudit {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // --- Alt-text coverage ---
  // All logos receive alt text derived from their displayName.
  // A displayName shorter than 2 characters is considered missing/meaningless.
  const logosWithAlt = logos.filter(l => l.displayName.trim().length >= 2);
  const altTextCoverage =
    logos.length > 0 ? Math.round((logosWithAlt.length / logos.length) * 100) : 100;

  if (altTextCoverage < 100) {
    const missing = logos.filter(l => l.displayName.trim().length < 2).map(l => l.name);
    issues.push(`Logos missing meaningful alt text: ${missing.join(', ')}.`);
    recommendations.push('Update the DISPLAY_NAMES map in src/config.ts to provide descriptive names for all logos.');
  }

  // --- Minimum size compliance ---
  const minimumSizeCompliance: Partial<Record<Size, boolean>> = {};
  for (const size of sizes) {
    const height = SIZE_CONFIGS[size].height;
    const passes = height >= 16;
    minimumSizeCompliance[size] = passes;
    if (!passes) {
      issues.push(`Size "${size}" (${height}px) is below 16px — may not meet WCAG 2.5.5 minimum touch target size.`);
    }
  }

  // --- Contrast compliance ---
  const total = legibilityReports.length;
  const lightPass = legibilityReports.filter(r => r.bestForLight).length;
  const darkPass  = legibilityReports.filter(r => r.bestForDark).length;
  const onLight   = total > 0 ? Math.round((lightPass / total) * 100) : 0;
  const onDark    = total > 0 ? Math.round((darkPass  / total) * 100) : 0;

  if (lightPass < total) {
    const failing = legibilityReports.filter(r => !r.bestForLight).map(r => r.displayName);
    issues.push(`${failing.length} logo(s) fail WCAG non-text contrast (3:1) on light backgrounds: ${failing.join(', ')}.`);
    recommendations.push('For light-background usage, ensure logos have sufficient contrast or supply dark logo variants.');
  }
  if (darkPass < total) {
    const failing = legibilityReports.filter(r => !r.bestForDark).map(r => r.displayName);
    issues.push(`${failing.length} logo(s) fail WCAG non-text contrast (3:1) on dark backgrounds: ${failing.join(', ')}.`);
    recommendations.push('For dark-background usage, ensure logos have sufficient contrast or supply light/inverted variants.');
  }

  // --- Gradient / external-ref logos need manual review ---
  const untestable = logos.filter(l => l.hasGradients || l.hasExternalRefs);
  if (untestable.length > 0) {
    issues.push(
      `${untestable.length} logo(s) use gradients or external references and require manual contrast review: ` +
      untestable.map(l => l.displayName).join(', ') + '.',
    );
    recommendations.push('Manually verify gradient logos against intended backgrounds using a browser-based contrast checker.');
  }

  // --- Structural ARIA recommendations (always useful) ---
  recommendations.push('Wrap the logo strip in a <section> or <nav> with aria-label="Client logos" for screen reader context.');
  recommendations.push('Ensure each <img> has alt text identifying the company name (e.g., alt="Amazon logo").');
  recommendations.push('Add a visible heading "As seen on" or "Clients & partners" above the strip for sighted users.');

  // --- Overall WCAG level ---
  let wcagLevel: WcagGrade;
  if (issues.length === 0) {
    wcagLevel = 'AAA';
  } else if (onLight >= 80 && onDark >= 80 && altTextCoverage === 100) {
    wcagLevel = 'AA';
  } else if (onLight >= 60 || onDark >= 60) {
    wcagLevel = 'AA-Large';
  } else {
    wcagLevel = 'Fail';
  }

  return {
    altTextCoverage,
    minimumSizeCompliance,
    contrastCompliance: { onLight, onDark },
    wcagLevel,
    issues,
    recommendations,
  };
}
