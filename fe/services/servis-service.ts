// services/servis.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DataServis {
  id: number;
  user: { name: string; email: string };
  kendaraan: { nama_kendaraan: string; nomor_plat: string };
  estimasi_km_sekarang: number;
  km_target_oli: number;
  sisa_km: number;
  sisa_hari: number;
  status_kondisi: 'aman' | 'segera' | 'kritis' | 'selesai';
  estimasi_tanggal_deadline: string;
}

export async function getSemuaServisAdmin(token: string): Promise<DataServis[]> {
  const res = await fetch(`${BASE_URL}/api/admin/servis`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.data.data; // paginate
}