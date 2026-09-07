import type { Metadata } from 'next';
import { ServiceEditor } from '@/features/admin/components/service-form';

export const metadata: Metadata = {
  title: 'Editar servicio · Administración',
};

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceEditor id={id} />;
}
