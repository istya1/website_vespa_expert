// src/services/user-service.ts
import ApiService from './api-service';
import { User } from '@/types';

interface MonthlyUserStat {
  month: string;
  userCount: number;   // pengguna biasa (role: 'pengguna')
  adminCount: number;  // role: 'admin'
}

class UserService {
  // GET all users by role (sudah ada, tetap)
  async get(role?: string): Promise<User[]> {
    const users = await ApiService.get<User[]>(`/users${role ? `?role=${role}` : ''}`);
    return users ?? [];
  }

  // GET user by ID
  async getById(id: number): Promise<User | null> {
    try {
      const user = await ApiService.get<User>(`/users/${id}`);
      return user ?? null;
    } catch (err) {
      return null;
    }
  }

  // CREATE user
  async create(data: Partial<User>): Promise<User> {
    const user = await ApiService.post<User>('/users', data);
    return user;
  }

  // UPDATE user (JSON only)
  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await ApiService.put<User>(`/users/${id}`, data);
    return user;
  }

  // UPDATE profile (bisa termasuk foto)
  async updateProfile(id: number, data: Partial<User> & { foto?: any }): Promise<User> {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      if (data[key] !== undefined && data[key] !== null) formData.append(key, data[key]);
    });
    // jika ada foto lokal (untuk mobile/react-native?)
    if (data.foto && typeof data.foto === 'string' && data.foto.startsWith('file://')) {
      const filename = data.foto.split('/').pop();
      const match = /\.(\w+)$/.exec(filename!);
      const type = match ? `image/${match[1]}` : 'image';
      formData.append('foto', {
        uri: data.foto,
        name: filename,
        type,
      } as any);
    }
    const user = await ApiService.put<User>(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return user;
  }

  // DELETE user
  async delete(id: number): Promise<void> {
    await ApiService.delete(`/users/${id}`);
  }

  async uploadPhoto(id: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('foto', file);
    return await ApiService.post(`/users/${id}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async changePassword(
    id: number,
    data: { oldPassword: string; newPassword: string }
  ): Promise<any> {
    return await ApiService.post(`/users/${id}/change-password`, data);
  }

  // Ambil SEMUA user (tanpa filter role) – untuk keperluan statistik & total
  async getAll(): Promise<User[]> {
    const res = await ApiService.get<User[]>('/users');  // tanpa query ?role=
    return res ?? [];
  }

  // Statistik bulanan: jumlah pengguna baru & admin baru per bulan
  async getMonthlyUserStats(): Promise<MonthlyUserStat[]> {
    try {
      const allUsers = await this.getAll();  // panggil method instance sendiri

      const statsMap = new Map<string, { user: number; admin: number }>();

      allUsers.forEach((user: User) => {  // sekarang pakai User, bukan any
        if (!user.created_at) return;

        const date = new Date(user.created_at);
        const monthKey = date.toLocaleString('id-ID', {
          year: 'numeric',
          month: 'short',
        }); // contoh: "Mar 2026"

        if (!statsMap.has(monthKey)) {
          statsMap.set(monthKey, { user: 0, admin: 0 });
        }

        const current = statsMap.get(monthKey)!;

        if (user.role === 'pengguna') {
          current.user += 1;
        } else if (user.role === 'admin') {
          current.admin += 1;
        }
      });

      // Konversi ke array & urutkan berdasarkan waktu
      const sorted = Array.from(statsMap.entries())
        .map(([month, counts]) => ({
          month,
          userCount: counts.user,
          adminCount: counts.admin,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month + ' 1');
          const dateB = new Date(b.month + ' 1');
          return dateA.getTime() - dateB.getTime();
        });

      return sorted;
    } catch (err) {
      console.error('Gagal ambil monthly user stats:', err);
      return [];
    }
  }
}

export default new UserService();