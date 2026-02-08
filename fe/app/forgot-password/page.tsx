'use client';

import { useState } from 'react';
import AuthService from '@/services/auth-service';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await AuthService.forgotPassword(email);
      toast.success('Link reset password berhasil dikirim ke email');
    } catch {
      toast.error('Email tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-4 text-center">
          Lupa Password
        </h1>

        <input
          type="email"
          placeholder="Masukkan email terdaftar"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border p-3 rounded mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2 rounded"
        >
          {loading ? 'Mengirim...' : 'Kirim Link Reset'}
        </button>
      </form>
    </div>
  );
}
