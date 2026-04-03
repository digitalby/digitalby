import { readFile, writeFile } from 'node:fs/promises';
import type { BadgeMatch, BadgeUpdater, FollowerCount } from '../types';

export class ShieldsBadgeUpdater implements BadgeUpdater {
  async apply(filePath: string, count: FollowerCount, matches: BadgeMatch[]): Promise<boolean> {
    const original = await readFile(filePath, 'utf8');
    let content = original;

    for (const { pattern, buildReplacement } of matches) {
      const replacement = buildReplacement(count);
      // Arrow function avoids special `$` handling in replacement strings.
      content = content.replace(pattern, () => replacement);
    }

    if (content === original) {
      return false;
    }

    await writeFile(filePath, content, 'utf8');
    return true;
  }
}
