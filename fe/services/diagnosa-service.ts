import api from './api-service';
import { Diagnosa } from '@/types';

const DiagnosaService = {
  async getAll(): Promise<Diagnosa[]> {
    const res = await api.get('/diagnosa');
    return res.data;
  },

  async getById(id: number): Promise<Diagnosa> {
    const res = await api.get(`/diagnosa/${id}`);
    return res.data;
  },

  async delete(id: number) {
    await api.delete(`/diagnosa/${id}`);
  },

  async update(id: number, data: any) {
    await api.put(`/diagnosa/${id}`, data);
  }
};

export default DiagnosaService;
