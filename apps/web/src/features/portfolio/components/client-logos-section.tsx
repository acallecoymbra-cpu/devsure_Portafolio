import type { ClientLogo } from '@devsure/contracts';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { getStorageUrl } from '@/lib/config';

interface ClientLogosSectionProps {
  clientLogos: ClientLogo[];
}

/**
 * Trust strip under the Hero (spec follow-up; sinaloanube-master's `clientes`).
 * Hidden until there's real content. Unlike the rest of the home page, the
 * logo row itself deliberately lives outside `.shell` (see
 * `client-logos-track-wrap`) so its dark band always spans the full
 * viewport edge to edge, even though the (typically few) logos inside it
 * just sit centered and still — no scrolling loop, so no duplicated copy
 * is needed here.
 */
export function ClientLogosSection({ clientLogos }: ClientLogosSectionProps) {
  if (clientLogos.length === 0) return null;

  return (
    <section className="client-logos-section" aria-labelledby="client-logos-title">
      <div className="shell">
        <p className="client-logos-heading" id="client-logos-title">
          Empresas que confían su tecnología a DevSure
        </p>
      </div>

      <div className="client-logos-track-wrap">
        <ul className="client-logos-row">
          {clientLogos.map((logo) => (
            <Reveal as="li" key={logo.id} className="client-logo-item">
              {logo.websiteUrl ? (
                <a href={logo.websiteUrl} target="_blank" rel="noreferrer" title={logo.name}>
                  <img src={getStorageUrl(logo.logo)} alt={logo.name} loading="lazy" />
                </a>
              ) : (
                <span title={logo.name}>
                  <img src={getStorageUrl(logo.logo)} alt={logo.name} loading="lazy" />
                </span>
              )}
            </Reveal>
          ))}
        </ul>
      </div>

      <div className="shell">
        <p className="client-logos-cta">
          <Link href="/casos-de-exito">
            Ver casos de éxito <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    </section>
  );
}
