// src/services/diagnosis-service.ts
import api from './api-service';
import { DiagnosisRequest, DiagnosisResponse } from '@/types';

const DiagnosisService = {
  /**
   * Proses diagnosis dengan iterasi
   */
  async prosesDiagnosis(data: DiagnosisRequest): Promise<DiagnosisResponse> {
    const res = await api.post('/diagnosis/proses', data);
    return res.data;
  },

  /**
   * Get detail kerusakan
   */
  async getDetailKerusakan(kodeKerusakan: string) {
    const res = await api.get(`/diagnosis/kerusakan/${kodeKerusakan}`);
    return res.data;
  },

  /**
   * Get data Vespa Smart (gejala by kategori)
   */
  async getVespaSmartData(jenisMotor: string) {
    const res = await api.get(`/diagnosis/vespa-smart?jenis_motor=${jenisMotor}`);
    return res.data;
  }
};

export default DiagnosisService;