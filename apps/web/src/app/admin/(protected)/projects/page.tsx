import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectList } from '@/features/admin/components/project-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Proyectos · Administración',
};

export default function AdminProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando proyectos…
        </div>
      }
    >
      <ProjectList />
    </Suspense>
  );
}
