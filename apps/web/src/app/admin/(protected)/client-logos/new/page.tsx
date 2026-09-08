import type { Metadata } from 'next';
import { ClientLogoForm } from '@/features/admin/components/client-logo-form';

export const metadata: Metadata = {
  title: 'Nuevo logo de cliente · Administración',
};

export default function NewClientLogoPage() {
  return <ClientLogoForm />;
}
