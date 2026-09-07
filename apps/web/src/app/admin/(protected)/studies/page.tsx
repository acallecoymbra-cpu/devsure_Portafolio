import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudyList } from '@/features/admin/components/study-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Educación · Administración',
};

export default function AdminStudiesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando educación…
        </div>
      }
    >
      <StudyList />
    </Suspense>
  );
}
