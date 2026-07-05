// services/servis-service.ts
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Tambahkan interceptor untuk token (dari localStorage di web)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');   // ← Gunakan localStorage untuk web
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DataServis {
  id: number;
  user: { id_user: number; nama: string; email: string };
  kendaraan: { nama_kendaraan: string; nomor_plat: string };
  km_sekarang: number;
  km_target_oli: number;
  rata_rata_km_per_hari: number;
  interval_ganti_oli: number;
  waktu_input: string;
  estimasi_tanggal_deadline: string;
  tanggal_mulai_notif: string;
  sudah_ganti_oli: boolean;
  tanggal_ganti_oli: string | null;
  // TAMBAHAN — accessor dari backend (Model CatatanServis)
  estimasi_km_sekarang: number;
  sisa_km: number;
  sisa_hari: number;
  status_kondisi: 'aman' | 'segera' | 'kritis' | 'selesai';
}

export const servisApi = {
  getDetail: async (kendaraanId: number) => {
    const res = await api.get(`/kendaraan/${kendaraanId}/servis`);
    return res;
  },

  simpanData: async (data: any) => {
    const res = await api.post('/servis', data);
    return res;
  },

  konfirmasiGantiOli: async (servisId: number) => {
    const res = await api.patch(`/servis/${servisId}/ganti-oli`);
    return res;
  },
  
};
export async function getSemuaServisAdmin(): Promise<DataServis[]> {
  const res = await api.get('/admin/servis');
  return res.data.data ?? [];
}