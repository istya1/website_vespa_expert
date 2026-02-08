// src/services/ApiService.ts
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
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Request to:', config.url, 'with token'); 
        } else {
          console.warn('⚠️ No token found for request:', config.url); 
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error); 
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Response from:', response.config.url, 'Status:', response.status); 
        console.log('✅ Response data:', response.data); 
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ Response error:', error.config?.url, error.response?.status); 
        console.error('❌ Error data:', error.response?.data); 
        
        if (error.response?.status === 401) {
          console.error('❌ Unauthorized - clearing auth data'); 
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
      console.log('📍 GET request to:', url); 
      const response = await this.api.get<T>(url, config);
      console.log('📍 GET response data:', response.data); 
      return response.data;
    } catch (error) {
      console.error('📍 GET error:', error);
      throw this.handleError(error as AxiosError);
    }
  }

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

  private handleError(error: AxiosError): ApiResponse {
    console.error('🔥 Handling error:', error); 
    
    if (error.response) {
      const errorResponse = {
        message: (error.response.data as any)?.message || 'Terjadi kesalahan',
        status: error.response.status,
      };
      console.error('🔥 Error response:', errorResponse); 
      return errorResponse;
    } else if (error.request) {
      const errorResponse = {
        message: 'Tidak dapat terhubung ke server',
        status: 0,
      };
      console.error('🔥 No response from server:', errorResponse);
      return errorResponse;
    } else {
      const errorResponse = {
        message: error.message || 'Terjadi kesalahan',
        status: 0,
      };
      console.error('🔥 Request setup error:', errorResponse); 
      return errorResponse;
    }
  }
}

export default new ApiService();