import { PlatformConfig, BannerThemeConfig, BannerVariant, BannerAssets } from './types';
import { BORDER_RATIO, FONT_RATIO, LOGO_H_RATIO, STRIP_H_RATIO, WORDMARK_ASPECT_RATIO } from './config';
import { svgToDataUri } from '../generator/renderer';
import { LogoAsset } from '../types';

// Minimum slot width in px allocated to each client logo in the strip.
// Logos beyond the capacity are silently dropped to prevent overcrowding.
const MIN_LOGO_SLOT_W = 80;

export interface BannerDimensions {
  borderPx: number;
  fontPx: number;
  wordmarkH: number;
  wordmarkW: number;
  logoStripH: number;
  padding: number;
}

export function calcDimensions(platform: PlatformConfig): BannerDimensions {
  const h = platform.height;
  const borderPx   = Math.max(1, Math.round(h * BORDER_RATIO));
  const fontPx     = Math.round(h * FONT_RATIO);
  const wordmarkH  = Math.round(h * LOGO_H_RATIO);
  const wordmarkW  = Math.round(wordmarkH * WORDMARK_ASPECT_RATIO);
  const logoStripH = Math.round(h * STRIP_H_RATIO);
  const padding    = Math.round(h * 0.06);
  return { borderPx, fontPx, wordmarkH, wordmarkW, logoStripH, padding };
}

function renderBorder(w: number, h: number, t: number, color: string): string {
  const half = t / 2;
  return `  <rect x="${half}" y="${half}" width="${w - t}" height="${h - t}" fill="none" stroke="${color}" stroke-width="${t}"/>`;
}

function renderWordmarkImage(b64: string, x: number, y: number, w: number, h: number): string {
  return `  <image href="data:image/png;base64,${b64}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

function renderClientLogos(
  logos: LogoAsset[],
  startX: number,
  startY: number,
  availableW: number,
  stripH: number,
  filter: string | null,
): string {
  if (logos.length === 0) {
    return `  <g aria-label="Client logos"></g>`;
  }

  const logoH = Math.round(stripH * 0.7);
  const maxLogos = Math.max(1, Math.floor(availableW / MIN_LOGO_SLOT_W));
  const displayLogos = logos.slice(0, maxLogos);
  const slotW = availableW / displayLogos.length;

  const filterAttr = filter !== null ? ` style="filter:${filter}"` : '';

  const images = displayLogos.map((logo, i) => {
    const aspectRatio = logo.aspectRatio ?? 2;
    const logoW = Math.round(logoH * aspectRatio);
    const slotX = startX + i * slotW;
    const x = Math.round(slotX + (slotW - logoW) / 2);
    const y = Math.round(startY + (stripH - logoH) / 2);
    const uri = svgToDataUri(logo.svgContent);
    return `    <image href="${uri}" x="${x}" y="${y}" width="${logoW}" height="${logoH}"${filterAttr} preserveAspectRatio="xMidYMid meet"/>`;
  });

  return `  <g aria-label="Client logos">\n${images.join('\n')}\n  </g>`;
}

function renderBasicVariant(
  platform: PlatformConfig,
  theme: BannerThemeConfig,
  dims: BannerDimensions,
): string {
  const { width: W, height: H } = platform;
  const { borderPx, fontPx } = dims;

  return [
    `  <rect width="${W}" height="${H}" fill="${theme.background}"/>`,
    renderBorder(W, H, borderPx, theme.borderColor),
    `  <text x="${W / 2}" y="${H / 2}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontPx}" fill="${theme.textColor}" text-anchor="middle" dominant-baseline="central" letter-spacing="0.04em">yuryv.info</text>`,
  ].join('\n');
}

function renderAdvancedVariant(
  platform: PlatformConfig,
  theme: BannerThemeConfig,
  dims: BannerDimensions,
  assets: BannerAssets,
): string {
  const { width: W, height: H, safeZoneInset } = platform;
  const { borderPx, wordmarkH, wordmarkW, logoStripH, padding } = dims;

  // Wordmark: centered horizontally, anchored to the top safe zone
  const topY      = safeZoneInset + borderPx + padding;
  const wordmarkX = Math.round((W - wordmarkW) / 2);

  // Client logo strip: anchored to the bottom safe zone
  const bottomY    = H - safeZoneInset - borderPx - padding - logoStripH;
  const inset      = safeZoneInset + borderPx + padding;
  const availableW = W - 2 * inset;

  return [
    `  <rect width="${W}" height="${H}" fill="${theme.background}"/>`,
    renderBorder(W, H, borderPx, theme.borderColor),
    renderWordmarkImage(assets.wordmarkBase64, wordmarkX, topY, wordmarkW, wordmarkH),
    renderClientLogos(assets.clientLogos, inset, bottomY, availableW, logoStripH, theme.logoFilter),
  ].join('\n');
}

export function renderBannerSvg(
  platform: PlatformConfig,
  variant: BannerVariant,
  theme: BannerThemeConfig,
  assets: BannerAssets,
): string {
  const { width: W, height: H } = platform;
  const dims = calcDimensions(platform);

  const body = variant === 'basic'
    ? renderBasicVariant(platform, theme, dims)
    : renderAdvancedVariant(platform, theme, dims, assets);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${body}\n</svg>`;
}
