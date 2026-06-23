'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/services/auth-service';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email.trim()) {
      setEmailError('Email tidak boleh kosong');
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Format email tidak valid');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password tidak boleh kosong');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const response = await AuthService.login(email, password);

      if (response.role !== 'admin' && response.role !== 'superadmin') {
        toast.error('Akses hanya untuk admin');
        return;
      }

      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (err: any) {
      setGeneralError('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ DIHAPUS: useEffect yang hapus token saat buka halaman login
  // Kalau token dihapus di sini, middleware tidak bisa cek apakah user sudah login
  // Penghapusan token hanya boleh terjadi saat LOGOUT (di AuthService.logout())

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/asset/logo.png" alt="Vespa Expert Logo" className="w-24 h-24 object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Vespa Matic Expert</h1>
        <p className="text-center text-gray-600 mb-8">Silakan login untuk melanjutkan</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                setGeneralError('');
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="admin@vespa.com"
            />
            {emailError && <p className="mt-1 text-sm text-red-600">⚠ {emailError}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setGeneralError('');
                }}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition ${
                  passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-sm text-red-600">⚠ {passwordError}</p>}
          </div>

          {/* General Error */}
          {generalError && (
            <p className="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg">
              ⚠ {generalError}
            </p>
          )}

          {/* Button Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 Vespa Matic Expert.
        </p>
      </div>
    </div>
  );
}
