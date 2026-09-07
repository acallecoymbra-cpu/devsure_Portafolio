'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteExperience, listExperiences } from '../api/admin-api';
import type { Experience, PaginationMeta } from '../types';
import styles from '../admin.module.css';

export function ExperienceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Experience[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listExperiences(page);
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
      setNotice('Experiencia creada correctamente.');
      router.replace('/admin/experiences', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(experience: Experience) {
    if (!window.confirm(`¿Eliminar “${experience.company}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(experience.id);
    setNotice('');
    try {
      await deleteExperience(experience.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/experiences?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Experiencia eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar experiencias.'
          : 'No pudimos eliminar la experiencia.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="experiences-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="experiences-admin-title">Experiencias</h1>
          <p className={styles.muted}>Empresas, niveles y roles que aparecen en Resume → Experience.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/experiences/new">
          <span aria-hidden="true">＋</span> Nueva experiencia
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
          <h2>No pudimos cargar las experiencias</h2>
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
          <h2>Aún no hay experiencias</h2>
          <p>Crea la primera para que aparezca en la sección Resume.</p>
          <Link className={styles.primaryButton} href="/admin/experiences/new">
            Crear experiencia
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de experiencias administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Empresa</th>
                  <th scope="col">Niveles</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((experience) => (
                  <tr key={experience.id}>
                    <td data-label="Empresa">
                      <strong>{experience.company}</strong>
                      <small>{experience.slug}</small>
                    </td>
                    <td data-label="Niveles">{experience.levels.length}</td>
                    <td data-label="Orden">{experience.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/experiences/${experience.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === experience.id}
                        onClick={() => void handleDelete(experience)}
                      >
                        {deletingId === experience.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de experiencias">
              <Link
                href={`/admin/experiences?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/experiences?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando experiencias…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
