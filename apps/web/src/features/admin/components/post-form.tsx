'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createPost, getPost, getProfile, updatePost } from '../api/admin-api';
import { POST_CATEGORIES } from '../types';
import type { Post, PostInput } from '../types';
import { collectTranslatable } from '../lib/translatable-form';
import { FileUploadField } from './file-upload-field';
import { LOCALE_LABELS, LocaleTabs } from './locale-tabs';
import styles from '../admin.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Ingeniería',
  qa: 'QA',
  'case-studies': 'Casos de éxito',
  'company-news': 'Noticias de la empresa',
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface PostFormProps {
  post?: Post;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeLocales, setActiveLocales] = useState<string[]>(['en']);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = post ? 'Editar entrada' : 'Nueva entrada';

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
      if (post) {
        await updatePost(post.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createPost(input);
        setDirty(false);
        router.push('/admin/posts?created=1');
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const text =
        error instanceof AdminApiError && error.status === 409
          ? 'El slug ya está en uso. Elige uno diferente.'
          : error instanceof AdminApiError && error.status === 400
            ? 'Revisa los campos: falta el título/contenido o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.';
      setMessage({ kind: 'error', text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="post-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/posts">
            <span aria-hidden="true">←</span> Blog
          </Link>
          <h1 id="post-form-title">{title}</h1>
          <p className={styles.muted}>
            {post ? 'Actualiza el contenido y el estado de publicación.' : 'Redacta una entrada para el blog público.'}
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
          <legend>Identidad</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Slug</span>
              <input
                name="slug"
                defaultValue={post?.slug}
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="auto desde el título"
                autoComplete="off"
              />
              <small>Déjalo vacío para generarlo automáticamente.</small>
            </label>
            <label className={styles.field}>
              <span>Categoría</span>
              <select name="category" defaultValue={post?.category ?? ''}>
                <option value="">Sin categoría</option>
                {POST_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={post?.sortOrder ?? 0} />
            </label>
          </div>
          <LocaleTabs idPrefix="title" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Título ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <input
                  name={`title.${locale}`}
                  defaultValue={post?.title[locale] ?? ''}
                  maxLength={150}
                  required={locale === activeLocales[0]}
                  autoComplete="off"
                />
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Contenido</legend>
          <LocaleTabs idPrefix="excerpt" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Extracto ({LOCALE_LABELS[locale] ?? locale})</span>
                <input name={`excerpt.${locale}`} defaultValue={post?.excerpt[locale] ?? ''} maxLength={300} />
              </label>
            )}
          </LocaleTabs>
          <LocaleTabs idPrefix="content" locales={activeLocales}>
            {(locale) => (
              <label className={styles.field}>
                <span>Contenido ({LOCALE_LABELS[locale] ?? locale}) <em aria-hidden="true">*</em></span>
                <textarea
                  name={`content.${locale}`}
                  defaultValue={post?.content[locale] ?? ''}
                  maxLength={20000}
                  rows={10}
                  required={locale === activeLocales[0]}
                />
                <small>HTML del editor. No hay un editor visual todavía — se escribe el HTML directamente.</small>
              </label>
            )}
          </LocaleTabs>
        </fieldset>

        <fieldset disabled={submitting}>
          <legend>Media y publicación</legend>
          <div className={styles.formGrid}>
            <FileUploadField
              label="Portada"
              folder="posts-covers"
              accept="image/png,image/jpeg,image/webp"
              hiddenName="coverImage"
              value={post?.coverImage}
              helpText="PNG, JPEG o WEBP, hasta 4 MB."
            />
            <label className={styles.field}>
              <span>Publicado</span>
              <input type="datetime-local" name="publishedAt" defaultValue={toDatetimeLocal(post?.publishedAt)} />
              <small>Vacío = borrador (no visible en el sitio).</small>
            </label>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/posts">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : post ? 'Guardar cambios' : 'Crear entrada'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData, activeLocales: string[]): PostInput {
  const slug = String(data.get('slug') ?? '').trim();
  const category = String(data.get('category') ?? '').trim();
  const coverImage = String(data.get('coverImage') ?? '').trim();
  const publishedAt = String(data.get('publishedAt') ?? '').trim();

  return {
    title: collectTranslatable(data, 'title', activeLocales),
    ...(slug ? { slug } : {}),
    excerpt: collectTranslatable(data, 'excerpt', activeLocales),
    content: collectTranslatable(data, 'content', activeLocales),
    ...(category ? { category: category as PostInput['category'] } : {}),
    ...(coverImage ? { coverImage } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
  };
}

export function PostEditor({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setPost(await getPost(id));
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

  if (post) return <PostForm post={post} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando entrada…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Entrada no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la entrada'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta entrada.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/posts">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
