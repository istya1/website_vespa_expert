import ApiService from './api-service';
import { JenisMotor } from '@/types';

class JenisMotorService {
  async getAll(): Promise<JenisMotor[]> {
    return await ApiService.get('/jenis-motor');
  }

  async create(data: { nama_motor: string }) {
    return await ApiService.post('/jenis-motor', data);
  }

  async update(id: number, data: { nama_motor: string }) {
    return await ApiService.put(`/jenis-motor/${id}`, data);
  }

  async delete(id: number) {
    return await ApiService.delete(`/jenis-motor/${id}`);
  }
}

export default new JenisMotorService();