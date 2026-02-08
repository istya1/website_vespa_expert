// src/services/vespa-pedia-service.ts
import ApiService from './api-service';
import type { VespaPedia } from '@/types';  // Import dari central types

class VespaPediaService {
  private baseUrl = '/vespa-pedia';

  async getAll(params?: { jenis_motor?: string; kategori?: string }): Promise<VespaPedia[]> {
    const response = await ApiService.get<VespaPedia[]>(this.baseUrl, { params });
    return response;  // Langsung return array (sesuai struktur ApiService.get<T[]>)
  }

  async getById(id: number): Promise<VespaPedia> {
    const response = await ApiService.get<VespaPedia>(`${this.baseUrl}/${id}`);
    return response;  // Langsung return object
  }

  async create(data: FormData): Promise<VespaPedia> {
    const response = await ApiService.post(this.baseUrl, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;  // Laravel return { message, data: VespaPedia }
  }

  async update(id: number, data: FormData): Promise<VespaPedia> {
    data.append('_method', 'PUT');  // Laravel method spoofing

    const response = await ApiService.post(`${this.baseUrl}/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;  // Laravel return { message, data: VespaPedia }
  }

  async delete(id: number): Promise<void> {
    await ApiService.delete(`${this.baseUrl}/${id}`);
  }
}

export default new VespaPediaService();