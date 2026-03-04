// src/services/diagnosa-service.ts
import api from './api-service';
import { DiagnosisRequest, DiagnosisResponse } from '@/types';

interface MonthlyStat {
  month: string;
  count: number;
}

const DiagnosaService = {

 
  async prosesDiagnosis(
    data: DiagnosisRequest
  ): Promise<DiagnosisResponse> {
    const res = await api.post('/mobile/proses-diagnosis', data);
    return res.data;
  },

 async simpanDiagnosisMobile(data: {
    jenis_motor: string;
    gejala_terpilih: string[];
    hasil_diagnosis: any[];
  }) {
    const res = await api.post('/mobile/diagnosa', data);
    return res.data;
  },

 
  async getAllAdmin() {
  const res = await api.get('/diagnosa'); // ✅ hapus admin
  return res.data.data;
},

async deleteAdmin(id: number) {
  const res = await api.delete(`/diagnosa/${id}`); // ✅ hapus admin
  return res.data;
},

async getMonthlyStats(): Promise<MonthlyStat[]> {
    try {
      // Karena tidak ada method getAll() di service ini,
      // kita gunakan endpoint yang sudah ada → getAllAdmin() (asumsi mengembalikan semua diagnosa)
      const allDiagnosa = await DiagnosaService.getAllAdmin();

      const statsMap = new Map<string, number>();

      allDiagnosa.forEach((d: any) => {  // tambah :any sementara, atau definisikan tipe Diagnosa jika ada
        if (!d.created_at) return;
        const date = new Date(d.created_at);
        const monthKey = date.toLocaleString('id-ID', {
          year: 'numeric',
          month: 'short',
        }); // contoh: "Okt 2025"

        statsMap.set(monthKey, (statsMap.get(monthKey) || 0) + 1);
      });

      // Urutkan berdasarkan tanggal
      const sorted = Array.from(statsMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          // Parse "Okt 2025" → Date (asumsi format Indonesia)
          const [bulanStr, tahun] = a.month.split(' ');
          const dateA = new Date(`${tahun}-${bulanStr}-01`);
          const dateB = new Date(`${tahun}-${b.month.split(' ')[0]}-01`);
          return dateA.getTime() - dateB.getTime();
        });

      return sorted;
    } catch (err) {
      console.error('Gagal ambil monthly stats:', err);
      return [];
    }
  },
};


export default DiagnosaService;