import type { Metadata } from 'next';
import { ServiceForm } from '@/features/admin/components/service-form';

export const metadata: Metadata = {
  title: 'Nuevo servicio · Administración',
};

export default function NewServicePage() {
  return <ServiceForm />;
}
