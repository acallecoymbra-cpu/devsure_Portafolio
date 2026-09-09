'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CursorWater } from './cursor-water';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * The admin panel manages its own full-page layout (see AdminShell) and must
 * not show the public marketing chrome. This used to be a `:global()` CSS
 * hack keyed on `body:has(.adminRoot)`, but CSS Modules hashes `.adminRoot`
 * at build time, so the selector never matched the real class and the
 * header/footer kept rendering around `/admin/*` anyway. Deciding this in
 * React (by pathname) is what the CSS was trying, and failing, to do.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
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
      <SiteHeader />
      <main id="contenido-principal">{children}</main>
      <SiteFooter />
    </>
  );
}
