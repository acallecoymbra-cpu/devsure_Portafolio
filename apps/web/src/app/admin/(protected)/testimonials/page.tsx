import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TestimonialList } from '@/features/admin/components/testimonial-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Testimonios · Administración',
};

export default function AdminTestimonialsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando testimonios…
        </div>
      }
    >
      <TestimonialList />
    </Suspense>
  );
}
