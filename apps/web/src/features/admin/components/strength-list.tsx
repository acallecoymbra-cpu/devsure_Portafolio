'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteStrength, listStrengths } from '../api/admin-api';
import type { PaginationMeta, Strength } from '../types';
import styles from '../admin.module.css';

function firstValue(record: Record<string, string | undefined>, fallback: string): string {
  const first = Object.values(record).find((value) => value?.trim());
  return first ?? fallback;
}

export function StrengthList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Strength[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listStrengths(page);
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
      setNotice('Fortaleza creada correctamente.');
      router.replace('/admin/strengths', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(strength: Strength) {
    if (!window.confirm(`¿Eliminar “${firstValue(strength.title, strength.id)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(strength.id);
    setNotice('');
    try {
      await deleteStrength(strength.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/strengths?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Fortaleza eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar fortalezas.'
          : 'No pudimos eliminar la fortaleza.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="strengths-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="strengths-admin-title">Fortalezas</h1>
          <p className={styles.muted}>Las tarjetas de "Por qué elegirnos" en la home pública.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/strengths/new">
          <span aria-hidden="true">＋</span> Nueva fortaleza
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
          <h2>No pudimos cargar las fortalezas</h2>
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
          <h2>Aún no hay fortalezas</h2>
          <p>Crea la primera para que aparezca en "Por qué elegirnos".</p>
          <Link className={styles.primaryButton} href="/admin/strengths/new">
            Crear fortaleza
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de fortalezas administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Etiqueta</th>
                  <th scope="col">Título</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((strength) => (
                  <tr key={strength.id}>
                    <td data-label="Etiqueta">
                      <strong>{firstValue(strength.label, '—')}</strong>
                    </td>
                    <td data-label="Título">{firstValue(strength.title, strength.id)}</td>
                    <td data-label="Orden">{strength.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/strengths/${strength.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === strength.id}
                        onClick={() => void handleDelete(strength)}
                      >
                        {deletingId === strength.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de fortalezas">
              <Link
                href={`/admin/strengths?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/strengths?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando fortalezas…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
