import { TestimonialsReport } from '../types';

/**
 * Serialise the report to pretty-printed JSON.
 * SVG content is stripped from logos to keep the file size manageable.
 */
export function generateJsonReport(report: TestimonialsReport): string {
  const slim = {
    ...report,
    logos: report.logos.map(({ svgContent: _svg, ...rest }) => rest),
  };
  return JSON.stringify(slim, null, 2);
}
