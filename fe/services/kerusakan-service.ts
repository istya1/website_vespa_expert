// src/services/KerusakanService.ts
import ApiService from './api-service';
import { Kerusakan, ApiResponse } from '@/types';

class KerusakanService {

  // Ambil semua data kerusakan dari endpoint GET /kerusakan
  async getAll(): Promise<Kerusakan[]> {
    return await ApiService.get('/kerusakan');
  }

  // Ambil satu kerusakan berdasarkan kode (primary key string)
  async getById(kode: string): Promise<Kerusakan> {
    return await ApiService.get<Kerusakan>(`/kerusakan/${kode}`);
  }

  // Tambah kerusakan baru
  // Partial<Kerusakan> -> boleh kirim sebagian field saja (tidak harus semua properti Kerusakan)
  async create(data: Partial<Kerusakan>): Promise<ApiResponse<Kerusakan>> {
    return await ApiService.post<ApiResponse<Kerusakan>>('/kerusakan', data);
  }

  // Update kerusakan berdasarkan kode
  async update(kode: string, data: Partial<Kerusakan>): Promise<ApiResponse<Kerusakan>> {
    return await ApiService.put<ApiResponse<Kerusakan>>(`/kerusakan/${kode}`, data);
  }

  // Hapus kerusakan berdasarkan kode
  async delete(kode: string): Promise<ApiResponse> {
    return await ApiService.delete<ApiResponse>(`/kerusakan/${kode}`);
  }

  // Hitung jumlah total kerusakan
  // Catatan: ini tidak efisien karena ambil SEMUA data dulu (getAll),
  // baru hitung panjang array-nya di sisi client.
  // Idealnya backend punya endpoint /kerusakan/count tersendiri
  // yang langsung COUNT() di database, supaya tidak transfer data besar
  // hanya untuk dapat satu angka.
  async count(): Promise<number> {
    const kerusakan = await this.getAll();
    return Array.isArray(kerusakan) ? kerusakan.length : 0;
  }
}

export default new KerusakanService();