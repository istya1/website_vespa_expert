import api from './api-service';

export interface Kategori {
  id: number;
  nama_kategori: string;
}

const KategoriService = {
  async getAll(): Promise<Kategori[]> {
    const res = await api.get('/kategori');
    return res?.data ?? res ?? [];
  },
  async getById(id: number): Promise<Kategori> {
    const res = await api.get(`/kategori/${id}`);
    return res?.data ?? res;
  },
  async create(payload: { nama_kategori: string }) {
    const res = await api.post('/kategori', payload);
    return res?.data ?? res;
  },
  async update(id: number, payload: { nama_kategori: string }) {
    const res = await api.put(`/kategori/${id}`, payload);
    return res?.data ?? res;
  },
  async delete(id: number) {
    const res = await api.delete(`/kategori/${id}`);
    return res?.data ?? res;
  }
};

export default KategoriService;