import fs from 'fs';
import path from 'path';
import { BannerConfig, BannerGenerationResult, GeneratedBanner } from './types';
import { PLATFORM_CONFIGS, BANNER_THEME_CONFIGS } from './config';
import { loadBannerAssets } from './assetLoader';
import { renderBannerSvg } from './renderer';

export async function generateBanners(config: BannerConfig): Promise<BannerGenerationResult> {
  const assets = await loadBannerAssets(config.assetsDir, config.logosDir);
  const banners: GeneratedBanner[] = [];

  for (const platform of config.platforms) {
    const platformConfig = PLATFORM_CONFIGS[platform];

    for (const variant of config.variants) {
      for (const theme of config.themes) {
        const themeConfig = BANNER_THEME_CONFIGS[theme];
        const svg = renderBannerSvg(platformConfig, variant, themeConfig, assets);

        const dir = path.join(config.outputDir, 'banners', platform, variant);
        fs.mkdirSync(dir, { recursive: true });

        const svgPath = path.join(dir, `${theme}.svg`);
        fs.writeFileSync(svgPath, svg, 'utf8');

        banners.push({
          platform,
          variant,
          theme,
          svgPath,
          width:  platformConfig.width,
          height: platformConfig.height,
        });
      }
    }
  }

  return { banners };
}
