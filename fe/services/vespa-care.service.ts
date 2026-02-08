import ApiService from './api-service';

export interface VespaCareTemplate {
  id: number;
  jenis_motor: 'Sprint' | 'LX' | 'Primavera';
  jenis_service: 'Ganti Oli' | 'Service Berkala';
  interval_km: number;
  interval_hari: number;
  deskripsi?: string;
  biaya_estimasi?: string;
  created_at?: string;
}

class VespaCareTemplateService {
  async getAll(): Promise<VespaCareTemplate[]> {
    // ✨ return res.data.data dari Laravel
    const res = await ApiService.get<{ status: string; data: VespaCareTemplate[] }>('/vespa-care/template');
    return res.data; // sekarang res.data adalah array VespaCareTemplate
  }

  async getById(id: number): Promise<VespaCareTemplate> {
    const res = await ApiService.get<{ status: string; data: VespaCareTemplate }>(`/vespa-care/template/${id}`);
    return res.data;
  }

  async create(data: Partial<VespaCareTemplate>): Promise<VespaCareTemplate> {
    const res = await ApiService.post<{ status: string; data: VespaCareTemplate }>('/vespa-care/template', data);
    return res.data;
  }

  async update(id: number, data: Partial<VespaCareTemplate>): Promise<VespaCareTemplate> {
    const res = await ApiService.put<{ status: string; data: VespaCareTemplate }>(`/vespa-care/template/${id}`, data);
    return res.data;
  }

  async delete(id: number): Promise<boolean> {
    const res = await ApiService.delete<{ status: string }>('/vespa-care/template/' + id);
    return res.status === 'success';
  }
}

export default new VespaCareTemplateService();
