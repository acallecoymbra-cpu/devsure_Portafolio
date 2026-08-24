import type { Metadata, Viewport } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://devsure.example'),
  title: {
    default: 'DevSure | Fundaciones digitales claras',
    template: '%s | DevSure',
  },
  description: 'Un punto de partida accesible y adaptable para experiencias digitales confiables.',
  openGraph: {
    title: 'DevSure | Fundaciones digitales claras',
    description:
      'Un punto de partida accesible y adaptable para experiencias digitales confiables.',
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
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
