import { formatCount } from '../formatters';
import type { FollowerCount, FollowerProvider } from '../types';

export interface LinkedInProviderConfig {
  vanityName: string;
  liAt: string;
  jsessionId: string;
}

interface VoyagerNetworkInfoResponse {
  followersCount: number;
}

export class LinkedInProvider implements FollowerProvider {
  readonly platform = 'linkedin';

  private readonly config: LinkedInProviderConfig;

  constructor(config: LinkedInProviderConfig) {
    this.config = config;
  }

  async fetchFollowerCount(): Promise<FollowerCount> {
    const { vanityName, liAt, jsessionId } = this.config;
    const url = `https://www.linkedin.com/voyager/api/identity/profiles/${vanityName}/networkinfo`;

    const response = await fetch(url, {
      headers: {
        'Cookie': `li_at=${liAt}; JSESSIONID="${jsessionId}"`,
        'Csrf-Token': jsessionId,
        'X-Restli-Protocol-Version': '2.0.0',
        'X-Li-Lang': 'en_US',
      },
    });

    if (!response.ok) {
      throw new Error(
        `LinkedIn voyager API returned ${response.status} ${response.statusText} for profile "${vanityName}"`,
      );
    }

    const data = await response.json() as VoyagerNetworkInfoResponse;

    if (typeof data.followersCount !== 'number') {
      throw new Error(
        `Unexpected response shape from LinkedIn API: ${JSON.stringify(data)}`,
      );
    }

    return formatCount(data.followersCount);
  }
}
