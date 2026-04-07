import { renderBannerSvg, calcDimensions } from '../src/banner/renderer';
import { PLATFORM_CONFIGS, BANNER_THEME_CONFIGS } from '../src/banner/config';
import { BannerAssets } from '../src/banner/types';
import { LogoAsset } from '../src/types';

function makeMockLogo(name: string): LogoAsset {
  return {
    name,
    displayName:     name.charAt(0).toUpperCase() + name.slice(1),
    filePath:        `/tmp/${name}.svg`,
    svgContent:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect fill="#000" width="100" height="40"/></svg>`,
    viewBox:         { x: 0, y: 0, width: 100, height: 40 },
    aspectRatio:     2.5,
    colors:          [],
    dominantColor:   null,
    hasGradients:    false,
    hasExternalRefs: false,
    fileSize:        200,
  };
}

const mockAssets: BannerAssets = {
  yvLogoBase64:   'AAAA',
  wordmarkBase64: 'BBBB',
  clientLogos: [makeMockLogo('acme'), makeMockLogo('globex')],
};

// ─── calcDimensions ──────────────────────────────────────────────────────────

describe('calcDimensions', () => {
  it('returns all positive values for twitter', () => {
    const dims = calcDimensions(PLATFORM_CONFIGS.twitter);
    expect(dims.borderPx).toBeGreaterThan(0);
    expect(dims.fontPx).toBeGreaterThan(0);
    expect(dims.wordmarkH).toBeGreaterThan(0);
    expect(dims.wordmarkW).toBeGreaterThan(0);
    expect(dims.logoStripH).toBeGreaterThan(0);
    expect(dims.padding).toBeGreaterThan(0);
  });

  it('wordmarkW is wider than wordmarkH (landscape aspect)', () => {
    const dims = calcDimensions(PLATFORM_CONFIGS.twitter);
    expect(dims.wordmarkW).toBeGreaterThan(dims.wordmarkH);
  });

  it('youtube produces larger values than twitter', () => {
    const tw = calcDimensions(PLATFORM_CONFIGS.twitter);
    const yt = calcDimensions(PLATFORM_CONFIGS.youtube);
    expect(yt.fontPx).toBeGreaterThan(tw.fontPx);
    expect(yt.borderPx).toBeGreaterThan(tw.borderPx);
    expect(yt.wordmarkH).toBeGreaterThan(tw.wordmarkH);
  });
});

// ─── Basic variant ───────────────────────────────────────────────────────────

describe('renderBannerSvg — basic variant', () => {
  const platform = PLATFORM_CONFIGS.twitter;
  const theme    = BANNER_THEME_CONFIGS.dark;

  let svg: string;
  beforeEach(() => {
    svg = renderBannerSvg(platform, 'basic', theme, mockAssets);
  });

  it('opens with a valid SVG element with correct dimensions', () => {
    expect(svg).toContain(`width="${platform.width}"`);
    expect(svg).toContain(`height="${platform.height}"`);
    expect(svg).toContain(`viewBox="0 0 ${platform.width} ${platform.height}"`);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('includes a background rect using the theme background color', () => {
    expect(svg).toContain(`fill="${theme.background}"`);
  });

  it('includes a border rect with fill none and theme border color', () => {
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(`stroke="${theme.borderColor}"`);
    expect(svg).toContain('stroke-width=');
  });

  it('includes centered semibold serif text reading yuryv.info', () => {
    expect(svg).toContain('yuryv.info');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="central"');
    expect(svg).toContain('font-weight="600"');
    expect(svg).toContain('letter-spacing="-0.02em"');
    expect(svg).toContain('Palatino Linotype');
    expect(svg).toContain('serif');
  });

  it('text uses the theme text color', () => {
    expect(svg).toContain(`fill="${theme.textColor}"`);
  });

  it('does not embed the wordmark PNG', () => {
    expect(svg).not.toContain('BBBB');
  });

  it('does not include a client logos group', () => {
    expect(svg).not.toContain('aria-label="Client logos"');
  });
});

// ─── Advanced variant ────────────────────────────────────────────────────────

describe('renderBannerSvg — advanced variant', () => {
  const platform = PLATFORM_CONFIGS.twitter;
  const theme    = BANNER_THEME_CONFIGS.dark;

  let svg: string;
  beforeEach(() => {
    svg = renderBannerSvg(platform, 'advanced', theme, mockAssets);
  });

  it('embeds the wordmark PNG as a base64 data URI', () => {
    expect(svg).toContain('data:image/png;base64,BBBB');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('includes a client logos group with SVG data URIs', () => {
    expect(svg).toContain('aria-label="Client logos"');
    expect(svg).toContain('data:image/svg+xml,');
  });

  it('does not include the yuryv.info text node', () => {
    expect(svg).not.toContain('>yuryv.info<');
  });

  it('renders without throwing for all platforms', () => {
    for (const p of Object.values(PLATFORM_CONFIGS)) {
      expect(() => renderBannerSvg(p, 'advanced', theme, mockAssets)).not.toThrow();
    }
  });

  it('renders without throwing for all themes', () => {
    for (const t of Object.values(BANNER_THEME_CONFIGS)) {
      expect(() => renderBannerSvg(platform, 'advanced', t, mockAssets)).not.toThrow();
    }
  });
});

// ─── Theme variants ──────────────────────────────────────────────────────────

describe('renderBannerSvg — theme color correctness', () => {
  it('light theme uses white background', () => {
    const svg = renderBannerSvg(PLATFORM_CONFIGS.linkedin, 'basic', BANNER_THEME_CONFIGS.light, mockAssets);
    expect(svg).toContain('#ffffff');
  });

  it('yellow theme uses brand yellow as background and black border', () => {
    const svg = renderBannerSvg(PLATFORM_CONFIGS.linkedin, 'basic', BANNER_THEME_CONFIGS.yellow, mockAssets);
    expect(svg).toContain('#f5c518');
    expect(svg).toContain(`stroke="#0f0f0f"`);
  });

  it('all three themes render basic for all platforms without throwing', () => {
    for (const p of Object.values(PLATFORM_CONFIGS)) {
      for (const t of Object.values(BANNER_THEME_CONFIGS)) {
        expect(() => renderBannerSvg(p, 'basic', t, mockAssets)).not.toThrow();
      }
    }
  });
});

// ─── Empty client logo list (edge case) ──────────────────────────────────────

describe('renderBannerSvg — edge cases', () => {
  it('advanced variant with no client logos does not throw', () => {
    const noLogosAssets: BannerAssets = { ...mockAssets, clientLogos: [] };
    // With 0 logos the strip is empty but should not crash
    expect(() =>
      renderBannerSvg(PLATFORM_CONFIGS.twitter, 'advanced', BANNER_THEME_CONFIGS.dark, noLogosAssets)
    ).not.toThrow();
  });

  it('produces well-formed SVG wrapper for every platform × variant combination', () => {
    for (const p of Object.values(PLATFORM_CONFIGS)) {
      for (const v of (['basic', 'advanced'] as const)) {
        const svg = renderBannerSvg(p, v, BANNER_THEME_CONFIGS.dark, mockAssets);
        expect(svg.startsWith('<svg ')).toBe(true);
        expect(svg.endsWith('</svg>')).toBe(true);
      }
    }
  });
});
