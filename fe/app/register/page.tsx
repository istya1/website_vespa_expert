// src/app/register/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api-service';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nama: '',
        email: '',
        password: '',
        confirmPassword: '',
        no_hp: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validasi
        if (formData.password !== formData.confirmPassword) {
            toast.error('Password tidak cocok');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setLoading(true);

        try {
            // ✅ GUNAKAN API INSTANCE
            const response = await api.post('/register', {
                nama: formData.nama,
                email: formData.email,
                password: formData.password,
                role: 'admin',
                no_hp: formData.no_hp,
            });

            toast.success('Registrasi berhasil! Silakan login');
            router.push('/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registrasi gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4">
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
                    Daftar Akun
                </h1>
                <p className="text-center text-gray-600 mb-4">
                    Buat akun admin baru
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nama"
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="admin@vespa.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="no_hp" className="block text-sm font-medium text-gray-700 mb-2">
                            No HP
                        </label>
                        <input
                            id="no_hp"
                            type="text"
                            value={formData.no_hp}
                            onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="Minimal 6 karakter"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Konfirmasi Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="Ulangi password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Mendaftar...' : 'Daftar'}
                    </button>
                </form>

                {/* Link to Login */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                        Login di sini
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