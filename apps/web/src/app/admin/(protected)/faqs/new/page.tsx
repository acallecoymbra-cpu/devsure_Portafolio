import type { Metadata } from 'next';
import { FaqForm } from '@/features/admin/components/faq-form';

export const metadata: Metadata = {
  title: 'Nueva pregunta · Administración',
};

export default function NewFaqPage() {
  return <FaqForm />;
}
