import api from './api-service';

export interface Gejala {
  kode_gejala: string;
  nama_gejala: string;
  jenis_motor: string;
  kategori_id: number;
  bobot: number;

  // relasi
  kategori?: {
    id: number;
    nama_kategori: string;
  };
}

const GejalaService = {
  // GET ALL (optional filter jenis_motor)
 async getAll(jenis_motor?: string): Promise<Gejala[]> {
  const res = await api.get('/gejala', {
    params: { jenis_motor }
  });
  console.log('HASIL API:', res); // ← ini yang penting
  return Array.isArray(res) ? res : (res as any)?.data ?? [];
},

  // GET BY KODE
  async getByKode(kode: string): Promise<Gejala> {
    const res = await api.get(`/gejala/${kode}`);
    return res.data; // ✅
  },

  // CREATE
  async create(payload: {
    nama_gejala: string;
    jenis_motor: string;
    kategori_id: number;
    bobot: number;
  }) {
    const res = await api.post('/gejala', payload);
    return res.data;
  },

  // UPDATE
  async update(kode: string, payload: Partial<Gejala>) {
    const res = await api.put(`/gejala/${kode}`, payload);
    return res.data; // ✅
  },

  // DELETE
  async delete(kode: string) {
    const res = await api.delete(`/gejala/${kode}`);
    return res.data; // ✅
  }
};

export default GejalaService;