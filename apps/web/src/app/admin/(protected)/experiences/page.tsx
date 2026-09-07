import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExperienceList } from '@/features/admin/components/experience-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Experiencias · Administración',
};

export default function AdminExperiencesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando experiencias…
        </div>
      }
    >
      <ExperienceList />
    </Suspense>
  );
}
