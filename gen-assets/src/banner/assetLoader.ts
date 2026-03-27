import fs from 'fs';
import path from 'path';
import { loadLogos } from '../generator/logoLoader';
import { BannerAssets } from './types';

export async function loadBannerAssets(
  assetsDir: string,
  logosDir: string,
): Promise<BannerAssets> {
  const yvLogoPath   = path.join(assetsDir, 'yv_logo.png');
  const wordmarkPath = path.join(assetsDir, 'yuryv_info.png');

  if (!fs.existsSync(yvLogoPath)) {
    throw new Error(`Missing brand asset: ${yvLogoPath}`);
  }
  if (!fs.existsSync(wordmarkPath)) {
    throw new Error(`Missing brand asset: ${wordmarkPath}`);
  }

  const yvLogoBase64   = fs.readFileSync(yvLogoPath,   'base64');
  const wordmarkBase64 = fs.readFileSync(wordmarkPath, 'base64');
  const clientLogos    = await loadLogos(logosDir);

  return { yvLogoBase64, wordmarkBase64, clientLogos };
}
