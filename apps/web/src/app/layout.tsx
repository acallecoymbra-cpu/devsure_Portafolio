import type { Metadata, Viewport } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://devsure.example'),
  title: {
    default: 'DevSure | Desarrollo de software confiable',
    template: '%s | DevSure',
  },
  description:
    'Creamos soluciones digitales mantenibles con una base técnica clara y capacidades verificables.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DevSure | Desarrollo de software confiable',
    description:
      'Creamos soluciones digitales mantenibles con una base técnica clara y capacidades verificables.',
    type: 'website',
    siteName: 'DevSure',
    url: 'https://devsure.example',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0a1023',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido-principal">
          Saltar al contenido
        </a>
        <SiteHeader />
        <main id="contenido-principal">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
