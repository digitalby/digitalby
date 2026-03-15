import { LogoAsset, SizeConfig, ThemeConfig, Layout } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Encode SVG content as a data URI (URL-encoded, preserves Unicode) */
function svgToDataUri(svgContent: string): string {
  const compact = svgContent.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return `data:image/svg+xml,${encodeURIComponent(compact)}`;
}

function buildLogoImg(logo: LogoAsset, height: number): string {
  const src = svgToDataUri(logo.svgContent);
  return `<img src="${src}" alt="${escapeHtml(logo.displayName)}" height="${height}" width="auto" loading="lazy" role="img" aria-label="${escapeHtml(logo.displayName)} logo">`;
}

function buildStyles(theme: ThemeConfig, size: SizeConfig, layout: Layout): string {
  const gap     = `${size.gap}px`;
  const padding = `${size.padding}px`;
  const bg      = theme.name === 'transparent' ? 'transparent' : theme.background;

  const layoutCss = layout === 'grid'
    ? `display:grid;grid-template-columns:repeat(${size.gridColumns},auto);align-items:center;justify-items:center;justify-content:center;`
    : layout === 'compact'
    ? `display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:${Math.round(size.gap * 0.5)}px;`
    : `display:flex;align-items:center;justify-content:center;flex-wrap:wrap;`;

  return `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${bg};min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .container{text-align:center;padding:${padding};width:100%;max-width:1400px}
    .label{font-size:${size.labelFontSize}px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:${theme.labelColor};margin-bottom:${Math.round(size.gap * 0.75)}px}
    .strip{${layoutCss}gap:${gap}}
    .logo-item{display:flex;align-items:center;justify-content:center}
    .logo-item img{display:block;height:${size.height}px;width:auto}
  `.replace(/\n\s+/g, '');
}

export function renderTestimonialStrip(
  logos: LogoAsset[],
  sizeConfig: SizeConfig,
  theme: ThemeConfig,
  layout: Layout,
): string {
  const logoItems = logos
    .map(logo => `      <li class="logo-item">\n        ${buildLogoImg(logo, sizeConfig.height)}\n      </li>`)
    .join('\n');

  const checkerboard = theme.name === 'transparent'
    ? ' style="background:repeating-conic-gradient(#e0e0e0 0% 25%,#f8f8f8 0% 50%) 0 0/20px 20px"'
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Testimonials — ${sizeConfig.name.toUpperCase()} — ${theme.name} — ${layout}</title>
  <style>${buildStyles(theme, sizeConfig, layout)}</style>
</head>
<body${checkerboard}>
  <div class="container">
    <p class="label">As seen on</p>
    <ul class="strip" role="list" aria-label="Client and partner logos">
${logoItems}
    </ul>
  </div>
</body>
</html>`;
}

/** Markdown snippet using relative paths — suitable for README embedding */
export function renderMarkdownSnippet(
  logos: LogoAsset[],
  sizeConfig: SizeConfig,
  logosBaseUrl = 'assets/logos',
): string {
  const imgs = logos
    .map(l => `<img src="${logosBaseUrl}/${l.name}.svg" alt="${l.displayName}" height="${sizeConfig.height}">`)
    .join('&nbsp;&nbsp;\n  ');

  return [
    `<!-- Testimonials strip — size: ${sizeConfig.name} (${sizeConfig.height}px) -->`,
    `<p align="center">`,
    `  ${imgs}`,
    `</p>`,
  ].join('\n');
}

/** All sizes as a single Markdown document */
export function renderSnippetsDoc(
  logos: LogoAsset[],
  sizeConfigs: SizeConfig[],
  logosBaseUrl = 'assets/logos',
): string {
  const sections = sizeConfigs.map(sc => {
    const label   = `### \`${sc.name}\` — ${sc.height}px`;
    const snippet = renderMarkdownSnippet(logos, sc, logosBaseUrl);
    return `${label}\n\n\`\`\`html\n${snippet}\n\`\`\``;
  });

  return [
    '# Testimonials Snippets',
    '',
    'Copy any snippet below directly into your README.',
    '',
    '---',
    '',
    sections.join('\n\n---\n\n'),
  ].join('\n');
}

export { escapeHtml, buildLogoImg, svgToDataUri };
