'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthService from '@/services/auth-service';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const email = params.get('email'); // ✅ WAJIB
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      toast.error('Link reset tidak valid');
      return;
    }

    if (password !== confirm) {
      toast.error('Password tidak sama');
      return;
    }

    try {
      await AuthService.resetPassword(
        token,
        email,
        password,
        confirm
      );

      toast.success('Password berhasil direset');
      router.push('/login');
    } catch {
      toast.error('Token tidak valid atau kadaluarsa');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-4 text-center">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="Password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border p-3 rounded mb-3"
        />

        <input
          type="password"
          placeholder="Konfirmasi password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full border p-3 rounded mb-4"
        />

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
