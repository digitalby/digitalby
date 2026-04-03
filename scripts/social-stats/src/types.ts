/**
 * A follower/subscriber count together with a human-readable formatted label.
 */
export interface FollowerCount {
  readonly raw: number;
  readonly formatted: string;
}

/**
 * Anything that can return a follower count for a given platform.
 * Implement this to add Twitter, Mastodon, YouTube, etc.
 */
export interface FollowerProvider {
  readonly platform: string;
  fetchFollowerCount(): Promise<FollowerCount>;
}

/**
 * Describes a single badge occurrence to find and replace inside a file.
 *
 * `pattern`          - regex matching the exact text span to replace.
 *                      Use the `g` flag if it can appear more than once.
 * `buildReplacement` - given the new count, return the replacement string
 *                      for whatever `pattern` matched.
 */
export interface BadgeMatch {
  pattern: RegExp;
  buildReplacement(count: FollowerCount): string;
}

/**
 * Anything that can apply a set of badge replacements to a file.
 * Implement this to support formats other than shields.io (e.g. a JSON
 * data file, a custom SVG, a GitHub Gist, etc.).
 *
 * Returns true when the file was actually modified.
 */
export interface BadgeUpdater {
  apply(filePath: string, count: FollowerCount, matches: BadgeMatch[]): Promise<boolean>;
}
