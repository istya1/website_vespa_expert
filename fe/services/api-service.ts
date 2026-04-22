// src/services/ApiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { ApiResponse } from '@/types';


// Class utama untuk mengelola semua request HTTP ke backend
class ApiService {
  
  // Instance axios yang akan digunakan untuk semua request
  private api: AxiosInstance;

  // Constructor dijalankan saat class ini pertama kali di-import
  constructor() {
    // Membuat instance axios dengan konfigurasi dasar
    this.api = axios.create({
      baseURL: API_BASE_URL,                    // URL dasar backend (contoh: http://localhost:8000/api)
      headers: {
        'Content-Type': 'application/json',     // Default header untuk semua request
      },
    });

    // Setup interceptor (penengah) untuk request dan response
    this.setupInterceptors();
  }

  /**
   * Mengatur interceptor untuk request dan response
   * Interceptor berfungsi menjalankan kode sebelum/after request dikirim atau response diterima
   */
 private setupInterceptors(): void {
  this.api.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Request to:', config.url, 'with token');
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  this.api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized (401)');
      }
      return Promise.reject(error);
    }
  );


    // ==================== RESPONSE INTERCEPTOR ====================
    // Dijalankan setelah response diterima dari server
    this.api.interceptors.response.use(
      (response) => {
        // Log sukses (untuk debugging)
        console.log('✅ Response from:', response.config.url, 'Status:', response.status);
        console.log('✅ Response data:', response.data);
        return response;   // Kembalikan response seperti semula
      },
      (error: AxiosError) => {
        // Tangani error response
        console.error('❌ Response error:', error.config?.url, error.response?.status);
        console.error('❌ Error data:', error.response?.data);

        // Jika status 401 (Unauthorized) → otomatis logout user
        if (error.response?.status === 401) {
  console.warn('⚠️ Unauthorized (401) - token mungkin expired, tapi tidak dihapus otomatis');
}
        //   // Hapus data autentikasi
        //   localStorage.removeItem('token');
        //   localStorage.removeItem('user');
          
        //   // Redirect ke halaman login
        //   window.location.href = '/login';
        // }

        return Promise.reject(error);   // Teruskan error ke catch block
      }
    );
  }

  /**
   * Method GET
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log('📍 GET request to:', url);
      const response = await this.api.get<T>(url, config);
      console.log('📍 GET response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('📍 GET error:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Method POST
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log('📍 POST request to:', url, 'with data:', data);
      const response = await this.api.post<T>(url, data, config);
      console.log('📍 POST response data:', response.data); // ✅ DEBUG
      return response.data;
    } catch (error) {
      console.error('📍 POST error:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Method PUT
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log('📍 PUT request to:', url, 'with data:', data);
      const response = await this.api.put<T>(url, data, config);
      console.log('📍 PUT response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('📍 PUT error:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Method DELETE
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log('📍 DELETE request to:', url);
      const response = await this.api.delete<T>(url, config);
      console.log('📍 DELETE response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('📍 DELETE error:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Fungsi helper untuk menangani error secara terstruktur
   * Mengubah error axios menjadi format yang lebih mudah dibaca
   */
  private handleError(error: AxiosError): ApiResponse {
    console.error('🔥 Handling error:', error);

    if (error.response) {
      // Server merespons dengan status error (4xx, 5xx)
      const errorResponse = {
        message: (error.response.data as any)?.message || 'Terjadi kesalahan',
        status: error.response.status,
      };
      console.error('🔥 Error response:', errorResponse);
      return errorResponse;
    } 
    else if (error.request) {
      // Request dikirim tapi tidak ada response dari server
      const errorResponse = {
        message: 'Tidak dapat terhubung ke server',
        status: 0,
      };
      console.error('🔥 No response from server:', errorResponse);
      return errorResponse;
    } 
    else {
      // Error saat setup request
      const errorResponse = {
        message: error.message || 'Terjadi kesalahan',
        status: 0,
      };
      console.error('🔥 Request setup error:', errorResponse);
      return errorResponse;
    }
  }
}

// Export instance tunggal (Singleton Pattern)
export default new ApiService();