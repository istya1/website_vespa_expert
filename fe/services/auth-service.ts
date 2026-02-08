// src/services/auth-service.ts
import ApiService from './api-service';
import { User } from '@/types';

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

const AuthService = {
  /* ===================== LOGIN ===================== */
  async login(email: string, password: string): Promise<User> {
    const response = await ApiService.post<LoginResponse>('/login', {
      email,
      password,
    });

    const { user, token } = response;

    if (!token || !user) {
      throw new Error('Login gagal: token atau user tidak ditemukan');
    }

    if (!user.id_user) {
      throw new Error('Login gagal: data user tidak valid');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  /* ===================== LOGOUT ===================== */
  async logout(): Promise<void> {
    try {
      await ApiService.post('/logout');
    } catch {
      console.warn('Logout API gagal, tetap clear local data');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /* ===================== TOKEN ===================== */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  /* ===================== USER ===================== */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user: User = JSON.parse(userStr);
      return user?.id_user ? user : null;
    } catch {
      return null;
    }
  },

  /* ===================== AUTH CHECK ===================== */
  isAuthenticated(): boolean {
    return !!AuthService.getToken();
  },

  requireAuth: async (): Promise<boolean> => {
  const token = AuthService.getToken();
  if (!token) return false;

  try {
    // Coba panggil endpoint /me atau endpoint ringan yang butuh auth
    await ApiService.get('/me');   // atau /auth/check kalau kamu punya
    return true;
  } catch (error: any) {
    // Jika 401/403 → token invalid/expired
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      AuthService.logout(); // auto logout kalau token invalid
      return false;
    }
    // Error lain (network dll) → anggap saja masih auth (atau handle sesuai kebutuhan)
    return true;
  }
},

  /* ===================== LUPA PASSWORD ===================== */

  // 1️⃣ KIRIM LINK RESET KE EMAIL
  async forgotPassword(email: string): Promise<void> {
    await ApiService.post('/forgot-password', { email });
  },

  // 2️⃣ RESET PASSWORD DENGAN TOKEN
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
