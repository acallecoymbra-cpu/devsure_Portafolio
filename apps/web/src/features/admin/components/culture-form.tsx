'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminApiError, getProfile, getTranslations, updateTranslations } from '../api/admin-api';
import type { Translations } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

/**
 * Dedicated "Cultura" admin section (separate from the generic Translations
 * form) so the content that feeds `/cultura` has its own home as the page
 * grows — for now, just the "Nuestra medida" pull-quote.
 */
export function CultureForm() {
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
    const data = new FormData(event.currentTarget);
    const input = {
      cultureManifesto: collectTranslatable(data, 'cultureManifesto', activeLocales),
    };

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
        <p>Cargando textos de Cultura…</p>
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
    <section aria-labelledby="culture-form-title">
      <div className={styles.pageHeading}>
        <div>
          <h1 id="culture-form-title">Cultura</h1>
          <p className={styles.muted}>
            Textos editoriales de la página <code>/cultura</code>. Un campo vacío usa el texto por defecto del sitio.
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
          <summary>Nuestra medida</summary>
          <p className={styles.muted}>
            Frase destacada, centrada, que aparece bajo el eyebrow &quot;Nuestra medida&quot;. Pensada para verse en
            dos líneas — evita frases muy largas.
          </p>
          <LocaleTabs idPrefix="cultureManifesto" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Frase ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea
                  name={`cultureManifesto.${locale}`}
                  defaultValue={translations.cultureManifesto[locale] ?? ''}
                  maxLength={220}
                  rows={3}
                />
              </label>
            )}
          </LocaleTabs>
        </details>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}
