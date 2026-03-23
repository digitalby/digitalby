import fs from 'fs';
import path from 'path';
import { TestimonialsReport, GeneratorConfig, GeneratedAsset, GenerationResult } from '../types';
import { SIZE_CONFIGS, THEME_CONFIGS, resolveOutputPaths } from '../config';
import { renderTestimonialStrip, renderMarkdownSnippet, renderSnippetsDoc } from '../generator/renderer';
import { generateHtmlReport } from './htmlReport';
import { generateJsonReport } from './jsonReport';
import { generateMarkdownReport, generateSummaryMarkdown } from './markdownReport';

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export async function writeAllOutputs(
  report: TestimonialsReport,
  config: GeneratorConfig,
): Promise<GenerationResult> {
  const { testimonials: testimonialsDir, reports: reportsDir, snippets: snippetsDir } =
    resolveOutputPaths(config.outputDir);

  const assets: GeneratedAsset[] = [];
  const sizeConfigs  = config.sizes.map(s => SIZE_CONFIGS[s]);
  const themeConfigs = config.themes.map(t => THEME_CONFIGS[t]);

  // --- Testimonial HTML strips ---
  for (const sizeConfig of sizeConfigs) {
    for (const themeConfig of themeConfigs) {
      for (const layout of config.layouts) {
        const html     = renderTestimonialStrip(report.logos, sizeConfig, themeConfig, layout);
        const outPath  = path.join(testimonialsDir, sizeConfig.name, themeConfig.name, `${layout}.html`);
        const mdSnippet = renderMarkdownSnippet(report.logos, sizeConfig);

        writeFile(outPath, html);
        assets.push({ size: sizeConfig.name, theme: themeConfig.name, layout, htmlPath: outPath, markdownSnippet: mdSnippet });
      }
    }
  }

  // --- Markdown snippets doc ---
  const snippetsDoc = renderSnippetsDoc(report.logos, sizeConfigs);
  const snippetsPath = path.join(snippetsDir, 'snippets.md');
  writeFile(snippetsPath, snippetsDoc);

  // Per-size snippet files
  for (const sc of sizeConfigs) {
    writeFile(
      path.join(snippetsDir, `${sc.name}.md`),
      renderMarkdownSnippet(report.logos, sc),
    );
  }

  // --- Reports ---
  const htmlReportPath     = path.join(reportsDir, 'report.html');
  const jsonReportPath     = path.join(reportsDir, 'report.json');
  const markdownReportPath = path.join(reportsDir, 'report.md');
  const summaryPath        = path.join(reportsDir, 'summary.md');

  writeFile(htmlReportPath,     generateHtmlReport(report));
  writeFile(jsonReportPath,     generateJsonReport(report));
  writeFile(markdownReportPath, generateMarkdownReport(report));
  writeFile(summaryPath,        generateSummaryMarkdown(report));

  return {
    assets,
    report,
    reportPaths: {
      html:     htmlReportPath,
      json:     jsonReportPath,
      markdown: markdownReportPath,
      summary:  summaryPath,
    },
  };
}
