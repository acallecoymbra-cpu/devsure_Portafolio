'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createFaq, getFaq, getProfile, updateFaq } from '../api/admin-api';
import type { Faq, FaqInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

interface FaqFormProps {
  faq?: Faq;
}

export function FaqForm({ faq }: FaqFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = faq ? 'Editar pregunta' : 'Nueva pregunta';

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setActiveLocales(profile.activeLocales);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
      if (faq) {
        await updateFaq(faq.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createFaq(input);
        setDirty(false);
        router.push('/admin/faqs?created=1');
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setMessage({
        kind: 'error',
        text:
          error instanceof AdminApiError && error.status === 400
            ? 'Falta la pregunta o la respuesta en al menos un idioma.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="faq-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/faqs">
            <span aria-hidden="true">←</span> Preguntas frecuentes
          </Link>
          <h1 id="faq-form-title">{title}</h1>
          <p className={styles.muted}>
            {faq ? 'Actualiza esta pregunta del acordeón de FAQ.' : 'Añade una pregunta al acordeón de FAQ.'}
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
        <fieldset disabled={submitting}>
          <legend>Pregunta</legend>
          <label className={styles.field}>
            <span>Orden</span>
            <input type="number" name="sortOrder" min={0} step={1} defaultValue={faq?.sortOrder ?? 0} />
          </label>
          <LocaleTabs idPrefix="question" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Pregunta ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`question.${locale}`}
                  defaultValue={faq?.question[locale] ?? ''}
                  maxLength={200}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="answer" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Respuesta ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`answer.${locale}`}
                  defaultValue={faq?.answer[locale] ?? ''}
                  maxLength={2000}
                  rows={5}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/faqs">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : faq ? 'Guardar cambios' : 'Crear pregunta'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): FaqInput {
  return {
    question: collectTranslatable(data, 'question', activeLocales),
    answer: collectTranslatable(data, 'answer', activeLocales),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function FaqEditor({ id }: { id: string }) {
  const router = useRouter();
  const [faq, setFaq] = useState<Faq>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setFaq(await getFaq(id));
      } catch (error) {
        if (error instanceof AdminApiError && error.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (error instanceof AdminApiError && error.status === 403) setStatus('forbidden');
        else if (error instanceof AdminApiError && error.status === 404) setStatus('not-found');
        else setStatus('error');
      }
    },
    [id, router],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (faq) return <FaqForm faq={faq} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando pregunta…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Pregunta no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la pregunta'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta pregunta.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/faqs">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
