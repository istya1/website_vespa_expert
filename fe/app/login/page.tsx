// src/app/login/page.tsx
'use client';                   

import { useState, useEffect, FormEvent } from 'react';   
import { useRouter } from 'next/navigation';            
import Link from 'next/link';                           
import AuthService from '@/services/auth-service';       
import toast from 'react-hot-toast';                     
import Cookies from 'js-cookie';                         

// Komponen utama halaman Login
export default function LoginPage() {

  const router = useRouter();                            // Inisialisasi router untuk melakukan redirect

  // State untuk mengelola input form
  const [email, setEmail] = useState('');                // Menyimpan nilai email yang diinput user
  const [password, setPassword] = useState('');          // Menyimpan nilai password yang diinput user
  const [loading, setLoading] = useState(false);         // State untuk mengontrol tombol loading saat proses login

  /**
   * Fungsi yang dijalankan ketika form login disubmit
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();                                  // Mencegah perilaku default form (reload halaman)
    setLoading(true);                                    // Aktifkan indikator loading

    try {
      // Panggil API login melalui AuthService
      const response = await AuthService.login(email, password);

      // 🔐 Security: Hanya izinkan role admin atau superadmin masuk ke dashboard ini
      if (response.role !== 'admin' && response.role !== 'superadmin') {
        toast.error('Akses hanya untuk admin');          // Tampilkan pesan error
        setLoading(false);
        return;
      }

      toast.success('Login berhasil!');                  // Tampilkan notifikasi sukses
      router.push('/dashboard');                         // Redirect ke halaman dashboard setelah login sukses
    } catch (err: any) {
      // Tangani error dari backend atau jaringan
      toast.error(err.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);                                 // Matikan loading di akhir proses (baik sukses maupun gagal)
    }
  };

  /**
   * useEffect ini berjalan sekali saat halaman login dimuat
   * Tujuannya: Membersihkan data login lama agar user harus login ulang
   */
  useEffect(() => {
    // Paksa logout / bersihkan sesi lama saat membuka halaman login
    Cookies.remove('token');                             // Hapus token dari cookies
    localStorage.removeItem('token');                    // Hapus token dari localStorage
    localStorage.removeItem('user');                     // Hapus data user dari localStorage
  }, []);                                                // Dependency array kosong = hanya dijalankan 1x saat mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      
      {/* Card Login */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-3">

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/asset/logo.png"
            alt="Vespa Expert Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Judul Aplikasi */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Vespa Expert
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Silahkan login untuk melanjutkan
        </p>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Input Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}                                    // Binding dua arah dengan state email
              onChange={(e) => setEmail(e.target.value)}       // Update state setiap user mengetik
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="admin@vespa.com"
              required
            />
          </div>

          {/* Input Password */}
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

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}                                 // Tombol disable saat proses loading
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Login'}                
          </button>
        </form>

        {/* Link ke Halaman Register */}
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