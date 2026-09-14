import type { Profile, Service, Translations } from '@devsure/contracts';
import type { PublicPortfolio } from '@devsure/contracts';
import { getApiBaseUrl } from '@/lib/config';

export async function getPortfolio(): Promise<PublicPortfolio> {
  const response = await fetch(`${getApiBaseUrl()}/portfolio`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Portfolio request failed with status ${response.status}`);
  }

  return (await response.json()) as PublicPortfolio;
}

export interface SiteChromeData {
  profile: Profile;
  services: Service[];
  translations: Translations;
  locale: string;
}

/**
 * Feeds the site-wide header/footer (rendered once in the root layout, for
 * every route including `/admin`), so unlike `getPortfolio()` this must
 * never throw: an API hiccup should show the chrome's own fallback content
 * instead of taking down navigation on every page, admin included.
 */
export async function getSiteChromeData(): Promise<SiteChromeData | null> {
  try {
    const { profile, services, translations } = await getPortfolio();
    return { profile, services, translations, locale: profile.defaultLocale || 'es' };
  } catch {
    return null;
  }
}
