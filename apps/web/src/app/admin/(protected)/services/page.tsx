import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ServiceList } from '@/features/admin/components/service-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Servicios · Administración',
};

export default function AdminServicesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando servicios…
        </div>
      }
    >
      <ServiceList />
    </Suspense>
  );
}
