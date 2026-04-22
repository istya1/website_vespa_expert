// src/services/kategori-service.ts
import ApiService from './api-service';

export interface KategoriItem {
  id: string | number;
  nama: string;
  bobot: number;
}

class KategoriService {
  async getAll(): Promise<KategoriItem[]> {
    return await ApiService.get<KategoriItem[]>('/kategori');
  }
}

export default new KategoriService();