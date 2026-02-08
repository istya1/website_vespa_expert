// src/services/user-service-reminder-service.ts
import apiService from './api-service';

export interface UserServiceReminder {
  id: number;
  id_user: number;
  jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
  jenis_service: 'Ganti Oli' | 'Service Berkala' | 'Ganti CVT';
  km_terakhir: number;
  tanggal_terakhir: string;
  km_berikutnya: number;
  tanggal_berikutnya: string;
  status: 'aktif' | 'terlewat' | 'selesai';
  sudah_notif: number;
  user?: { nama: string; email: string };
}

const BASE_URL = '/user-reminders';

const UserServiceReminderService = {
  async getAll(params?: { jenis_motor?: string; status?: string }): Promise<UserServiceReminder[]> {
    const response = await apiService.get<UserServiceReminder[]>(BASE_URL, { params });
    return response;
  },

  async sendNotification(id: number) {
    await apiService.post(`${BASE_URL}/${id}/send-notification`);
  },
};

export default UserServiceReminderService;