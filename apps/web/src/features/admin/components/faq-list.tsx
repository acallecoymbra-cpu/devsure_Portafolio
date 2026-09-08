'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteFaq, listFaqs } from '../api/admin-api';
import type { Faq, PaginationMeta } from '../types';
import styles from '../admin.module.css';

function faqQuestion(faq: Faq): string {
  const first = Object.values(faq.question).find((value) => value?.trim());
  return first ?? faq.id;
}

export function FaqList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Faq[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listFaqs(page);
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
      setNotice('Pregunta creada correctamente.');
      router.replace('/admin/faqs', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(faq: Faq) {
    if (!window.confirm(`¿Eliminar “${faqQuestion(faq)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(faq.id);
    setNotice('');
    try {
      await deleteFaq(faq.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/faqs?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Pregunta eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar preguntas.'
          : 'No pudimos eliminar la pregunta.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="faqs-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="faqs-admin-title">Preguntas frecuentes</h1>
          <p className={styles.muted}>El acordeón de FAQ en la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/faqs/new">
          <span aria-hidden="true">＋</span> Nueva pregunta
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
          <h2>No pudimos cargar las preguntas</h2>
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
          <h2>Aún no hay preguntas</h2>
          <p>Crea la primera para que aparezca en el FAQ.</p>
          <Link className={styles.primaryButton} href="/admin/faqs/new">
            Crear pregunta
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de preguntas frecuentes administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Pregunta</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((faq) => (
                  <tr key={faq.id}>
                    <td data-label="Pregunta">{faqQuestion(faq)}</td>
                    <td data-label="Orden">{faq.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/faqs/${faq.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === faq.id}
                        onClick={() => void handleDelete(faq)}
                      >
                        {deletingId === faq.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de preguntas frecuentes">
              <Link
                href={`/admin/faqs?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/faqs?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando preguntas…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
