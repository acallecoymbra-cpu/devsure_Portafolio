'use client';

import type { Profile, Service, SocialLink, Translations } from '@devsure/contracts';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CursorWater } from './cursor-water';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { SocialLinksMenu } from './social-links-menu';

interface SiteChromeProps {
  children: ReactNode;
  profile?: Profile;
  services?: Service[];
  translations?: Translations;
  socialLinks?: SocialLink[];
  locale?: string;
}

/**
 * The admin panel manages its own full-page layout (see AdminShell) and must
 * not show the public marketing chrome. This used to be a `:global()` CSS
 * hack keyed on `body:has(.adminRoot)`, but CSS Modules hashes `.adminRoot`
 * at build time, so the selector never matched the real class and the
 * header/footer kept rendering around `/admin/*` anyway. Deciding this in
 * React (by pathname) is what the CSS was trying, and failing, to do.
 */
export function SiteChrome({ children, profile, services, translations, socialLinks, locale }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) {
    return <main>{children}</main>;
  }

  return (
    <>
      <CursorWater />
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <SiteHeader profile={profile} />
      <main id="contenido-principal">{children}</main>
      <SiteFooter profile={profile} services={services} translations={translations} locale={locale} />
      <SocialLinksMenu socialLinks={socialLinks} />
    </>
  );
}
