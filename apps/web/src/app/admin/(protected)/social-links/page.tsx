import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SocialLinkList } from '@/features/admin/components/social-link-list';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Redes sociales · Administración',
};

export default function AdminSocialLinksPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.centerState} role="status">
          Cargando redes sociales…
        </div>
      }
    >
      <SocialLinkList />
    </Suspense>
  );
}
