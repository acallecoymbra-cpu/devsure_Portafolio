'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteTestimonial, listTestimonials } from '../api/admin-api';
import type { PaginationMeta, Testimonial } from '../types';
import styles from '../admin.module.css';

export function TestimonialList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listTestimonials(page);
      setItems(response.items);
      setMeta(response.meta);
      setStatus('ready');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setStatus(error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error');
    }
  }, [page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setNotice('Testimonio creado correctamente.');
      router.replace('/admin/testimonials', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(testimonial: Testimonial) {
    if (!window.confirm(`¿Eliminar el testimonio de “${testimonial.author}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(testimonial.id);
    setNotice('');
    try {
      await deleteTestimonial(testimonial.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/testimonials?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Testimonio eliminado correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar testimonios.'
          : 'No pudimos eliminar el testimonio.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="testimonials-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="testimonials-admin-title">Testimonios</h1>
          <p className={styles.muted}>Testimonios de clientes que aparecen en la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/testimonials/new">
          <span aria-hidden="true">＋</span> Nuevo testimonio
        </Link>
      </div>

      {notice ? (
        <div className={notice.startsWith('No ') ? styles.alertError : styles.alertSuccess} role="status">
          {notice}
        </div>
      ) : null}

      {status === 'loading' ? <ListSkeleton /> : null}
      {status === 'error' ? (
        <div className={styles.stateCard} role="alert">
          <h2>No pudimos cargar los testimonios</h2>
          <p>Comprueba la conexión con el API e inténtalo nuevamente.</p>
          <button className={styles.secondaryButton} type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}
      {status === 'forbidden' ? (
        <div className={styles.stateCard} role="alert">
          <h2>Acceso restringido</h2>
          <p>Tu cuenta no tiene permiso para consultar este contenido.</p>
        </div>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <div className={styles.stateCard}>
          <span className={styles.emptyIcon} aria-hidden="true">◇</span>
          <h2>Aún no hay testimonios</h2>
          <p>Crea el primero para que aparezca en la home pública.</p>
          <Link className={styles.primaryButton} href="/admin/testimonials/new">
            Crear testimonio
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de testimonios administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Autor</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Fuente</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((testimonial) => (
                  <tr key={testimonial.id}>
                    <td data-label="Autor">
                      <strong>{testimonial.author}</strong>
                      {testimonial.role ? <small>{testimonial.role}</small> : null}
                    </td>
                    <td data-label="Empresa">{testimonial.company ?? '—'}</td>
                    <td data-label="Fuente">{testimonial.source ?? '—'}</td>
                    <td data-label="Orden">{testimonial.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/testimonials/${testimonial.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === testimonial.id}
                        onClick={() => void handleDelete(testimonial)}
                      >
                        {deletingId === testimonial.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de testimonios">
              <Link
                href={`/admin/testimonials?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/testimonials?page=${page + 1}`}
                aria-disabled={page >= meta.totalPages}
                tabIndex={page >= meta.totalPages ? -1 : undefined}
              >
                Siguiente
              </Link>
            </nav>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.skeletonPanel} role="status" aria-live="polite">
      <span className={styles.srOnly}>Cargando testimonios…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
