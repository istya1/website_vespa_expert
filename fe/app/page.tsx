// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/services/auth-service';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
     <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img
            src="/asset/load.png"
            alt="Loading"
            className="w-44 h-28 animate-pulse"
          />
          <p className="text-sm text-gray-500">
            Memuat data...
          </p>
        </div>
    </div>
  );
}