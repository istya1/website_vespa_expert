// src/services/user-service.ts
import ApiService from './api-service';
import { User } from '@/types';

class UserService {
  // GET all users by role
  async get(role?: string): Promise<User[]> {
    // ApiService.get langsung return User[], jadi gak pakai .data
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

  // UPDATE user
  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await ApiService.put<User>(`/users/${id}`, data);
    return user;
  }

  // DELETE user
  async delete(id: number): Promise<void> {
    await ApiService.delete(`/users/${id}`);
  }
}

export default new UserService();
