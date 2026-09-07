import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TechnologyList } from '@/features/admin/components/technology-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Tecnologías · Administración',
};

export default function AdminTechnologiesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando tecnologías…
        </div>
      }
    >
      <TechnologyList />
    </Suspense>
  );
}
