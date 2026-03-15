import { LogoAsset, TestimonialsReport, WcagGrade, Size } from '../types';
import { analyzeAllLogos, analyzeAllSizes } from './legibility';
import { auditAccessibility } from './accessibility';
import { scoreAesthetics } from './aesthetic';
import { GENERATOR_VERSION } from '../config';

const GRADE_RANK: Record<WcagGrade, number> = { Fail: 0, 'AA-Large': 1, AA: 2, AAA: 3 };

export async function runFullAnalysis(
  logos: LogoAsset[],
  logosDir: string,
  sizes: Size[],
): Promise<TestimonialsReport> {
  const perLogo = analyzeAllLogos(logos);
  const perSize = analyzeAllSizes(sizes);

  const logosPassingOnLight = perLogo.filter(r => r.bestForLight).length;
  const logosPassingOnDark  = perLogo.filter(r => r.bestForDark).length;
  const logosPassingBoth    = perLogo.filter(r => r.bestForLight && r.bestForDark).length;
  const logosWithIssues     = perLogo.filter(r => r.issues.length > 0).map(r => r.displayName);

  const aesthetic    = scoreAesthetics(logos);
  const accessibility = auditAccessibility(logos, perLogo, sizes);

  // Overall grade: take the best grade achievable across the logo set on at least one background type
  const perLogoGrades: WcagGrade[] = perLogo.map(r => {
    const candidates: WcagGrade[] = [r.overallOnLight, r.overallOnDark].filter(g => g !== 'Fail');
    return candidates.length > 0
      ? candidates.reduce((best, g) => GRADE_RANK[g] > GRADE_RANK[best] ? g : best)
      : 'Fail';
  });

  const failCount = perLogoGrades.filter(g => g === 'Fail').length;
  const overallGrade = accessibility.wcagLevel;

  const overallSummary: string[] = [
    `Analysed ${logos.length} logos across ${sizes.length} size configurations.`,
    `${logosPassingOnLight}/${logos.length} logos pass WCAG 3:1 contrast on light backgrounds.`,
    `${logosPassingOnDark}/${logos.length} logos pass WCAG 3:1 contrast on dark backgrounds.`,
    `${logosPassingBoth}/${logos.length} logos pass on both light and dark backgrounds.`,
  ];

  if (failCount === 0) {
    overallSummary.push('All logos meet the WCAG AA non-text contrast threshold on at least one background type.');
  } else {
    overallSummary.push(`${failCount} logo(s) fail WCAG on all tested backgrounds and require attention.`);
  }

  overallSummary.push(
    `Aesthetic score: ${aesthetic.overallScore}/100 — suggested layout: ${aesthetic.breakdown.suggestedLayout}.`,
  );
  overallSummary.push(`Overall accessibility grade: ${overallGrade}.`);

  return {
    meta: {
      generatedAt:      new Date().toISOString(),
      generatorVersion: GENERATOR_VERSION,
      logosDir,
      totalLogos:       logos.length,
    },
    logos,
    legibility: {
      perLogo,
      perSize,
      summary: { logosPassingOnLight, logosPassingOnDark, logosPassingBoth, logosWithIssues },
    },
    aesthetic,
    accessibility,
    overallGrade,
    overallSummary,
  };
}
