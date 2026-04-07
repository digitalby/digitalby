import type { LogoAsset } from '../types';

export type Platform = 'twitter' | 'linkedin' | 'youtube' | 'twitch';
export type BannerVariant = 'basic' | 'advanced';
export type BannerTheme = 'dark' | 'light' | 'yellow';

export interface PlatformConfig {
  name: Platform;
  displayName: string;
  width: number;
  height: number;
  /** Content should not bleed past this inset on any edge (px). */
  safeZoneInset: number;
}

export interface BannerThemeConfig {
  name: BannerTheme;
  background: string;
  textColor: string;
  borderColor: string;
  /** CSS filter string applied to client logos, or null for none. */
  logoFilter: string | null;
}

export interface BannerAssets {
  /** Base64-encoded PNG (no data URI prefix) for yv_logo.png. */
  yvLogoBase64: string;
  /** Base64-encoded PNG (no data URI prefix) for yuryv_info.png (horizontal wordmark). */
  wordmarkBase64: string;
  /** Client brand logos loaded from the logos directory. */
  clientLogos: LogoAsset[];
}

export interface GeneratedBanner {
  platform: Platform;
  variant: BannerVariant;
  theme: BannerTheme;
  svgPath: string;
  pngPath: string;
  width: number;
  height: number;
}

export interface BannerConfig {
  /** Path to the assets directory containing the PNG brand files. */
  assetsDir: string;
  /** Path to the logos directory containing client SVG logos. */
  logosDir: string;
  /** Root output directory; banners are written under outputDir/banners/. */
  outputDir: string;
  platforms: Platform[];
  variants: BannerVariant[];
  themes: BannerTheme[];
}

export interface BannerGenerationResult {
  banners: GeneratedBanner[];
}
