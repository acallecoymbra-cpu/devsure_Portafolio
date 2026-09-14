'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deleteSocialLink, listSocialLinks } from '../api/admin-api';
import type { PaginationMeta, SocialLink } from '../types';
import styles from '../admin.module.css';

export function SocialLinkList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<SocialLink[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listSocialLinks(page);
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
      setNotice('Red social creada correctamente.');
      router.replace('/admin/social-links', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(socialLink: SocialLink) {
    if (!window.confirm(`¿Eliminar “${socialLink.name}” del menú de redes? Esta acción no se puede deshacer.`)) return;

    setDeletingId(socialLink.id);
    setNotice('');
    try {
      await deleteSocialLink(socialLink.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/social-links?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Red social eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar redes sociales.'
          : 'No pudimos eliminar la red social.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="social-links-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="social-links-admin-title">Redes sociales</h1>
          <p className={styles.muted}>Menú fijo que aparece en el borde derecho de todas las páginas públicas.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/social-links/new">
          <span aria-hidden="true">＋</span> Nueva red social
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
          <h2>No pudimos cargar las redes sociales</h2>
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
          <h2>Aún no hay redes sociales</h2>
          <p>Crea la primera para que aparezca en el menú fijo del sitio.</p>
          <Link className={styles.primaryButton} href="/admin/social-links/new">
            Crear red social
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de redes sociales administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Red</th>
                  <th scope="col">URL</th>
                  <th scope="col">Icono</th>
                  <th scope="col">Orden</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((socialLink) => (
                  <tr key={socialLink.id}>
                    <td data-label="Red"><strong>{socialLink.name}</strong></td>
                    <td data-label="URL">{socialLink.url}</td>
                    <td data-label="Icono">{socialLink.icon ? 'Personalizado' : socialLink.iconKey}</td>
                    <td data-label="Orden">{socialLink.sortOrder}</td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/social-links/${socialLink.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === socialLink.id}
                        onClick={() => void handleDelete(socialLink)}
                      >
                        {deletingId === socialLink.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de redes sociales">
              <Link
                href={`/admin/social-links?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/social-links?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando redes sociales…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
