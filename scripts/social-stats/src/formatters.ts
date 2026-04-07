import type { FollowerCount } from './types';

export function formatCount(raw: number): FollowerCount {
  let formatted: string;
  if (raw >= 1_000_000) {
    formatted = `${(raw / 1_000_000).toFixed(1)}M`;
  } else if (raw >= 1_000) {
    formatted = `${(raw / 1_000).toFixed(1)}k`;
  } else {
    formatted = String(raw);
  }
  return { raw, formatted };
}
