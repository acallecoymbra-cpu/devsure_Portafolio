'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createStudy, getProfile, getStudy, updateStudy } from '../api/admin-api';
import type { Study, StudyInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { FileUploadField } from './file-upload-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

interface StudyFormProps {
  study?: Study;
}

export function StudyForm({ study }: StudyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [inProgress, setInProgress] = useState(study?.inProgress ?? false);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = study ? `Editar ${study.institution}` : 'Nueva educación';

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
      if (study) {
        await updateStudy(study.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createStudy(input);
        setDirty(false);
        router.push('/admin/studies?created=1');
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
            ? 'Revisa los campos: falta el título o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="study-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/studies">
            <span aria-hidden="true">←</span> Educación
          </Link>
          <h1 id="study-form-title">{title}</h1>
          <p className={styles.muted}>
            {study ? 'Actualiza la institución y los datos del programa.' : 'Registra un programa de estudios.'}
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
          <legend>Institución</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Institución <em aria-hidden="true">*</em></span>
              <input name="institution" defaultValue={study?.institution} maxLength={150} required autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Campo de estudio</span>
              <input name="field" defaultValue={study?.field} maxLength={100} placeholder="Ciencias de la Computación" autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Fecha de inicio</span>
              <input type="date" name="startDate" defaultValue={study?.startDate} />
            </label>
            <label className={styles.field}>
              <span>Fecha de fin</span>
              <input type="date" name="endDate" defaultValue={study?.endDate ?? undefined} disabled={inProgress} />
            </label>
            <label className={styles.checkField}>
              <input
                type="checkbox"
                name="inProgress"
                defaultChecked={study?.inProgress}
                onChange={(event) => setInProgress(event.target.checked)}
              />
              <span>
                <strong>En curso</strong>
              </span>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={study?.sortOrder ?? 0} />
            </label>
            <div className={styles.fullField}>
              <FileUploadField
                label="Logo"
                folder="studies-logos"
                accept="image/png,image/jpeg,image/webp"
                hiddenName="logo"
                value={study?.logo}
                helpText="PNG, JPEG o WEBP, hasta 2 MB."
              />
            </div>
          </div>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Título</legend>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`title.${locale}`}
                  defaultValue={study?.title[locale] ?? ''}
                  maxLength={150}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Descripción</legend>
          <LocaleTabs idPrefix="description" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Descripción ({LOCALE_LABELS[locale] ?? locale})</span>
                <textarea name={`description.${locale}`} defaultValue={study?.description[locale] ?? ''} maxLength={3000} rows={4} />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/studies">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : study ? 'Guardar cambios' : 'Crear educación'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): StudyInput {
  const institution = String(data.get('institution') ?? '').trim();
  const field = String(data.get('field') ?? '').trim();
  const logo = String(data.get('logo') ?? '').trim();
  const startDate = String(data.get('startDate') ?? '').trim();
  const endDate = String(data.get('endDate') ?? '').trim();
  const inProgress = data.get('inProgress') === 'on';

  return {
    institution,
    title: collectTranslatable(data, 'title', activeLocales),
    ...(field ? { field } : {}),
    description: collectTranslatable(data, 'description', activeLocales),
    ...(startDate ? { startDate } : {}),
    endDate: inProgress ? null : endDate || null,
    inProgress,
    ...(logo ? { logo } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function StudyEditor({ id }: { id: string }) {
  const router = useRouter();
  const [study, setStudy] = useState<Study>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setStudy(await getStudy(id));
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

  if (study) return <StudyForm study={study} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando educación…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Registro no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la educación'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este registro.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/studies">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
