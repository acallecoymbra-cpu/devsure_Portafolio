import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StrengthList } from '@/features/admin/components/strength-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Fortalezas · Administración',
};

export default function AdminStrengthsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando fortalezas…
        </div>
      }
    >
      <StrengthList />
    </Suspense>
  );
}
