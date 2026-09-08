'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminApiError, deletePost, listPosts } from '../api/admin-api';
import type { PaginationMeta, Post } from '../types';
import styles from '../admin.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Ingeniería',
  qa: 'QA',
  'case-studies': 'Casos de éxito',
  'company-news': 'Noticias de la empresa',
};

function postTitle(post: Post): string {
  const first = Object.values(post.title).find((value) => value?.trim());
  return first ?? post.slug;
}

export function PostList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [deletingId, setDeletingId] = useState<string>();
  const [notice, setNotice] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await listPosts(page);
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
      setNotice('Entrada creada correctamente.');
      router.replace('/admin/posts', { scroll: false });
    }
  }, [router, searchParams]);

  async function handleDelete(post: Post) {
    if (!window.confirm(`¿Eliminar “${postTitle(post)}”? Esta acción no se puede deshacer.`)) return;

    setDeletingId(post.id);
    setNotice('');
    try {
      await deletePost(post.id);
      if (items.length === 1 && page > 1) {
        router.replace(`/admin/posts?page=${page - 1}`);
      } else {
        await load();
      }
      setNotice('Entrada eliminada correctamente.');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setNotice(
        error instanceof AdminApiError && error.status === 403
          ? 'No tienes permiso para eliminar entradas.'
          : 'No pudimos eliminar la entrada.',
      );
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <section aria-labelledby="posts-admin-title">
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Contenido</p>
          <h1 id="posts-admin-title">Blog</h1>
          <p className={styles.muted}>Entradas del blog público.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/posts/new">
          <span aria-hidden="true">＋</span> Nueva entrada
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
          <h2>No pudimos cargar las entradas</h2>
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
          <h2>Aún no hay entradas</h2>
          <p>Crea la primera para que aparezca en el blog.</p>
          <Link className={styles.primaryButton} href="/admin/posts/new">
            Crear entrada
          </Link>
        </div>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <>
          <div className={styles.tableFrame}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Listado de entradas de blog administrables</caption>
              <thead>
                <tr>
                  <th scope="col">Entrada</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className={styles.srOnly}>Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((post) => (
                  <tr key={post.id}>
                    <td data-label="Entrada">
                      <strong>{postTitle(post)}</strong>
                      <small>{post.slug}</small>
                    </td>
                    <td data-label="Categoría">{post.category ? CATEGORY_LABELS[post.category] ?? post.category : '—'}</td>
                    <td data-label="Estado">
                      <span className={post.publishedAt ? styles.statusPublished : styles.statusDraft}>
                        {post.publishedAt ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className={styles.rowActions}>
                      <Link href={`/admin/posts/${post.id}/edit`}>Editar</Link>
                      <button
                        type="button"
                        disabled={deletingId === post.id}
                        onClick={() => void handleDelete(post)}
                      >
                        {deletingId === post.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Paginación de entradas de blog">
              <Link
                href={`/admin/posts?page=${page - 1}`}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                Anterior
              </Link>
              <span>Página {meta.page} de {meta.totalPages}</span>
              <Link
                href={`/admin/posts?page=${page + 1}`}
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
      <span className={styles.srOnly}>Cargando entradas…</span>
      <div />
      <div />
      <div />
    </div>
  );
}
