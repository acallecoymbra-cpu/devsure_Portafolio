import type { Metadata } from 'next';
import { ClientLogoEditor } from '@/features/admin/components/client-logo-form';

export const metadata: Metadata = {
  title: 'Editar logo de cliente · Administración',
};

export default async function EditClientLogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientLogoEditor id={id} />;
}
