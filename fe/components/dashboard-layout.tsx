// src/components/DashboardLayout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './sidebar';
import Header from './header';
import AuthService from '@/services/auth-service';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header title={title} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}