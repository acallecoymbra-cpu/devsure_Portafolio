import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Administración',
  description: 'Área privada de administración de DevSure.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.adminRoot}>{children}</div>;
}
