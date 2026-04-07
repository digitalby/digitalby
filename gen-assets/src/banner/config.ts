import { Platform, PlatformConfig, BannerThemeConfig, BannerTheme, BannerVariant } from './types';

// Standard banner dimensions per platform (2025 recommended specs).
// To add a new platform: add an entry here and expand the Platform union in types.ts.
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'twitter',
    displayName: 'X / Twitter',
    width: 1500,
    height: 500,
    safeZoneInset: 60,
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    width: 1584,
    height: 396,
    safeZoneInset: 40,
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    width: 2560,
    height: 1440,
    // YouTube's safe area is approximately the central 1546×423 region.
    safeZoneInset: 420,
  },
  twitch: {
    name: 'twitch',
    displayName: 'Twitch',
    width: 1200,
    height: 480,
    safeZoneInset: 40,
  },
};

// Proportional scaling constants — all derived pixel values are computed as:
//   px = Math.round(platformHeight * RATIO)
// Changing a ratio adjusts the visual weight uniformly across all platforms.
export const BORDER_RATIO   = 0.006;   // ~3px on Twitter (500px), ~9px on YouTube (1440px)
export const FONT_RATIO     = 0.075;   // ~37px on Twitter, ~108px on YouTube
export const LOGO_H_RATIO   = 0.18;    // wordmark rendered height
export const STRIP_H_RATIO  = 0.22;    // client logo strip rendered height

// Native pixel dimensions of yuryv_info.png: 172 × 56
export const WORDMARK_ASPECT_RATIO = 172 / 56;

export const BRAND_YELLOW = '#f5c518';
export const BRAND_BLACK  = '#0f0f0f';
export const BRAND_WHITE  = '#ffffff';

export const BANNER_THEME_CONFIGS: Record<BannerTheme, BannerThemeConfig> = {
  dark: {
    name:        'dark',
    background:  BRAND_BLACK,
    textColor:   BRAND_WHITE,
    borderColor: BRAND_YELLOW,
    logoFilter:  null,
  },
  light: {
    name:        'light',
    background:  BRAND_WHITE,
    textColor:   BRAND_BLACK,
    borderColor: BRAND_YELLOW,
    logoFilter:  null,
  },
  yellow: {
    name:        'yellow',
    background:  BRAND_YELLOW,
    textColor:   BRAND_BLACK,
    borderColor: BRAND_BLACK,
    logoFilter:  null,
  },
};

export const DEFAULT_PLATFORMS: Platform[]        = ['twitter', 'linkedin', 'youtube', 'twitch'];
export const DEFAULT_VARIANTS: BannerVariant[]    = ['basic', 'advanced'];
export const DEFAULT_BANNER_THEMES: BannerTheme[] = ['dark', 'light'];
