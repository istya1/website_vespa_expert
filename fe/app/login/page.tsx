// src/app/login/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthService from '@/services/auth-service';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await AuthService.login(email, password);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // paksa logout saat buka halaman login
  Cookies.remove('token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-3">
        {/* Logo lebih besar */}
        <div className="flex justify-center mb-2">
          <img
            src="/asset/logo.png"
            alt="Vespa Expert Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Vespa Expert
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Silahkan login untuk melanjutkan
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="admin@vespa.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="Masukkan password"
              required
            />
          </div>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Lupa password?
            </Link>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        {/* Link to Register */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Belum punya akun?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
            Daftar di sini
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Vespa Expert. All rights reserved.
        </p>
      </div>
    </div>
  );
}