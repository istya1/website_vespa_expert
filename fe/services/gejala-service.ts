// src/services/GejalaService.ts
import ApiService from './api-service';
import { Gejala, ApiResponse } from '@/types';

class GejalaService {
 async getAll(jenisMotor?: string): Promise<Gejala[]> {
  const params = jenisMotor
    ? `?jenis_motor=${encodeURIComponent(jenisMotor)}`
    : '';

  return await ApiService.get<Gejala[]>(`/gejala${params}`);
}


  async getById(kode: string): Promise<Gejala> {
    return await ApiService.get<Gejala>(`/gejala/${kode}`);
  }

  async create(data: Partial<Gejala>): Promise<ApiResponse<Gejala>> {
    return await ApiService.post<ApiResponse<Gejala>>('/gejala', data);
  }

  async update(kode: string, data: Partial<Gejala>): Promise<ApiResponse<Gejala>> {
    return await ApiService.put<ApiResponse<Gejala>>(`/gejala/${kode}`, data);
  }

  async delete(kode: string): Promise<ApiResponse> {
    return await ApiService.delete<ApiResponse>(`/gejala/${kode}`);
  }

  async count(): Promise<number> {
    const gejala = await this.getAll();
    return Array.isArray(gejala) ? gejala.length : 0;
  }
}

export default new GejalaService();