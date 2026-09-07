'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminApiError, getProfile, getTranslations, updateTranslations } from '../api/admin-api';
import type { Translations } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

type TranslatableSection = Exclude<keyof Translations, 'heroTag'>;

interface Section {
  id: string;
  title: string;
  heading: TranslatableSection;
  headingMax: number;
  intro?: TranslatableSection;
  introMax?: number;
}

const SECTIONS: Section[] = [
  { id: 'about', title: 'About', heading: 'aboutHeading', headingMax: 150, intro: 'aboutBody', introMax: 3000 },
  { id: 'strengths', title: 'Strengths', heading: 'strengthsHeading', headingMax: 150, intro: 'strengthsIntro', introMax: 500 },
  { id: 'experience', title: 'Experience', heading: 'experienceHeading', headingMax: 150, intro: 'experienceIntro', introMax: 500 },
  { id: 'education', title: 'Education', heading: 'educationHeading', headingMax: 150 },
  { id: 'portfolio', title: 'Portfolio', heading: 'portfolioHeading', headingMax: 150, intro: 'portfolioIntro', introMax: 500 },
  { id: 'skills', title: 'Skills', heading: 'skillsHeading', headingMax: 150, intro: 'skillsIntro', introMax: 500 },
  { id: 'workstyle', title: 'Work style', heading: 'workstyleHeading', headingMax: 150, intro: 'workstyleIntro', introMax: 500 },
  { id: 'testimonials', title: 'Testimonials', heading: 'testimonialsHeading', headingMax: 150 },
  { id: 'faq', title: 'FAQ', heading: 'faqHeading', headingMax: 150 },
  { id: 'blog', title: 'Blog', heading: 'blogHeading', headingMax: 150 },
  { id: 'contact', title: 'Contact', heading: 'contactHeading', headingMax: 150, intro: 'contactIntro', introMax: 500 },
];

export function TranslationsForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [translations, setTranslations] = useState<Translations>();
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();

  useEffect(() => {
    let active = true;
    Promise.all([getTranslations(), getProfile()])
      .then(([translationsData, profile]) => {
        if (!active) return;
        setTranslations(translationsData);
        setActiveLocales(profile.activeLocales);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof AdminApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget), activeLocales);

    try {
      const updated = await updateTranslations(input);
      setTranslations(updated);
      setDirty(false);
      setMessage({ kind: 'success', text: 'Textos actualizados correctamente.' });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: algún texto supera el largo máximo permitido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando textos editoriales…</p>
      </div>
    );
  }

  if (status === 'error' || !translations) {
    return (
      <div className={styles.stateCard} role="alert">
        <h1>No pudimos cargar los textos</h1>
        <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
        <button className={styles.primaryButton} type="button" onClick={() => location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="translations-form-title">
      <div className={styles.pageHeading}>
        <div>
          <h1 id="translations-form-title">Translations</h1>
          <p className={styles.muted}>
            Títulos e intros de cada sección del home. Un heading vacío oculta la sección en el sitio.
          </p>
        </div>
        {dirty ? <span className={styles.dirtyBadge}>Cambios sin guardar</span> : null}
      </div>

      {message ? (
        <div
          className={message.kind === 'success' ? styles.alertSuccess : styles.alertError}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      ) : null}

      <form ref={formRef} className={styles.editorCard} onSubmit={handleSubmit} onChange={() => setDirty(true)}>
        <details className={styles.collapsible} open>
          <summary>Hero</summary>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Tag (no traducible)</span>
              <input name="heroTag" defaultValue={translations.heroTag} maxLength={60} placeholder="WEB APPS / LARAVEL" autoComplete="off" />
            </label>
          </div>
          <LocaleTabs idPrefix="heroTitle" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale})</span>
                <input name={`heroTitle.${locale}`} defaultValue={translations.heroTitle[locale] ?? ''} maxLength={150} autoComplete="off" />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="heroCopy" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Copy ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea name={`heroCopy.${locale}`} defaultValue={translations.heroCopy[locale] ?? ''} maxLength={500} rows={3} />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="heroNote" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Nota ({LOCALE_LABELS[locale] ?? locale})</span>
                <input name={`heroNote.${locale}`} defaultValue={translations.heroNote[locale] ?? ''} maxLength={500} autoComplete="off" />
              </label>
            )}
          </LocaleTabs>
        </details>

        {SECTIONS.map((section) => (
          <details key={section.id} className={styles.collapsible}>
            <summary>{section.title}</summary>
            <LocaleTabs idPrefix={`${section.id}-heading`} locales={activeLocales}>
              {(locale) => (
                <label className={styles.field}>
                  <span>Heading ({LOCALE_LABELS[locale] ?? locale})</span>
                  <input
                    name={`${section.heading}.${locale}`}
                    defaultValue={(translations[section.heading] as Record<string, string>)[locale] ?? ''}
                    maxLength={section.headingMax}
                    autoComplete="off"
                  />
                </label>
              )}
            </LocaleTabs>
            {section.intro ? (
              <LocaleTabs idPrefix={`${section.id}-intro`} locales={activeLocales}>
                {(locale) => (
                  <label className={styles.field}>
                    <span>Intro ({LOCALE_LABELS[locale] ?? locale})</span>
                    <textarea
                      name={`${section.intro}.${locale}`}
                      defaultValue={(translations[section.intro as keyof Translations] as Record<string, string>)[locale] ?? ''}
                      maxLength={section.introMax}
                      rows={section.introMax && section.introMax > 1000 ? 8 : 3}
                    />
                  </label>
                )}
              </LocaleTabs>
            ) : null}
          </details>
        ))}

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, locales: string[]): Partial<Translations> {
  const heroTag = String(data.get('heroTag') ?? '').trim();
  const input: Partial<Translations> = {
    ...(heroTag ? { heroTag } : {}),
    heroTitle: collectTranslatable(data, 'heroTitle', locales),
    heroCopy: collectTranslatable(data, 'heroCopy', locales),
    heroNote: collectTranslatable(data, 'heroNote', locales),
  };

  for (const section of SECTIONS) {
    input[section.heading] = collectTranslatable(data, section.heading, locales);
    if (section.intro) input[section.intro] = collectTranslatable(data, section.intro, locales);
  }

  return input;
}
