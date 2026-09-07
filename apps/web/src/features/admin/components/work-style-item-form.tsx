'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminApiError,
  createWorkStyleItem,
  getProfile,
  getWorkStyleItem,
  updateWorkStyleItem,
} from '../api/admin-api';
import type { WorkStyleItem, WorkStyleItemInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

interface WorkStyleItemFormProps {
  item?: WorkStyleItem;
}

export function WorkStyleItemForm({ item }: WorkStyleItemFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = item ? 'Editar bullet' : 'Nuevo bullet';

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
      if (item) {
        await updateWorkStyleItem(item.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createWorkStyleItem(input);
        setDirty(false);
        router.push('/admin/work-style-items?created=1');
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
            ? 'Falta el texto en al menos un idioma.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="work-style-item-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/work-style-items">
            <span aria-hidden="true">←</span> Estilo de trabajo
          </Link>
          <h1 id="work-style-item-form-title">{title}</h1>
          <p className={styles.muted}>
            {item ? 'Actualiza este punto de la metodología.' : 'Añade un punto numerado a "Cómo trabajamos".'}
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
          <legend>Bullet</legend>
          <label className={styles.field}>
            <span>Orden</span>
            <input type="number" name="sortOrder" min={0} step={1} defaultValue={item?.sortOrder ?? 0} />
          </label>
          <LocaleTabs idPrefix="text" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Texto ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`text.${locale}`}
                  defaultValue={item?.text[locale] ?? ''}
                  maxLength={300}
                  rows={3}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/work-style-items">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : item ? 'Guardar cambios' : 'Crear bullet'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): WorkStyleItemInput {
  return {
    text: collectTranslatable(data, 'text', activeLocales),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function WorkStyleItemEditor({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<WorkStyleItem>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setItem(await getWorkStyleItem(id));
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

  if (item) return <WorkStyleItemForm item={item} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando bullet…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Bullet no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar el bullet'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este bullet.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/work-style-items">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
