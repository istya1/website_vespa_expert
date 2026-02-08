// src/services/DiagnosaService.ts
import ApiService from './api-service';
import { Diagnosa, ApiResponse } from '@/types';

class DiagnosaService {
  async getAll(): Promise<Diagnosa[]> {
    return await ApiService.get<Diagnosa[]>('/diagnosa');
  }

  async getById(id: number): Promise<Diagnosa> {
    return await ApiService.get<Diagnosa>(`/diagnosa/${id}`);
  }

  async delete(id: number): Promise<ApiResponse> {
    return await ApiService.delete<ApiResponse>(`/diagnosa/${id}`);
  }

  async getMonthlyStats(): Promise<{ month: string; count: number }[]> {
    const diagnosaList = await this.getAll();
    
    const monthlyData: { [key: string]: number } = {};
    
    diagnosaList.forEach((diagnosa) => {
      const date = new Date(diagnosa.tanggal);
      const monthYear = `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getFullYear()}`;
      
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }
}

export default new DiagnosaService();