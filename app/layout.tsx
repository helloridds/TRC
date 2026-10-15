import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRC — Tiffin & Restaurant Center',
  description: 'Fresh daily tiffins, thalis and snacks delivered to your door. Order morning & evening tiffin plans from TRC.',
  keywords: 'tiffin, thali, food delivery, TRC, snacks, daily meals',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'TRC — Tiffin & Restaurant Center',
    description: 'Fresh daily tiffins, thalis and snacks delivered to your door.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#fc6011',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
