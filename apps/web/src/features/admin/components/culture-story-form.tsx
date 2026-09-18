'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminApiError,
  createCultureStory,
  getCultureStory,
  getProfile,
  updateCultureStory,
} from '../api/admin-api';
import type { CultureStory, CultureStoryInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { FileUploadField } from './file-upload-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

interface CultureStoryFormProps {
  story?: CultureStory;
}

function storyTitle(story: CultureStory): string {
  return Object.values(story.title).find((value) => value?.trim()) ?? story.imageAlt;
}

export function CultureStoryForm({ story }: CultureStoryFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = story ? `Editar “${storyTitle(story)}”` : 'Nueva card';

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
      if (story) {
        await updateCultureStory(story.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createCultureStory(input);
        setDirty(false);
        router.push('/admin/culture-stories?created=1');
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
            ? 'Revisa los campos: falta algún texto o la imagen, o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="culture-story-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/culture-stories">
            <span aria-hidden="true">←</span> Cards de cultura
          </Link>
          <h1 id="culture-story-form-title">{title}</h1>
          <p className={styles.muted}>
            {story
              ? 'Actualiza el texto y la imagen de esta estación de la columna.'
              : 'Crea una nueva estación de la columna narrativa de /cultura.'}
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
          <legend>Imagen</legend>
          <div className={styles.formGrid}>
            <div className={styles.fullField}>
              <FileUploadField
                label="Imagen de la card"
                folder="culture-stories"
                accept="image/png,image/jpeg,image/webp"
                hiddenName="imageSrc"
                value={story?.imageSrc}
                helpText="PNG, JPEG o WEBP, hasta 4 MB. Se muestra recortada dentro de la tarjeta 3D."
              />
            </div>
            <label className={styles.field}>
              <span>Texto alternativo (accesibilidad) <em aria-hidden="true">*</em></span>
              <input
                name="imageAlt"
                defaultValue={story?.imageAlt}
                maxLength={300}
                required
                autoComplete="off"
                placeholder="Ilustración editorial de..."
              />
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={story?.sortOrder ?? 0} />
            </label>
          </div>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Kicker</legend>
          <p className={styles.muted}>Etiqueta corta arriba del título, por ejemplo &quot;01 · Entender&quot;.</p>
          <LocaleTabs idPrefix="kicker" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Kicker ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`kicker.${locale}`}
                  defaultValue={story?.kicker[locale] ?? ''}
                  maxLength={60}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Título</legend>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`title.${locale}`}
                  defaultValue={story?.title[locale] ?? ''}
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
                <span>Descripción ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`description.${locale}`}
                  defaultValue={story?.description[locale] ?? ''}
                  maxLength={600}
                  rows={4}
                  required={locale === activeLocales[0]}
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/culture-stories">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : story ? 'Guardar cambios' : 'Crear card'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): CultureStoryInput {
  return {
    kicker: collectTranslatable(data, 'kicker', activeLocales),
    title: collectTranslatable(data, 'title', activeLocales),
    description: collectTranslatable(data, 'description', activeLocales),
    imageSrc: String(data.get('imageSrc') ?? '').trim(),
    imageAlt: String(data.get('imageAlt') ?? '').trim(),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function CultureStoryEditor({ id }: { id: string }) {
  const router = useRouter();
  const [story, setStory] = useState<CultureStory>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setStory(await getCultureStory(id));
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

  if (story) return <CultureStoryForm story={story} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando card…</p>
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
            : 'No pudimos cargar la card'}
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
        <Link className={styles.secondaryButton} href="/admin/culture-stories">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
