'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApiError, createTestimonial, getTestimonial, updateTestimonial } from '../api/admin-api';
import { TESTIMONIAL_HIGHLIGHT_ICONS, TESTIMONIAL_SOURCES } from '../types';
import type { Testimonial, TestimonialInput } from '../types';
import { FileUploadField } from './file-upload-field';
import styles from '../admin.module.css';

const SOURCE_LABELS: Record<string, string> = {
  workana: 'Workana',
  linkedin: 'LinkedIn',
  upwork: 'Upwork',
  email: 'Correo electrónico',
  other: 'Otro',
};

const HIGHLIGHT_ICON_LABELS: Record<string, string> = {
  delivery: 'Entrega (maletín)',
  quality: 'Calidad y velocidad (gráfico)',
  infrastructure: 'Infraestructura y escalabilidad (cohete)',
  support: 'Soporte y confianza (acuerdo)',
};

interface TestimonialFormProps {
  testimonial?: Testimonial;
}

export function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string }>();
  const title = testimonial ? `Editar testimonio de ${testimonial.author}` : 'Nuevo testimonio';

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
    const input = formDataToInput(new FormData(event.currentTarget));

    try {
      if (testimonial) {
        await updateTestimonial(testimonial.id, input);
        setDirty(false);
        setMessage({ kind: 'success', text: 'Cambios guardados correctamente.' });
        router.refresh();
      } else {
        await createTestimonial(input);
        setDirty(false);
        router.push('/admin/testimonials?created=1');
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
            ? 'Revisa los campos: falta el autor/la cita o algún dato es inválido.'
            : 'No pudimos guardar los cambios. Inténtalo nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="testimonial-form-title">
      <div className={styles.pageHeading}>
        <div>
          <Link className={styles.backLink} href="/admin/testimonials">
            <span aria-hidden="true">←</span> Testimonios
          </Link>
          <h1 id="testimonial-form-title">{title}</h1>
          <p className={styles.muted}>
            {testimonial ? 'Actualiza este testimonio.' : 'Registra un testimonio recibido de un cliente.'}
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
          <legend>Testimonio</legend>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Autor <em aria-hidden="true">*</em></span>
              <input name="author" defaultValue={testimonial?.author} maxLength={150} required autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Cargo</span>
              <input name="role" defaultValue={testimonial?.role} maxLength={150} placeholder="CTO" autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Empresa</span>
              <input name="company" defaultValue={testimonial?.company} maxLength={150} autoComplete="off" />
            </label>
            <label className={styles.field}>
              <span>Fuente</span>
              <select name="source" defaultValue={testimonial?.source ?? ''}>
                <option value="">Sin especificar</option>
                {TESTIMONIAL_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {SOURCE_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>URL de la fuente</span>
              <input
                type="url"
                name="sourceUrl"
                defaultValue={testimonial?.sourceUrl}
                maxLength={500}
                placeholder="https://www.linkedin.com/in/…"
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>Orden</span>
              <input type="number" name="sortOrder" min={0} step={1} defaultValue={testimonial?.sortOrder ?? 0} />
            </label>
            <label className={styles.field}>
              <span>Calificación (1-5)</span>
              <input
                type="number"
                name="rating"
                min={1}
                max={5}
                step={0.1}
                defaultValue={testimonial?.rating ?? 5}
              />
            </label>
            <label className={styles.field}>
              <span>Icono del resultado</span>
              <select name="highlightIcon" defaultValue={testimonial?.highlightIcon ?? ''}>
                <option value="">Sin etiqueta</option>
                {TESTIMONIAL_HIGHLIGHT_ICONS.map((value) => (
                  <option key={value} value={value}>
                    {HIGHLIGHT_ICON_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Texto del resultado</span>
              <input
                name="highlightText"
                defaultValue={testimonial?.highlightText}
                maxLength={120}
                placeholder="Proyecto completado con éxito"
                autoComplete="off"
              />
            </label>
            <div className={styles.fullField}>
              <FileUploadField
                label="Avatar"
                folder="testimonials"
                accept="image/png,image/jpeg,image/webp"
                hiddenName="avatar"
                value={testimonial?.avatar}
                helpText="PNG, JPEG o WEBP, hasta 1 MB."
              />
            </div>
            <div className={styles.fullField}>
              <label className={styles.field}>
                <span>Cita <em aria-hidden="true">*</em></span>
                <textarea name="quote" defaultValue={testimonial?.quote} maxLength={2000} rows={4} required />
              </label>
            </div>
          </div>
        </fieldset>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/testimonials">
            Cancelar
          </Link>
          <button className={styles.primaryButton} type="submit" disabled={submitting || !dirty}>
            {submitting ? 'Guardando…' : testimonial ? 'Guardar cambios' : 'Crear testimonio'}
          </button>
        </div>
      </form>
    </section>
  );
}

function formDataToInput(data: FormData): TestimonialInput {
  const role = String(data.get('role') ?? '').trim();
  const company = String(data.get('company') ?? '').trim();
  const avatar = String(data.get('avatar') ?? '').trim();
  const highlightText = String(data.get('highlightText') ?? '').trim();
  const highlightIcon = String(data.get('highlightIcon') ?? '').trim();
  const source = String(data.get('source') ?? '').trim();
  const sourceUrl = String(data.get('sourceUrl') ?? '').trim();

  return {
    author: String(data.get('author') ?? '').trim(),
    quote: String(data.get('quote') ?? '').trim(),
    ...(role ? { role } : {}),
    ...(company ? { company } : {}),
    ...(avatar ? { avatar } : {}),
    rating: Number(data.get('rating') ?? 5),
    ...(highlightText ? { highlightText } : {}),
    ...(highlightIcon ? { highlightIcon: highlightIcon as TestimonialInput['highlightIcon'] } : {}),
    ...(source ? { source: source as TestimonialInput['source'] } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    sortOrder: Number(data.get('sortOrder') ?? 0),
  };
}

export function TestimonialEditor({ id }: { id: string }) {
  const router = useRouter();
  const [testimonial, setTestimonial] = useState<Testimonial>();
  const [status, setStatus] = useState<'loading' | 'error' | 'forbidden' | 'not-found'>('loading');

  const load = useMemo(
    () => async () => {
      setStatus('loading');
      try {
        setTestimonial(await getTestimonial(id));
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

  if (testimonial) return <TestimonialForm testimonial={testimonial} />;

  if (status === 'loading') {
    return (
      <div className={styles.centerState} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Cargando testimonio…</p>
      </div>
    );
  }

  return (
    <div className={styles.stateCard} role={status === 'error' ? 'alert' : undefined}>
      <h1>
        {status === 'not-found'
          ? 'Testimonio no encontrado'
          : status === 'forbidden'
            ? 'Acceso restringido'
            : 'No pudimos cargar el testimonio'}
      </h1>
      <p>
        {status === 'not-found'
          ? 'Puede que se haya eliminado o que el enlace ya no sea válido.'
          : status === 'forbidden'
            ? 'Tu cuenta no tiene permiso para editar este testimonio.'
            : 'Comprueba la conexión con el API e inténtalo nuevamente.'}
      </p>
      {status === 'error' ? (
        <button className={styles.primaryButton} type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : (
        <Link className={styles.secondaryButton} href="/admin/testimonials">
          Volver al listado
        </Link>
      )}
    </div>
  );
}
