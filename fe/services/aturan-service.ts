// src/services/aturan-service.ts
import ApiService from './api-service';

export interface AturanPayload {
  kode_kerusakan: string;
  gejala: string[];
}

class AturanService {
  async getAll() {
    return await ApiService.get('/aturan');
  }

  async create(data: AturanPayload) {
    return await ApiService.post('/aturan', data);
  }
  async update(
    id: number,
    data: {
      kode_kerusakan: string;
      gejala: string[];
      
    }
  ) {
    return await ApiService.put(`/aturan/${id}`, data);
  }
  async delete(id: number) {
    return await ApiService.delete(`/aturan/${id}`);
  }
}

export default new AturanService();
