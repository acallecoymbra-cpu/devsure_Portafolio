import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FaqList } from '@/features/admin/components/faq-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes · Administración',
};

export default function AdminFaqsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando preguntas…
        </div>
      }
    >
      <FaqList />
    </Suspense>
  );
}
