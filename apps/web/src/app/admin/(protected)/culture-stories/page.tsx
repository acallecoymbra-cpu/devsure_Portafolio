import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CultureStoryList } from '@/features/admin/components/culture-story-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Cards de cultura · Administración',
};

export default function AdminCultureStoriesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando cards…
        </div>
      }
    >
      <CultureStoryList />
    </Suspense>
  );
}
