import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TRC — Order Fresh Food',
  description: 'Order tiffins, thalis and snacks from TRC',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
