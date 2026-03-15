import { TestimonialsReport, WcagGrade, LogoLegibilityReport, LogoAsset } from '../types';
import { SIZE_CONFIGS, THEME_CONFIGS, DEFAULT_LAYOUTS } from '../config';
import { renderTestimonialStrip, svgToDataUri, escapeHtml } from '../generator/renderer';

const GRADE_COLORS: Record<WcagGrade, { bg: string; text: string; label: string }> = {
  AAA:       { bg: '#15803d', text: '#fff', label: 'AAA' },
  AA:        { bg: '#1d4ed8', text: '#fff', label: 'AA' },
  'AA-Large':{ bg: '#b45309', text: '#fff', label: 'AA-Large' },
  Fail:      { bg: '#dc2626', text: '#fff', label: 'Fail' },
};

function gradeBadge(grade: WcagGrade, extra = ''): string {
  const { bg, text, label } = GRADE_COLORS[grade];
  return `<span class="badge" style="background:${bg};color:${text}" ${extra}>${label}</span>`;
}

function ratioCell(r: { ratio: number; grade: WcagGrade }): string {
  const { bg, text } = GRADE_COLORS[r.grade];
  return `<td style="background:${bg};color:${text};text-align:center;font-size:.8rem;font-weight:600;white-space:nowrap">${r.ratio}:1 ${gradeBadge(r.grade)}</td>`;
}

function scoreBar(score: number, label: string): string {
  const color = score >= 80 ? '#15803d' : score >= 60 ? '#b45309' : '#dc2626';
  return `
    <div style="margin:.5rem 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:.25rem">
        <span style="font-size:.85rem">${escapeHtml(label)}</span>
        <strong style="font-size:.85rem">${score}/100</strong>
      </div>
      <div style="background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden">
        <div style="background:${color};height:100%;width:${score}%;border-radius:4px;transition:width .3s"></div>
      </div>
    </div>`;
}

function colorSwatch(hex: string): string {
  return `<span title="${hex}" style="display:inline-block;width:14px;height:14px;background:${hex};border:1px solid #0002;border-radius:3px;vertical-align:middle;margin:0 2px"></span>`;
}

function buildLogoPreviews(logos: LogoAsset[]): string {
  // Build one data-URI lookup table used by JS; previews use <img data-logo="name"> filled by script
  const logoData = logos.reduce<Record<string, string>>((acc, l) => {
    acc[l.name] = svgToDataUri(l.svgContent);
    return acc;
  }, {});

  const sizeEntries = Object.values(SIZE_CONFIGS);
  const previewRows = sizeEntries.map(sc => {
    const lightTheme = THEME_CONFIGS['light'];
    const darkTheme  = THEME_CONFIGS['dark'];
    const lightHtml  = renderTestimonialStrip(logos, sc, lightTheme, 'inline');
    const darkHtml   = renderTestimonialStrip(logos, sc, darkTheme,  'inline');

    const lightSrc = `data:text/html,${encodeURIComponent(lightHtml)}`;
    const darkSrc  = `data:text/html,${encodeURIComponent(darkHtml)}`;
    const iframeH  = sc.height + sc.padding * 2 + sc.labelFontSize + sc.gap + 16;

    return `
      <div class="preview-row">
        <h3 class="preview-size-label"><code>${sc.name.toUpperCase()}</code> — ${sc.height}px</h3>
        <div class="preview-pair">
          <div class="preview-card preview-light">
            <div class="preview-card-label">Light</div>
            <iframe src="${lightSrc}" title="Testimonial strip ${sc.name} light" style="width:100%;height:${iframeH}px;border:0" loading="lazy"></iframe>
          </div>
          <div class="preview-card preview-dark">
            <div class="preview-card-label">Dark</div>
            <iframe src="${darkSrc}" title="Testimonial strip ${sc.name} dark" style="width:100%;height:${iframeH}px;border:0" loading="lazy"></iframe>
          </div>
        </div>
      </div>`;
  }).join('\n');

  const logoDataJson = JSON.stringify(logoData);
  return `<section id="previews">
    <h2>Visual Previews</h2>
    <p class="section-desc">Each strip rendered at all 5 sizes on light and dark backgrounds. Layouts: inline (shown), grid, and compact are available in the <code>output/testimonials/</code> directory.</p>
    ${previewRows}
    <script>
      // Populate any [data-logo] img tags that reference the lookup
      const _ld = ${logoDataJson};
      document.querySelectorAll('img[data-logo]').forEach(function(img) {
        img.src = _ld[img.dataset.logo] || '';
      });
    </script>
  </section>`;
}

function buildLegibilityTable(perLogo: LogoLegibilityReport[]): string {
  const rows = perLogo.map(r => `
    <tr>
      <td style="font-weight:600;white-space:nowrap">${escapeHtml(r.displayName)}</td>
      ${ratioCell(r.onWhite)}
      ${ratioCell(r.onLightGray)}
      ${ratioCell(r.onDarkGray)}
      ${ratioCell(r.onBlack)}
      <td style="font-size:.8rem">${r.bestForLight ? '✅' : '⚠️'} ${r.bestForDark ? '✅' : '⚠️'}</td>
      <td style="font-size:.8rem;max-width:220px">${escapeHtml(r.recommendation)}</td>
    </tr>`).join('');

  return `<section id="legibility">
    <h2>Legibility Analysis</h2>
    <p class="section-desc">
      Contrast ratio of each logo's primary colour(s) against common backgrounds.
      WCAG requires ≥3:1 for non-text UI components (AA-Large), ≥4.5:1 for normal text (AA), ≥7:1 (AAA).
      Columns show the <em>worst-case</em> ratio across the logo's top colours — the colour that limits legibility.
    </p>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>White #fff</th>
            <th>Light Gray #f5f5f5</th>
            <th>Dark Gray #1a1a1a</th>
            <th>Black #000</th>
            <th>Light / Dark</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="font-size:.8rem;color:#6b7280;margin-top:.5rem">✅ passes WCAG 3:1 on that background type &nbsp; ⚠️ does not pass</p>
  </section>`;
}

function buildPerLogoCards(perLogo: LogoLegibilityReport[]): string {
  const cards = perLogo.map(r => {
    const swatches = r.colorsAnalyzed.map(colorSwatch).join('');
    const issueList = r.issues.length > 0
      ? `<ul class="issue-list">${r.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : '<p class="ok-text">No issues detected.</p>';

    return `
      <div class="logo-card">
        <div class="logo-card-header">
          <strong>${escapeHtml(r.displayName)}</strong>
          <div>${gradeBadge(r.overallOnLight, 'title="Best grade on light bg"')} <span style="font-size:.7rem;color:#6b7280">light</span>
               ${gradeBadge(r.overallOnDark,  'title="Best grade on dark bg"')}  <span style="font-size:.7rem;color:#6b7280">dark</span>
          </div>
        </div>
        <div style="margin:.5rem 0">
          <span style="font-size:.75rem;color:#6b7280">Colours analysed:</span><br>
          ${swatches || '<em style="font-size:.75rem">None extracted</em>'}
        </div>
        <div style="font-size:.8rem;color:#374151;font-style:italic;margin-bottom:.5rem">${escapeHtml(r.recommendation)}</div>
        ${issueList}
        ${r.hasUntestableColors ? '<p class="warn-text">⚠ Contains gradients or external refs — manual review advised.</p>' : ''}
      </div>`;
  }).join('\n');

  return `<section id="per-logo">
    <h2>Per-Logo Details</h2>
    <p class="section-desc">Individual analysis for each logo including extracted colours, per-background grades, and actionable recommendations.</p>
    <div class="logo-card-grid">${cards}</div>
  </section>`;
}

function buildAccessibilitySection(report: TestimonialsReport): string {
  const a = report.accessibility;
  const wcagColor = GRADE_COLORS[a.wcagLevel];

  const complianceRows = Object.entries(a.minimumSizeCompliance)
    .map(([size, passes]) => `<tr><td><code>${size}</code> (${SIZE_CONFIGS[size as keyof typeof SIZE_CONFIGS]?.height ?? '?'}px)</td><td>${passes ? '✅ Pass' : '❌ Fail'}</td></tr>`)
    .join('');

  const issueList = a.issues.length > 0
    ? `<ul class="issue-list">${a.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    : '<p class="ok-text">No accessibility issues detected.</p>';

  const recList = `<ul class="rec-list">${a.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`;

  return `<section id="accessibility">
    <h2>Accessibility Audit</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${a.altTextCoverage}%</div>
        <div class="metric-label">Alt text coverage</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${a.contrastCompliance.onLight}%</div>
        <div class="metric-label">Logos pass on light bg</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${a.contrastCompliance.onDark}%</div>
        <div class="metric-label">Logos pass on dark bg</div>
      </div>
      <div class="metric-card" style="background:${wcagColor.bg};color:${wcagColor.text}">
        <div class="metric-value">${a.wcagLevel}</div>
        <div class="metric-label">Overall WCAG level</div>
      </div>
    </div>
    <h3>Minimum size compliance</h3>
    <table class="data-table" style="width:auto">
      <thead><tr><th>Size</th><th>Status</th></tr></thead>
      <tbody>${complianceRows}</tbody>
    </table>
    <h3 style="margin-top:1.5rem">Issues</h3>
    ${issueList}
    <h3 style="margin-top:1.5rem">Recommendations</h3>
    ${recList}
  </section>`;
}

function buildAestheticSection(report: TestimonialsReport): string {
  const ae = report.aesthetic;
  const b  = ae.breakdown;

  const suggestionList = ae.suggestions.length > 0
    ? `<ul class="issue-list">${ae.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    : '<p class="ok-text">No aesthetic issues detected.</p>';

  return `<section id="aesthetic">
    <h2>Aesthetic Analysis</h2>
    <p class="section-desc">Scores are derived from logo aspect-ratio variance, count, and layout characteristics. Spacing is always consistent as it is enforced via CSS <code>gap</code>.</p>
    <div style="max-width:480px">
      ${scoreBar(ae.overallScore,        'Overall Score')}
      ${scoreBar(ae.visualBalance,       'Visual Balance (aspect ratio uniformity)')}
      ${scoreBar(ae.sizeHarmony,         'Size Harmony (no extreme outliers)')}
      ${scoreBar(ae.logoCountScore,      'Logo Count (optimal: 6–12)')}
      ${scoreBar(ae.spacingConsistency,  'Spacing Consistency')}
    </div>
    <table class="data-table" style="width:auto;margin-top:1.5rem">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Logo count</td><td>${b.logoCount}</td></tr>
        <tr><td>Mean aspect ratio</td><td>${b.meanAspectRatio}:1</td></tr>
        <tr><td>Aspect ratio range</td><td>${b.aspectRatioMin}:1 – ${b.aspectRatioMax}:1</td></tr>
        <tr><td>Aspect ratio CV</td><td>${b.aspectRatioCv} (lower = more uniform)</td></tr>
        <tr><td>Suggested layout</td><td><code>${b.suggestedLayout}</code></td></tr>
      </tbody>
    </table>
    <h3 style="margin-top:1.5rem">Suggestions</h3>
    ${suggestionList}
  </section>`;
}

function buildSummaryCards(report: TestimonialsReport): string {
  const s = report.legibility.summary;
  const gradeBg = GRADE_COLORS[report.overallGrade];
  return `
    <div class="summary-cards">
      <div class="summary-card"><div class="sc-value">${report.meta.totalLogos}</div><div class="sc-label">Logos analysed</div></div>
      <div class="summary-card"><div class="sc-value">${s.logosPassingOnLight}</div><div class="sc-label">Pass on light bg</div></div>
      <div class="summary-card"><div class="sc-value">${s.logosPassingOnDark}</div><div class="sc-label">Pass on dark bg</div></div>
      <div class="summary-card"><div class="sc-value">${s.logosPassingBoth}</div><div class="sc-label">Pass on both</div></div>
      <div class="summary-card"><div class="sc-value">${report.aesthetic.overallScore}/100</div><div class="sc-label">Aesthetic score</div></div>
      <div class="summary-card" style="background:${gradeBg.bg};color:${gradeBg.text}">
        <div class="sc-value">${report.overallGrade}</div>
        <div class="sc-label">Overall WCAG grade</div>
      </div>
    </div>`;
}

const CSS = `
  :root{--font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;--radius:8px;--border:#e5e7eb}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--font);background:#f9fafb;color:#111827;line-height:1.6}
  header{background:#111827;color:#fff;padding:2rem;text-align:center}
  header h1{font-size:1.75rem;margin-bottom:.5rem}
  header p{color:#9ca3af;font-size:.9rem}
  main{max-width:1280px;margin:0 auto;padding:2rem 1rem}
  section{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-bottom:2rem}
  h2{font-size:1.25rem;margin-bottom:.75rem;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:.5rem}
  h3{font-size:1rem;margin-bottom:.5rem;color:#374151}
  .section-desc{color:#6b7280;font-size:.875rem;margin-bottom:1rem}
  .summary-cards{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:2rem}
  .summary-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1rem 1.5rem;min-width:130px;text-align:center}
  .sc-value{font-size:2rem;font-weight:700;line-height:1.1}
  .sc-label{font-size:.75rem;color:#6b7280;margin-top:.25rem}
  .badge{display:inline-block;padding:.1rem .4rem;border-radius:4px;font-size:.7rem;font-weight:700;line-height:1.4}
  .data-table{width:100%;border-collapse:collapse;font-size:.875rem}
  .data-table th{background:#f3f4f6;padding:.5rem .75rem;text-align:left;border:1px solid var(--border);white-space:nowrap}
  .data-table td{padding:.5rem .75rem;border:1px solid var(--border)}
  .data-table tr:hover td{background:#f9fafb}
  .logo-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-top:.5rem}
  .logo-card{border:1px solid var(--border);border-radius:var(--radius);padding:1rem}
  .logo-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem}
  .issue-list{color:#dc2626;font-size:.8rem;padding-left:1.25rem}
  .issue-list li{margin:.2rem 0}
  .rec-list{font-size:.85rem;color:#374151;padding-left:1.25rem}
  .rec-list li{margin:.3rem 0}
  .ok-text{color:#15803d;font-size:.8rem}
  .warn-text{color:#b45309;font-size:.8rem;margin-top:.5rem}
  .metric-grid{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
  .metric-card{background:#f3f4f6;border-radius:var(--radius);padding:1rem 1.5rem;min-width:140px;text-align:center}
  .metric-value{font-size:1.75rem;font-weight:700}
  .metric-label{font-size:.75rem;color:#6b7280;margin-top:.25rem}
  .preview-row{margin-bottom:2rem}
  .preview-size-label{margin-bottom:.75rem;font-size:1rem;color:#374151}
  .preview-pair{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  .preview-card{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
  .preview-card-label{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding:.4rem .75rem;background:#f3f4f6;border-bottom:1px solid var(--border);color:#374151}
  .preview-light{background:#fff}
  .preview-dark{background:#111827}
  code{background:#f3f4f6;padding:.1rem .3rem;border-radius:3px;font-size:.85em}
  @media(max-width:640px){.preview-pair{grid-template-columns:1fr}.summary-cards{flex-direction:column}}
`;

export function generateHtmlReport(report: TestimonialsReport): string {
  const date  = new Date(report.meta.generatedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  const sizes = Object.values(SIZE_CONFIGS);

  const summaryBullets = report.overallSummary
    .map(s => `<li>${escapeHtml(s)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Testimonials Generator Report — ${date}</title>
  <style>${CSS}</style>
</head>
<body>
<header>
  <h1>Testimonials Generator Report</h1>
  <p>Generated ${escapeHtml(date)} &nbsp;·&nbsp; ${report.meta.totalLogos} logos &nbsp;·&nbsp; v${report.meta.generatorVersion} &nbsp;·&nbsp; ${gradeBadge(report.overallGrade)}</p>
</header>
<main>
  ${buildSummaryCards(report)}

  <section id="summary">
    <h2>Summary</h2>
    <ul class="rec-list">${summaryBullets}</ul>
  </section>

  ${buildLogoPreviews(report.logos)}
  ${buildLegibilityTable(report.legibility.perLogo)}
  ${buildPerLogoCards(report.legibility.perLogo)}
  ${buildAccessibilitySection(report)}
  ${buildAestheticSection(report)}

  <section id="sizes">
    <h2>Size Configurations</h2>
    <table class="data-table">
      <thead>
        <tr><th>Size</th><th>Height</th><th>Gap</th><th>Padding</th><th>Grid columns</th><th>Notes</th></tr>
      </thead>
      <tbody>
        ${sizes.map(sc => `<tr>
          <td><code>${sc.name}</code></td>
          <td>${sc.height}px</td>
          <td>${sc.gap}px</td>
          <td>${sc.padding}px</td>
          <td>${sc.gridColumns}</td>
          <td>${report.legibility.perSize.find(r => r.size === sc.name)?.recommendation ?? ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section id="layouts">
    <h2>Available Layouts</h2>
    <p class="section-desc">For each size × theme combination, three HTML files are produced in <code>output/testimonials/</code>.</p>
    <table class="data-table" style="width:auto">
      <thead><tr><th>Layout</th><th>Description</th></tr></thead>
      <tbody>
        ${DEFAULT_LAYOUTS.map(l => `<tr><td><code>${l}</code></td><td>${
          l === 'inline'   ? 'Horizontal flex strip, wraps at container edge.' :
          l === 'grid'     ? 'CSS Grid with fixed column count per size, better for many logos.' :
                             'Inline with tighter 50% gap — for space-constrained contexts.'
        }</td></tr>`).join('')}
      </tbody>
    </table>
  </section>
</main>
</body>
</html>`;
}
