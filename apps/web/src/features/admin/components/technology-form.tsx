'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminApiError,
  createTechnology,
  getTechnology,
  updateTechnology,
} from '../api/admin-api';
import type { AdminTechnology, PublicationStatus, TechnologyInput } from '../types';
import styles from '../admin.module.css';

interface TechnologyFormProps {
  technology?: AdminTechnology;
}

export function TechnologyForm({ technology }: TechnologyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = technology ? `Editar ${technology.name}` : 'Nueva tecnología';

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    const interceptLink = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;
      if (!window.confirm('Tienes cambios sin guardar. ¿Quieres salir de esta página?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', interceptLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', interceptLink, true);
    };
  }, [dirty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);
    const input = formDataToInput(new FormData(event.currentTarget));

    try {
      if (technology) {
        await updateTechnology(technology.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createTechnology(input);
        setDirty(false);
        router.push('/admin/technologies?created=1');
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }

      const text =
        error instanceof AdminApiError && error.status === 409
          ? 'El slug ya está en uso. Elige uno diferente.'
          : error instanceof AdminApiError && error.status === 403
            ? 'No tienes permiso para guardar tecnologías.'
            : 'No pudimos guardar los cambios. Revisa los campos e inténtalo nuevamente.';
      setMessage({ kind: 'error', text });
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(':invalid')?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="technology-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/technologies">
            <span aria-hidden="true">←</span> Tecnologías
          </Link>
          <h1 id="technology-form-title">{title}</h1>
          <p className={styles.muted}>
            {technology
              ? 'Actualiza sus datos y controla cuándo aparece en el sitio.'
              : 'Añade una capacidad al catálogo administrable.'}
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

      <form
        ref={formRef}
        className={styles.editorCard}
        onSubmit={handleSubmit}
        onChange={() => setDirty(true)}
      >
        <fieldset disabled={submitting}>
          <legend>Información de la tecnología</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Nombre <em aria-hidden="true">*</em></span>
              <input
                name="name"
                defaultValue={technology?.name}
                maxLength={100}
                autoComplete="off"
                required
              />
              <small>Nombre visible en el catálogo.</small>
            </label>
            <label className={styles.field}>
              <span>Slug</span>
              <input
                name="slug"
                defaultValue={technology?.slug}
                maxLength={64}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                autoComplete="off"
              />
              <small>Solo minúsculas, números y guiones.</small>
            </label>
            <label className={styles.field}>
              <span>Categoría <em aria-hidden="true">*</em></span>
              <input
                name="category"
                defaultValue={technology?.category}
                maxLength={64}
                required
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>Clave de icono <em aria-hidden="true">*</em></span>
              <input
                name="iconKey"
                defaultValue={technology?.iconKey}
                maxLength={64}
                required
                autoComplete="off"
              />
              <small>Identificador del icono usado por el sitio.</small>
            </label>
            <label className={`${styles.field} ${styles.fullField}`}>
              <span>Resumen</span>
              <textarea
                name="summary"
                defaultValue={technology?.summary}
                maxLength={300}
                rows={4}
              />
              <small>Hasta 300 caracteres.</small>
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input
                name="sortOrder"
                type="number"
                min={0}
                step={1}
                defaultValue={technology?.sortOrder ?? 0}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Estado</span>
              <select name="publicationStatus" defaultValue={technology?.publicationStatus ?? 'draft'}>
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
              </select>
            </label>
            <label className={styles.checkField}>
              <input name="featured" type="checkbox" defaultChecked={technology?.featured} />
              <span>
                <strong>Destacada</strong>
                <small>Da prioridad visual a esta tecnología.</small>
              </span>
            </label>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/technologies">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : technology ? 'Guardar cambios' : 'Crear tecnología'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function TechnologyEditor({ id }: { id: string }) {
  const router = useRouter();
  const [technology, setTechnology] = useState<AdminTechnology>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setTechnology(await getTechnology(id));
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

  if (technology) return <TechnologyForm technology={technology} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando tecnología…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Tecnología no encontrada'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar la tecnología'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar esta tecnología.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/technologies">
          Volver al listado
        </Link>
      )}
    </div>
  );
}

function formDataToInput(data: FormData): TechnologyInput {
  const slug = String(data.get('slug') ?? '').trim();
  const summary = String(data.get('summary') ?? '').trim();

  return {
    name: String(data.get('name') ?? '').trim(),
    slug,
    category: String(data.get('category') ?? '').trim(),
    summary,
    iconKey: String(data.get('iconKey') ?? '').trim(),
    featured: data.get('featured') === 'on',
    sortOrder: Number(data.get('sortOrder') ?? 0),
    publicationStatus: String(data.get('publicationStatus')) as PublicationStatus,
  };
}
