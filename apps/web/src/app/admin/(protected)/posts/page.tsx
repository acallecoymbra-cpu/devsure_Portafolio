import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PostList } from '@/features/admin/components/post-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Blog · Administración',
};

export default function AdminPostsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando entradas…
        </div>
      }
    >
      <PostList />
    </Suspense>
  );
}
