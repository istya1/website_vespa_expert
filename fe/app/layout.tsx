// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/toast-provider';

export const metadata: Metadata = {
  title: 'Vespa Expert Dashboard',
  description: 'Sistem Pakar Diagnosa Kerusakan Vespa',
    icons: {
    icon: '/asset/Logo.png', // favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <ToastProvider />
      </body>

      
    </html>
  );
}