import path from 'node:path';
import type { BadgeMatch, BadgeUpdater, FollowerProvider } from './types';
import { LinkedInProvider } from './providers/linkedin';
import { ShieldsBadgeUpdater } from './updaters/shieldsBadge';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Core runner. Accepts any provider and updater so it can be tested with
 * fakes or adapted to other platforms without changing this file.
 */
export async function run(
  provider: FollowerProvider,
  updater: BadgeUpdater,
  filePath: string,
  matches: BadgeMatch[],
): Promise<void> {
  const count = await provider.fetchFollowerCount();
  console.log(`${provider.platform}: ${count.raw} followers (${count.formatted})`);

  const changed = await updater.apply(filePath, count, matches);

  if (changed) {
    console.log(`Updated badge in ${filePath}`);
  } else {
    console.log('Badge already up to date, no changes written.');
  }
}

async function main(): Promise<void> {
  const provider = new LinkedInProvider({
    vanityName: requireEnv('LINKEDIN_VANITY_NAME'),
    liAt: requireEnv('LINKEDIN_LI_AT'),
    jsessionId: requireEnv('LINKEDIN_JSESSIONID'),
  });

  const readmePath = path.resolve(process.env['README_PATH'] ?? 'README.md');

  const matches: BadgeMatch[] = [
    {
      // Matches the label segment between "LinkedIn-" and the hex color,
      // e.g. "Follow" on first run, "1.2k_followers" on subsequent runs.
      // The `g` flag handles any duplicate badges in the same file.
      pattern: /img\.shields\.io\/badge\/LinkedIn-[^-]+-0A66C2/g,
      buildReplacement: (count) =>
        `img.shields.io/badge/LinkedIn-${count.formatted}_followers-0A66C2`,
    },
  ];

  await run(provider, new ShieldsBadgeUpdater(), readmePath, matches);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
