import type { Metadata } from 'next';
import { TechnologyForm } from '@/features/admin/components/technology-form';

export const metadata: Metadata = {
  title: 'Nueva tecnología · Administración',
};

export default function NewTechnologyPage() {
  return <TechnologyForm />;
}
