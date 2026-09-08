import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientLogoList } from '@/features/admin/components/client-logo-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Logos de clientes · Administración',
};

export default function AdminClientLogosPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando logos de clientes…
        </div>
      }
    >
      <ClientLogoList />
    </Suspense>
  );
}
