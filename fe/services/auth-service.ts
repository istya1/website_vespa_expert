// src/services/auth-service.ts
import ApiService from './api-service';      // Import service HTTP yang sudah terkonfigurasi
import { User } from '@/types';              // Import tipe data User dari folder types

// Interface untuk response dari endpoint login
interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

// Object AuthService yang berisi semua fungsi terkait autentikasi
const AuthService = {

  /* ===================== LOGIN ===================== */

  /**
   * Melakukan proses login user
   * @param email - Email user
   * @param password - Password user
   * @returns Data user yang berhasil login
   */
  async login(email: string, password: string): Promise<User> {
    // Kirim request POST ke endpoint /login menggunakan ApiService
    const response = await ApiService.post<LoginResponse>('/login', {
      email,
      password,
    });

    // Destructure data dari response
    const { user, token } = response;

    // Validasi: Pastikan token dan user ada
    if (!token || !user) {
      throw new Error('Login gagal: token atau user tidak ditemukan');
    }

    // Validasi tambahan: Pastikan id_user ada (menandakan data user valid)
    if (!user.id_user) {
      throw new Error('Login gagal: data user tidak valid');
    }

    // Simpan token dan data user ke localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;   // Kembalikan data user
  },

  /* ===================== LOGOUT ===================== */

  /**
   * Melakukan proses logout
   * Mengirim request logout ke backend lalu membersihkan data lokal
   */
  async logout(): Promise<void> {
    try {
      // Coba panggil endpoint logout di backend
      await ApiService.post('/logout');
    } catch {
      // Jika API logout gagal (misalnya token sudah expired), tetap lanjutkan
      console.warn('Logout API gagal, tetap clear local data');
    } finally {
      // Selalu hapus data autentikasi dari localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /* ===================== TOKEN ===================== */

  /**
   * Mengambil token dari localStorage
   * Mengecek apakah sedang dijalankan di server atau client (Next.js SSR safety)
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;   // Cegah error di server-side
    return localStorage.getItem('token');
  },

  /* ===================== USER ===================== */

  /**
   * Mengambil data user yang tersimpan di localStorage
   * @returns Data user atau null jika tidak ada / tidak valid
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user: User = JSON.parse(userStr);
      // Pastikan data user memiliki id_user (validasi sederhana)
      return user?.id_user ? user : null;
    } catch {
      // Jika JSON parse gagal
      return null;
    }
  },

  /* ===================== AUTH CHECK ===================== */

  /**
   * Mengecek apakah user sudah login (hanya cek keberadaan token)
   */
  isAuthenticated(): boolean {
    return !!AuthService.getToken();   // !! mengubah nilai menjadi boolean
  },

  /**
   * Mengecek keaslian token dengan memanggil endpoint yang membutuhkan autentikasi
   * Berguna untuk proteksi halaman (middleware / route guard)
   */
 requireAuth: async (): Promise<boolean> => {
  const token = AuthService.getToken();
  if (!token) return false;

  try {
    await ApiService.get('/me');
    return true;
  } catch (error: any) {
    if (error?.status === 401) {
      await AuthService.logout();
      return false;
    }

    // network error → jangan logout
    return true;
  }
},

  /* ===================== LUPA PASSWORD ===================== */

  /**
   * Mengirim permintaan lupa password (kirim OTP atau link reset ke email)
   */
  async forgotPassword(email: string): Promise<void> {
    await ApiService.post('/forgot-password', { email });
  },

  /**
   * Reset password menggunakan token dan email
   * @param token - Token reset password
   * @param email - Email user
   * @param password - Password baru
   * @param password_confirmation - Konfirmasi password baru
   */
  async resetPassword(
    token: string,
    email: string,
    password: string,
    password_confirmation: string
  ): Promise<void> {
    await ApiService.post('/reset-password', {
      token,
      email,
      password,
      password_confirmation,
    });
  },

};

export default AuthService;