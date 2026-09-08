import type { PublicPortfolio } from '@devsure/contracts';
import { getApiBaseUrl } from '@/lib/config';

export async function getPortfolio(): Promise<PublicPortfolio> {
  const response = await fetch(`${getApiBaseUrl()}/portfolio`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Portfolio request failed with status ${response.status}`);
  }

  return (await response.json()) as PublicPortfolio;
}
