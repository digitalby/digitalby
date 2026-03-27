import {
  PLATFORM_CONFIGS,
  BANNER_THEME_CONFIGS,
  BORDER_RATIO,
  FONT_RATIO,
  LOGO_H_RATIO,
  STRIP_H_RATIO,
  WORDMARK_ASPECT_RATIO,
  DEFAULT_PLATFORMS,
  DEFAULT_VARIANTS,
  DEFAULT_BANNER_THEMES,
} from '../src/banner/config';

describe('PLATFORM_CONFIGS', () => {
  it('defines twitter with standard dimensions', () => {
    expect(PLATFORM_CONFIGS.twitter.width).toBe(1500);
    expect(PLATFORM_CONFIGS.twitter.height).toBe(500);
  });

  it('defines linkedin with standard dimensions', () => {
    expect(PLATFORM_CONFIGS.linkedin.width).toBe(1584);
    expect(PLATFORM_CONFIGS.linkedin.height).toBe(396);
  });

  it('defines youtube with standard dimensions', () => {
    expect(PLATFORM_CONFIGS.youtube.width).toBe(2560);
    expect(PLATFORM_CONFIGS.youtube.height).toBe(1440);
  });

  it('all platforms have positive safeZoneInset', () => {
    for (const config of Object.values(PLATFORM_CONFIGS)) {
      expect(config.safeZoneInset).toBeGreaterThan(0);
    }
  });

  it('all platforms are landscape (width > height)', () => {
    for (const config of Object.values(PLATFORM_CONFIGS)) {
      expect(config.width).toBeGreaterThan(config.height);
    }
  });

  it('name field matches the Record key', () => {
    expect(PLATFORM_CONFIGS.twitter.name).toBe('twitter');
    expect(PLATFORM_CONFIGS.linkedin.name).toBe('linkedin');
    expect(PLATFORM_CONFIGS.youtube.name).toBe('youtube');
  });
});

describe('scaling ratios produce sensible pixel values', () => {
  it('border on twitter is between 2 and 8 px', () => {
    const borderPx = Math.round(PLATFORM_CONFIGS.twitter.height * BORDER_RATIO);
    expect(borderPx).toBeGreaterThanOrEqual(2);
    expect(borderPx).toBeLessThanOrEqual(8);
  });

  it('font on twitter is between 30 and 60 px', () => {
    const fontPx = Math.round(PLATFORM_CONFIGS.twitter.height * FONT_RATIO);
    expect(fontPx).toBeGreaterThanOrEqual(30);
    expect(fontPx).toBeLessThanOrEqual(60);
  });

  it('border scales proportionally: youtube > twitter', () => {
    const twitterBorder = Math.round(PLATFORM_CONFIGS.twitter.height  * BORDER_RATIO);
    const youtubeBorder = Math.round(PLATFORM_CONFIGS.youtube.height  * BORDER_RATIO);
    expect(youtubeBorder).toBeGreaterThan(twitterBorder);
  });

  it('wordmark aspect ratio matches yuryv_info.png native dimensions (172×56)', () => {
    expect(WORDMARK_ASPECT_RATIO).toBeCloseTo(172 / 56, 2);
  });

  it('logo strip height ratio is less than 0.5 (below half the canvas)', () => {
    expect(STRIP_H_RATIO).toBeLessThan(0.5);
  });

  it('logo height ratio is less than or equal to strip height ratio', () => {
    expect(LOGO_H_RATIO).toBeLessThanOrEqual(STRIP_H_RATIO);
  });
});

describe('BANNER_THEME_CONFIGS', () => {
  it('dark theme has near-black background', () => {
    expect(BANNER_THEME_CONFIGS.dark.background).toBe('#0f0f0f');
  });

  it('dark theme has white text', () => {
    expect(BANNER_THEME_CONFIGS.dark.textColor).toBe('#ffffff');
  });

  it('light theme has white background', () => {
    expect(BANNER_THEME_CONFIGS.light.background).toBe('#ffffff');
  });

  it('light theme has black text', () => {
    expect(BANNER_THEME_CONFIGS.light.textColor).toBe('#0f0f0f');
  });

  it('yellow theme uses brand yellow as background', () => {
    expect(BANNER_THEME_CONFIGS.yellow.background).toBe('#f5c518');
  });

  it('yellow theme has dark border (not yellow-on-yellow)', () => {
    expect(BANNER_THEME_CONFIGS.yellow.borderColor).toBe('#0f0f0f');
  });

  it('dark and light themes use brand yellow border', () => {
    expect(BANNER_THEME_CONFIGS.dark.borderColor).toBe('#f5c518');
    expect(BANNER_THEME_CONFIGS.light.borderColor).toBe('#f5c518');
  });

  it('name field matches the Record key', () => {
    expect(BANNER_THEME_CONFIGS.dark.name).toBe('dark');
    expect(BANNER_THEME_CONFIGS.light.name).toBe('light');
    expect(BANNER_THEME_CONFIGS.yellow.name).toBe('yellow');
  });
});

describe('defaults', () => {
  it('DEFAULT_PLATFORMS includes all three platforms', () => {
    expect(DEFAULT_PLATFORMS).toContain('twitter');
    expect(DEFAULT_PLATFORMS).toContain('linkedin');
    expect(DEFAULT_PLATFORMS).toContain('youtube');
  });

  it('DEFAULT_VARIANTS includes basic and advanced', () => {
    expect(DEFAULT_VARIANTS).toContain('basic');
    expect(DEFAULT_VARIANTS).toContain('advanced');
  });

  it('DEFAULT_BANNER_THEMES includes dark and light', () => {
    expect(DEFAULT_BANNER_THEMES).toContain('dark');
    expect(DEFAULT_BANNER_THEMES).toContain('light');
  });

  it('DEFAULT_BANNER_THEMES does not include yellow (opt-in only)', () => {
    expect(DEFAULT_BANNER_THEMES).not.toContain('yellow');
  });
});
