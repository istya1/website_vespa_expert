import ApiService from './api-service';
import { Solusi, ApiResponse } from '@/types';

class SolusiService {
  async getAll(): Promise<Solusi[]> {
    return await ApiService.get<Solusi[]>('/solusi');
  }

  async create(data: Partial<Solusi>) {
    return await ApiService.post('/solusi', data);
  }

  async update(kode: string, data: Partial<Solusi>) {
    return await ApiService.put(`/solusi/${kode}`, data);
  }

  async delete(kode: string) {
    return await ApiService.delete(`/solusi/${kode}`);
  }
}

export default new SolusiService();
