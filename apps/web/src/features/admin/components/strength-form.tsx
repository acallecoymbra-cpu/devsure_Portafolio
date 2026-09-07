'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createStrength, getProfile, getStrength, updateStrength } from '../api/admin-api';
import type { Strength, StrengthInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import { TagsInput } from './tags-input';
import styles from '../admin.module.css';

interface StrengthFormProps {
  strength?: Strength;
}

export function StrengthForm({ strength }: StrengthFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [techStack, setTechStack] = useState<string[]>(strength?.techStack ?? []);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = strength ? 'Editar fortaleza' : 'Nueva fortaleza';

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
    const input = formDataToInput(new FormData(event.currentTarget), activeLocales, techStack);

    try {
      if (strength) {
        await updateStrength(strength.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createStrength(input);
        setDirty(false);
        router.push('/admin/strengths?created=1');
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
            ? 'Revisa los campos: falta etiqueta, título o cuerpo.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="strength-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/strengths">
            <span aria-hidden="true">←</span> Fortalezas
          </Link>
          <h1 id="strength-form-title">{title}</h1>
          <p className={styles.muted}>
            {strength ? 'Actualiza esta tarjeta de "Por qué elegirnos".' : 'Añade una tarjeta a "Por qué elegirnos".'}
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
          <legend>Fortaleza</legend>
          <label className={styles.field}>
            <span>Orden</span>
            <input type="number" name="sortOrder" min={0} step={1} defaultValue={strength?.sortOrder ?? 0} />
          </label>
          <LocaleTabs idPrefix="label" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Etiqueta ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`label.${locale}`}
                  defaultValue={strength?.label[locale] ?? ''}
                  maxLength={60}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
                <small>Tag corto sobre el título, ej. "Confianza".</small>
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`title.${locale}`}
                  defaultValue={strength?.title[locale] ?? ''}
                  maxLength={150}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="body" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Cuerpo ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`body.${locale}`}
                  defaultValue={strength?.body[locale] ?? ''}
                  maxLength={1000}
                  rows={4}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
          <TagsInput
            label="Tecnologías (opcional)"
            value={techStack}
            onChange={(tags) => {
              setDirty(true);
              setTechStack(tags);
            }}
            placeholder="Next.js, NestJS…"
          />
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/strengths">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : strength ? 'Guardar cambios' : 'Crear fortaleza'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[], techStack: string[]): StrengthInput {
  return {
    label: collectTranslatable(data, 'label', activeLocales),
    title: collectTranslatable(data, 'title', activeLocales),
    body: collectTranslatable(data, 'body', activeLocales),
    techStack,
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function StrengthEditor({ id }: { id: string }) {
  const router = useRouter();
  const [strength, setStrength] = useState<Strength>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setStrength(await getStrength(id));
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

  if (strength) return <StrengthForm strength={strength} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando fortaleza…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Fortaleza no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la fortaleza'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta fortaleza.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/strengths">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
