'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteStudy, listStudies } from '../api/admin-api';
import type { PaginationMeta, Study } from '../types';
import styles from '../admin.module.css';

function studyTitle(study: Study): string {
  const first = Object.values(study.title).find((value) => value?.trim());
  return first ?? study.institution;
}

export function StudyList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Study[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listStudies(page);
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
      setNotice('Educación creada correctamente.');
      router.replace('/admin/studies', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(study: Study) {
    if (!window.confirm(`¿Eliminar “${study.institution}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(study.id);
    setNotice('');
    try {
      await deleteStudy(study.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/studies?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Educación eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar este contenido.'
          : 'No pudimos eliminar el registro.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="studies-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="studies-admin-title">Educación</h1>
          <p className={styles.muted}>Instituciones y programas que aparecen en Resume → Education.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/studies/new">
          <span aria-hidden="true">＋</span> Nueva educación
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
          <h2>No pudimos cargar la educación</h2>
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
          <h2>Aún no hay educación registrada</h2>
          <p>Crea la primera para que aparezca en la sección Education.</p>
          <Link className={styles.primaryButton} href="/admin/studies/new">
            Crear educación
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de educación administrable</caption>
              <thead>
                <tr>
                  <th scope="col">Institución</th>
                  <th scope="col">Título</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((study) => (
                  <tr key={study.id}>
                    <td data-label="Institución">
                      <strong>{study.institution}</strong>
                      {study.inProgress ? <small>En curso</small> : null}
                    </td>
                    <td data-label="Título">{studyTitle(study)}</td>
                    <td data-label="Orden">{study.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/studies/${study.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === study.id}
                        onClick={() => void handleDelete(study)}
                      >
                        {deletingId === study.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de educación">
              <Link
                href={`/admin/studies?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/studies?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando educación…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
