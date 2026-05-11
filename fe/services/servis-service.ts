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
  user: { name: string; email: string };
  kendaraan: { nama_kendaraan: string; nomor_plat: string };
  estimasi_km_sekarang: number;
  km_target_oli: number;
  sisa_km: number;
  sisa_hari: number;
  status_kondisi: 'aman' | 'segera' | 'kritis' | 'selesai';
  estimasi_tanggal_deadline: string;
  sudah_ganti_oli?: boolean;
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