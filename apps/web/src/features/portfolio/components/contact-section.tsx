import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';

interface ContactSectionProps {
  profile: Profile;
  translations: Translations;
  locale: string;
}

/**
 * The public contact form (spec §5.15/§6.9, `ContactMessages`/Inbox) doesn't
 * exist yet — see CONTINUACION-DEVSURE-ADMIN.md, bloque 4. Rather than
 * simulate a form that doesn't submit anywhere, this section offers a direct
 * `mailto:` CTA using the real Profile email until Inbox is built.
 */
export function ContactSection({ profile, translations, locale }: ContactSectionProps) {
  const heading = translateValue(translations.contactHeading, locale) ?? 'Hablemos de tu proyecto';
  const intro = translateValue(translations.contactIntro, locale);

  return (
    <section className="section contact-section" id="contacto" aria-labelledby="contact-title">
      <div className="shell contact-layout">
        <div>
          <p className="eyebrow">Contacto</p>
          <h2 id="contact-title">{heading}</h2>
          {intro ? <p>{intro}</p> : null}
          <a className="button button-primary" href={`mailto:${profile.email}`}>
            Escribir a {profile.name}
          </a>
        </div>

        <dl className="contact-card">
          <div>
            <dt>Correo</dt>
            <dd>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
