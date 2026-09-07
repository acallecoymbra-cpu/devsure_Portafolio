import type { Metadata } from 'next';
import { LoginForm } from '@/features/admin/components/login-form';
import styles from '@/features/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  alternates: {},
};

export default function AdminLoginPage() {
  return (
    <div className={styles.loginPage}>
      <LoginForm />
    </div>
  );
}
