// app/admin/servis/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { getSemuaServisAdmin, DataServis } from '@/services/servis-service';

const warnaBadge: Record<string, string> = {
  aman:    'bg-green-100 text-green-800',
  segera:  'bg-yellow-100 text-yellow-800',
  kritis:  'bg-red-100 text-red-800',
  selesai: 'bg-gray-100 text-gray-600',
};

export default function HalamanAdminServis() {
  const [data, setData] = useState<DataServis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    getSemuaServisAdmin(token).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8 text-gray-500">Memuat data...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Monitoring Servis Kendaraan</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Pengguna</th>
              <th className="px-4 py-3 text-left">Kendaraan</th>
              <th className="px-4 py-3 text-right">Est. KM Sekarang</th>
              <th className="px-4 py-3 text-right">Target KM Oli</th>
              <th className="px-4 py-3 text-right">Sisa Hari</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.user.name}</p>
                  <p className="text-gray-400 text-xs">{row.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{row.kendaraan.nama_kendaraan}</p>
                  <p className="text-gray-400 text-xs">{row.kendaraan.nomor_plat}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {row.estimasi_km_sekarang.toLocaleString()} km
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {row.km_target_oli.toLocaleString()} km
                </td>
                <td className="px-4 py-3 text-right">
                  {row.sisa_hari} hari
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${warnaBadge[row.status_kondisi]}`}>
                    {row.status_kondisi.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}