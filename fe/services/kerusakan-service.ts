// src/services/KerusakanService.ts
import ApiService from './api-service';
import { Kerusakan, ApiResponse } from '@/types';

class KerusakanService {
  async getAll(jenisMotor?: string): Promise<Kerusakan[]> {
    const params = jenisMotor ? `?jenis_motor=${jenisMotor}` : '';
    return await ApiService.get<Kerusakan[]>(`/kerusakan${params}`);
  }

  async getById(kode: string): Promise<Kerusakan> {
    return await ApiService.get<Kerusakan>(`/kerusakan/${kode}`);
  }

  async create(data: Partial<Kerusakan>): Promise<ApiResponse<Kerusakan>> {
    return await ApiService.post<ApiResponse<Kerusakan>>('/kerusakan', data);
  }

  async update(kode: string, data: Partial<Kerusakan>): Promise<ApiResponse<Kerusakan>> {
    return await ApiService.put<ApiResponse<Kerusakan>>(`/kerusakan/${kode}`, data);
  }

  async delete(kode: string): Promise<ApiResponse> {
    return await ApiService.delete<ApiResponse>(`/kerusakan/${kode}`);
  }

  async count(): Promise<number> {
    const kerusakan = await this.getAll();
    return Array.isArray(kerusakan) ? kerusakan.length : 0;
  }
}

export default new KerusakanService();