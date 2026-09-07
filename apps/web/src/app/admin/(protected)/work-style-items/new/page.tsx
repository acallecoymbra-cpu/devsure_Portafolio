import type { Metadata } from 'next';
import { WorkStyleItemForm } from '@/features/admin/components/work-style-item-form';

export const metadata: Metadata = {
  title: 'Nuevo bullet · Administración',
};

export default function NewWorkStyleItemPage() {
  return <WorkStyleItemForm />;
}
