// src/services/api-service.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { ApiResponse } from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {

    // ── REQUEST INTERCEPTOR ──────────────────────────────────────
    this.api.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ── RESPONSE INTERCEPTOR (hanya satu!) ───────────────────────
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Auto logout hanya jika 401 DAN bukan sedang di halaman login
        if (
          error.response?.status === 401 &&
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await this.api.get<T>(url, config);
    return response.data; // ✅
  } catch (error) {
    throw this.handleError(error as AxiosError);
  }
}

async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await this.api.post<T>(url, data, config); // ✅ hapus [this.api.post]
    return response.data; // ✅
  } catch (error) {
    throw this.handleError(error as AxiosError);
  }
}

async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await this.api.put<T>(url, data, config);
    return response.data; // ✅
  } catch (error) {
    throw this.handleError(error as AxiosError);
  }
}

async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await this.api.delete<T>(url, config);
    return response.data; // ✅
  } catch (error) {
    throw this.handleError(error as AxiosError);
  }
}


  // ✅ Sekarang throw Error agar bisa di-catch dengan err.message
  private handleError(error: AxiosError): never {
    if (error.response) {
      const message =
        (error.response.data as any)?.message || 'Terjadi kesalahan';
      const status = error.response.status;
      const err = new Error(message) as any;
      err.status = status;
      err.data = error.response.data;
      throw err;
    } else if (error.request) {
      throw new Error('Tidak dapat terhubung ke server');
    } else {
      throw new Error(error.message || 'Terjadi kesalahan');
    }
  }
}

export default new ApiService();