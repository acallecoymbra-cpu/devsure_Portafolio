import type { SocialLink } from '@devsure/contracts';
import { getStorageUrl } from '@/lib/config';
import { SocialIconGlyph } from './social-icon-glyph';

interface SocialLinksMenuProps {
  socialLinks?: SocialLink[];
}

/**
 * Fixed vertical menu pinned to the far right edge of every page (spec
 * follow-up, reference: qalified.com's `.redes.redes-menu.just-lg`).
 * Hidden below the `lg` breakpoint (see `.social-links-menu` in
 * globals.css) — mobile screens are already busy with the WhatsApp button
 * and the Ultron orb, and the reference site hides its own menu there too.
 */
export function SocialLinksMenu({ socialLinks }: SocialLinksMenuProps) {
  if (!socialLinks || socialLinks.length === 0) return null;

  return (
    <nav className="social-links-menu" aria-label="Redes sociales">
      <ul>
        {socialLinks.map((link) => (
          <li key={link.id}>
            <a href={link.url} target="_blank" rel="noreferrer" aria-label={link.name} title={link.name}>
              {link.icon ? (
                <img src={getStorageUrl(link.icon)} alt="" />
              ) : (
                <SocialIconGlyph iconKey={link.iconKey} />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
