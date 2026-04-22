// src/services/user-service.ts
import ApiService from './api-service';   // Import service HTTP utama
import { User } from '@/types';           // Import tipe data User

// Interface untuk statistik user bulanan
interface MonthlyUserStat {
  month: string;        // Contoh: "Mar 2026"
  userCount: number;    // Jumlah pengguna biasa (role: 'pengguna')
  adminCount: number;   // Jumlah admin (role: 'admin')
}

// Class UserService untuk mengelola semua operasi terkait User
class UserService {

  /**
   * Helper method untuk POST ke endpoint /users/{endpoint}
   * Digunakan untuk endpoint custom seperti upload-photo, change-password, dll.
   */
  async post(endpoint: string, data: any) {
    return await ApiService.post(`/users/${endpoint}`, data);
  }

  /* ===================== BASIC CRUD ===================== */

  /**
   * Mengambil semua user (dengan filter role opsional)
   * Contoh: get() → semua user, get('pengguna') → hanya pengguna
   */
  async get(role?: string): Promise<User[]> {
    // Jika ada role, tambahkan query parameter ?role=xxx
    const users = await ApiService.get<User[]>(`/users${role ? `?role=${role}` : ''}`);
    return users ?? [];   // Kembalikan array kosong jika null/undefined
  }

  /**
   * Mengambil detail satu user berdasarkan ID
   */
  async getById(id: number): Promise<User | null> {
    try {
      const user = await ApiService.get<User>(`/users/${id}`);
      return user ?? null;
    } catch (err) {
      console.error(`Gagal mengambil user dengan ID ${id}`);
      return null;
    }
  }

  /**
   * Membuat user baru (biasanya digunakan oleh admin)
   */
  async create(data: Partial<User>): Promise<User> {
    const user = await ApiService.post<User>('/users', data);
    return user;
  }

  /**
   * Mengupdate data user (hanya JSON, tidak termasuk file)
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await ApiService.put<User>(`/users/${id}`, data);
    return user;
  }

  /**
   * Update profile user yang mendukung upload foto
   * Menggunakan FormData untuk mendukung multipart/form-data
   */
  async updateProfile(id: number, data: Partial<User> & { foto?: any }): Promise<User> {
    const formData = new FormData();

    // Loop semua data dan tambahkan ke FormData (kecuali null/undefined)
    Object.keys(data).forEach((key) => {
      const dataRecord = data as Record<string, any>;
      if (dataRecord[key] !== undefined && dataRecord[key] !== null) {
        formData.append(key, dataRecord[key]);
      }
    });

    // Penanganan khusus untuk foto dari React Native (URI file://)
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

    // Kirim request dengan header multipart/form-data
    const user = await ApiService.put<User>(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return user;
  }

  /**
   * Menghapus user berdasarkan ID
   */
  async delete(id: number): Promise<void> {
    await ApiService.delete(`/users/${id}`);
  }

  /* ===================== FITUR TAMBAHAN ===================== */

  /**
   * Upload foto profil secara terpisah
   */
  async uploadPhoto(id: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('foto', file);

    return await ApiService.post(`/users/${id}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * Mengubah password user (dengan verifikasi password lama)
   */
  async changePassword(
    id: number,
    data: { oldPassword: string; newPassword: string }
  ): Promise<any> {
    return await ApiService.post(`/users/${id}/change-password`, data);
  }

  /**
   * Mengambil SEMUA user tanpa filter role
   * Digunakan untuk statistik dan perhitungan total
   */
  async getAll(): Promise<User[]> {
    const res = await ApiService.get<User[]>('/users');   // Tanpa query parameter
    return res ?? [];
  }

  async countByRole(role: string): Promise<number> {
  const res = await ApiService.get<{ count: number }>(`/users/count/${role}`);
  return res.count; // ✅ langsung akses
}

  /* ===================== STATISTIK ===================== */

  /**
   * Mendapatkan statistik jumlah user dan admin per bulan
   * Data dihitung dari created_at milik semua user
   */
  async getMonthlyUserStats(): Promise<MonthlyUserStat[]> {
    try {
      // Ambil semua user terlebih dahulu
      const allUsers = await this.getAll();

      // Gunakan Map untuk mengelompokkan data per bulan
      const statsMap = new Map<string, { user: number; admin: number }>();

      allUsers.forEach((user: User) => {
        if (!user.created_at) return;

        const date = new Date(user.created_at);
        // Format bulan: "Mar 2026", "Apr 2026", dll.
        const monthKey = date.toLocaleString('id-ID', {
          year: 'numeric',
          month: 'short',
        });

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

      // Ubah Map menjadi array dan urutkan berdasarkan waktu
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
      return [];   // Kembalikan array kosong jika terjadi error
    }
  }
}

// Export instance tunggal (Singleton Pattern)
export default new UserService();