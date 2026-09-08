import type { ClientLogo } from '@devsure/contracts';
import { getStorageUrl } from '@/lib/config';

interface ClientLogosSectionProps {
  clientLogos: ClientLogo[];
}

/** Trust strip under the Hero (spec follow-up; sinaloanube-master's `clientes`). Hidden until there's real content. */
export function ClientLogosSection({ clientLogos }: ClientLogosSectionProps) {
  if (clientLogos.length === 0) return null;

  return (
    <section className="client-logos-section" aria-labelledby="client-logos-title">
      <div className="shell">
        <p className="client-logos-heading" id="client-logos-title">
          Empresas que confían su tecnología a DevSure
        </p>
        <ul className="client-logos-row">
          {clientLogos.map((logo) => (
            <li key={logo.id} className="client-logo-item">
              {logo.websiteUrl ? (
                <a href={logo.websiteUrl} target="_blank" rel="noreferrer" title={logo.name}>
                  <img src={getStorageUrl(logo.logo)} alt={logo.name} loading="lazy" />
                </a>
              ) : (
                <span title={logo.name}>
                  <img src={getStorageUrl(logo.logo)} alt={logo.name} loading="lazy" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
