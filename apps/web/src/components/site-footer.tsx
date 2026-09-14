import type { Profile, Service, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { getStorageUrl } from '@/lib/config';
import { WhatsAppButton } from './whatsapp-button';

interface SiteFooterProps {
  profile?: Profile;
  services?: Service[];
  translations?: Translations;
  locale?: string;
}

/** Shown until the admin publishes real services (Servicios column, footer). */
const FALLBACK_SERVICES = ['Desarrollo web', 'Aplicaciones móviles', 'Consultoría técnica'];

/**
 * Three-column footer (spec follow-up, §5.16): logo + about copy, the
 * services list already managed from the admin Services CRUD, and contact
 * details. All of it is optional — `profile`/`services`/`translations` come
 * from the root layout's best-effort fetch (see `getSiteChromeData`), which
 * returns `undefined` rather than throwing when the API is unreachable, so
 * every field below falls back to placeholder copy instead of crashing the
 * chrome that wraps every page.
 */
export function SiteFooter({ profile, services, translations, locale = 'es' }: SiteFooterProps) {
  const aboutPrimary =
    translateValue(translations?.footerAboutPrimary, locale) ??
    'DevSure es un equipo de desarrollo de software enfocado en crear soluciones digitales confiables, mantenibles y listas para escalar.';
  const aboutSecondary =
    translateValue(translations?.footerAboutSecondary, locale) ??
    'Combinamos ingeniería sólida con procesos claros para que tu producto crezca sin fricciones ni sorpresas.';

  const serviceNames = services && services.length > 0
    ? services.map((service) => translateValue(service.title, locale)).filter((title): title is string => Boolean(title))
    : FALLBACK_SERVICES;

  const phone = profile?.phone ?? '+591 2 2445566';
  const email = profile?.email ?? 'contacto@devsure.example';
  const address = profile?.address ?? 'Av. Arce 2856, La Paz, Bolivia';
  const businessHours = profile?.businessHours ?? 'Lunes a viernes, 9:00 a 18:00';
  const facebookUrl = profile?.facebookUrl ?? 'https://facebook.com/devsure';
  const linkedinUrl = profile?.linkedinUrl ?? 'https://www.linkedin.com/company/devsure';

  return (
    <footer className="site-footer">
      <div className="shell footer-columns">
        <div className="footer-col footer-col-about">
          <div className="footer-brand">
            {profile?.logo ? (
              <img className="footer-logo" src={getStorageUrl(profile.logo)} alt="" aria-hidden="true" />
            ) : (
              <span className="footer-logo footer-logo-fallback" aria-hidden="true">
                DS
              </span>
            )}
            {profile?.logoWordmark ? (
              <img className="footer-logo-wordmark" src={getStorageUrl(profile.logoWordmark)} alt="DevSure" />
            ) : (
              <span className="footer-logo-wordmark-text">DevSure</span>
            )}
          </div>
          <p>{aboutPrimary}</p>
          <p>{aboutSecondary}</p>
        </div>

        <div className="footer-col">
          <h3>Servicios</h3>
          <ul className="footer-list">
            {serviceNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3>Contacto</h3>
          <ul className="footer-list footer-contact-list">
            <li>
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
            </li>
            <li>
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            <li>{address}</li>
            <li>{businessHours}</li>
          </ul>
          <ul className="footer-social">
            <li>
              <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="DevSure en Facebook">
                <FacebookIcon />
              </a>
            </li>
            <li>
              <a href={linkedinUrl} target="_blank" rel="noreferrer" aria-label="DevSure en LinkedIn">
                <LinkedinIcon />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell footer-inner">
        <p>DevSure · Soluciones digitales construidas para evolucionar.</p>
        <a href="#contenido-principal">Volver al inicio</a>
      </div>

      <WhatsAppButton />
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.2h2.4l.4-2.8h-2.8v-1.6c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.3 0-3.8 1.4-3.8 3.9v1.7H8v2.8h2.4V21h3.1Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.5a1.94 1.94 0 1 0 0-3.88 1.94 1.94 0 0 0 0 3.88ZM5.25 10.2h3.38V19H5.25v-8.8Zm5.63 0h3.24v1.2h.05c.45-.85 1.55-1.75 3.2-1.75 3.42 0 4.05 2.25 4.05 5.18V19h-3.38v-4.63c0-1.1-.02-2.52-1.53-2.52-1.54 0-1.78 1.2-1.78 2.44V19h-3.37v-8.8Z" />
    </svg>
  );
}
