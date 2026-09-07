import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WorkStyleItemList } from '@/features/admin/components/work-style-item-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Estilo de trabajo · Administración',
};

export default function AdminWorkStyleItemsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando…
        </div>
      }
    >
      <WorkStyleItemList />
    </Suspense>
  );
}
