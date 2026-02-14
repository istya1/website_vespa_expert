// src/types/index.ts

export interface User {
  id_user: number;
  email: string;
  nama: string;
  password?: string;
  role: 'admin' | 'pengguna';
  foto?: string | null;
  no_hp?: string | null;
  alamat?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Gejala {
  kode_gejala: string;
  nama_gejala: string;
  jenis_motor: string;
  kategori: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GejalaFormData {
  kode_gejala: string;
  nama_gejala: string;
  jenis_motor: string;
  kategori: string;
  deskripsi?: string;
}

export interface Kerusakan {
  kode_kerusakan: string;
  nama_kerusakan: string;
  keterangan: string;
  solusi: string;
  jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
  gejala?: Gejala[];
}

export interface Solusi {
  kode_solusi: string;
  nama_solusi: string;
  jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
}

export interface Aturan {
 id_aturan: number;
  kode_kerusakan: string;     
  gejala: Gejala[];       
}

export interface DiagnosaGejala {
  id: number;
  kode_gejala: string;
}

export interface Diagnosa {
  id_diagnosa: number;
  id_user: number;
  kode_kerusakan: string;
  persentase: number;
  tanggal: string;
  user?: User;
  kerusakan?: Kerusakan;
  gejala: DiagnosaGejala[];
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}


export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  status?: number;
}

export interface MenuItem {
  name: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

export interface StatCardData {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export type JenisMotor = 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
export type KategoriPedia = 'Pengenalan' | 'Keunggulan' | 'Spesifikasi' | 'Tips';
export type StatusPedia = 'draft' | 'published';

export interface VespaPedia {
  id: number;
  judul: string;
  jenis_motor: JenisMotor;
  kategori: KategoriPedia;
  gambar: string | null;
  gambar_url?: string;
  konten: string;
  urutan: number;
  status: StatusPedia;
  created_at?: string;
  updated_at?: string;
}


export interface ServiceTemplate {
  id: number;
  jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
  jenis_service: 'Ganti Oli' | 'Service Berkala' | 'Ganti CVT';
  interval_km: number;
  interval_hari: number;
  deskripsi?: string | null;
  biaya_estimasi?: string | null;
}

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