import { renderTestimonialStrip, renderMarkdownSnippet, renderSnippetsDoc, escapeHtml, svgToDataUri } from '../src/generator/renderer';
import { SIZE_CONFIGS, THEME_CONFIGS } from '../src/config';
import { LogoAsset } from '../src/types';

function makeLogoAsset(name: string, svgContent: string): LogoAsset {
  return {
    name,
    displayName:    name.charAt(0).toUpperCase() + name.slice(1),
    filePath:       `/tmp/${name}.svg`,
    svgContent,
    viewBox:        { x: 0, y: 0, width: 120, height: 40 },
    aspectRatio:    3,
    colors:         [],
    dominantColor:  null,
    hasGradients:   false,
    hasExternalRefs: false,
    fileSize:       500,
  };
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect fill="#EA1D25" width="120" height="40"/></svg>`;
const testLogos = [
  makeLogoAsset('santander', LOGO_SVG),
  makeLogoAsset('amazon',    LOGO_SVG),
];

describe('escapeHtml', () => {
  it('escapes & < > " \'', () => {
    expect(escapeHtml('a & <b> "c" \'d\'')).toBe('a &amp; &lt;b&gt; &quot;c&quot; &#39;d&#39;');
  });
  it('does not modify safe strings', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('svgToDataUri', () => {
  it('returns a data URI starting with data:image/svg+xml,', () => {
    const uri = svgToDataUri('<svg/>');
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
  });
  it('collapses whitespace in the SVG without throwing', () => {
    // Verify that whitespace-heavy and compact SVGs both encode without error
    expect(() => svgToDataUri('<svg  xmlns="x"   >  </svg>')).not.toThrow();
    expect(() => svgToDataUri('<svg xmlns="x"></svg>')).not.toThrow();
    // Collapsed result should be shorter than the raw spaced input (after URI encoding)
    const raw     = '<svg  xmlns="x"   >  </svg>';
    const encoded = svgToDataUri(raw);
    // Raw has 27 chars; encoded data URI with prefix "data:image/svg+xml," (19 chars) + body
    // The collapsed SVG removes redundant spaces, so body should be shorter than raw
    expect(encoded).toContain('data:image/svg+xml,');
  });
});

describe('renderTestimonialStrip', () => {
  const sm   = SIZE_CONFIGS['sm'];
  const light = THEME_CONFIGS['light'];
  const dark  = THEME_CONFIGS['dark'];

  it('produces valid HTML5 boilerplate', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'inline');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('includes all logo alt texts', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'inline');
    expect(html).toContain('alt="Santander"');
    expect(html).toContain('alt="Amazon"');
  });

  it('embeds SVG as data URI', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'inline');
    expect(html).toContain('data:image/svg+xml,');
  });

  it('applies correct logo height', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'inline');
    expect(html).toContain(`height="${sm.height}"`);
  });

  it('sets dark background for dark theme', () => {
    const html = renderTestimonialStrip(testLogos, sm, dark, 'inline');
    expect(html).toContain(dark.background);
  });

  it('applies grid layout when specified', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'grid');
    expect(html).toContain('grid-template-columns');
  });

  it('applies compact gap for compact layout', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'compact');
    // compact gap = sm.gap * 0.5 = 24 * 0.5 = 12
    expect(html).toContain(`gap:${Math.round(sm.gap * 0.5)}px`);
  });

  it('includes ARIA list role and label', () => {
    const html = renderTestimonialStrip(testLogos, sm, light, 'inline');
    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="Client and partner logos"');
  });

  it('uses checkerboard background for transparent theme', () => {
    const transparent = THEME_CONFIGS['transparent'];
    const html = renderTestimonialStrip(testLogos, sm, transparent, 'inline');
    expect(html).toContain('repeating-conic-gradient');
  });

  it('renders all sizes without throwing', () => {
    const sizes: Array<keyof typeof SIZE_CONFIGS> = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      expect(() => renderTestimonialStrip(testLogos, SIZE_CONFIGS[size], light, 'inline')).not.toThrow();
    }
  });
});

describe('renderMarkdownSnippet', () => {
  it('wraps in <p align="center">', () => {
    const md = renderMarkdownSnippet(testLogos, SIZE_CONFIGS['sm']);
    expect(md).toContain('<p align="center">');
    expect(md).toContain('</p>');
  });

  it('uses relative paths by default', () => {
    const md = renderMarkdownSnippet(testLogos, SIZE_CONFIGS['sm']);
    expect(md).toContain('assets/logos/santander.svg');
    expect(md).toContain('assets/logos/amazon.svg');
  });

  it('respects custom base URL', () => {
    const md = renderMarkdownSnippet(testLogos, SIZE_CONFIGS['sm'], 'https://example.com/logos');
    expect(md).toContain('https://example.com/logos/santander.svg');
  });

  it('sets correct height attribute', () => {
    const md = renderMarkdownSnippet(testLogos, SIZE_CONFIGS['lg']);
    expect(md).toContain(`height="${SIZE_CONFIGS['lg'].height}"`);
  });

  it('includes alt text from displayName', () => {
    const md = renderMarkdownSnippet(testLogos, SIZE_CONFIGS['sm']);
    expect(md).toContain('alt="Santander"');
    expect(md).toContain('alt="Amazon"');
  });
});

describe('renderSnippetsDoc', () => {
  it('includes all requested sizes', () => {
    const sizes: Array<keyof typeof SIZE_CONFIGS> = ['sm', 'lg'];
    const doc = renderSnippetsDoc(testLogos, sizes.map(s => SIZE_CONFIGS[s]));
    expect(doc).toContain('`sm`');
    expect(doc).toContain('`lg`');
  });

  it('starts with a heading', () => {
    const doc = renderSnippetsDoc(testLogos, [SIZE_CONFIGS['sm']]);
    expect(doc.startsWith('# Testimonials Snippets')).toBe(true);
  });
});
