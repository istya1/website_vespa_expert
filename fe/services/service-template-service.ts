// src/services/service-template-service.ts
import apiService from './api-service';

export interface ServiceTemplate {
  id: number;
  jenis_motor: 'Sprint' | 'LX' | 'Primavera';
  jenis_service: 'Ganti Oli' | 'Service Berkala' | 'Ganti CVT';
  interval_km: number;
  interval_hari: number;
  deskripsi?: string | null;
  biaya_estimasi?: string | null;
}

const BASE_URL = '/service-templates';

const ServiceTemplateService = {
  // FIX: langsung return response (karena apiService sudah return data)
  async getAll(params?: { jenis_motor?: string }): Promise<ServiceTemplate[]> {
    return await apiService.get<ServiceTemplate[]>(BASE_URL, { params });
  },

  // FIX: Laravel return { data: ... }, jadi ambil response.data
  async create(data: Omit<ServiceTemplate, 'id'>): Promise<ServiceTemplate> {
    const response = await apiService.post<{ data: ServiceTemplate }>(BASE_URL, data);
    return response.data;
  },

  async update(id: number, data: Partial<ServiceTemplate>): Promise<ServiceTemplate> {
    const response = await apiService.put<{ data: ServiceTemplate }>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/${id}`);
  },
};

export default ServiceTemplateService;