import ApiService from './api-service';
import { User } from '@/types';

class UserService {
  // GET all users by role
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

    // jika ada foto lokal
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
}

export default new UserService();
