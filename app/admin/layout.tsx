import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TRC Admin',
  description: 'TRC Cafe Administration Portal',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
