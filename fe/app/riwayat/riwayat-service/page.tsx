// src/app/riwayat/ganti-oli/page.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Droplets, Users, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DataServis {
  id: number;
  user: { id_user: number; nama: string; email: string };
  kendaraan: { nama_kendaraan: string; nomor_plat: string };
  km_sekarang: number;
  km_target_oli: number;
  rata_rata_km_per_hari: number;
  interval_ganti_oli: number;
  waktu_input: string;
  estimasi_tanggal_deadline: string;
  tanggal_mulai_notif: string;
  sudah_ganti_oli: boolean;
  tanggal_ganti_oli: string | null;
}

const STATUS_COLORS = {
  aman:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   hex: '#3b82f6', label: 'Aman'         },
  segera:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  hex: '#f59e0b', label: 'Segera Ganti' },
  kritis:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',    hex: '#ef4444', label: 'Kritis'       },
  selesai: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  hex: '#10b981', label: 'Selesai'      },
};

function hitungStatus(item: DataServis): keyof typeof STATUS_COLORS {
  if (item.sudah_ganti_oli) return 'selesai';
  const sisaHari = Math.max(0, Math.ceil(
    (new Date(item.estimasi_tanggal_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  if (sisaHari <= 1)  return 'kritis';
  if (sisaHari <= 7)  return 'segera';
  return 'aman';
}

function hitungSisaHari(deadline: string): number {
  return Math.max(0, Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
}

function hitungEstimasiKm(item: DataServis): number {
  const hariBerlalu = Math.floor(
    (Date.now() - new Date(item.waktu_input).getTime()) / (1000 * 60 * 60 * 24)
  );
  return item.km_sekarang + (item.rata_rata_km_per_hari * hariBerlalu);
}

const BULAN_LABEL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function RiwayatGantiOliPage() {
  const [data, setData]           = useState<DataServis[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 10;

const fetchData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/servis?per_page=100`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    const json = await res.json();
    
    console.log('FULL JSON:', json);
    console.log('DATA:', json.data);
    console.log('DATA.DATA:', json.data?.data);
    console.log('ITEM PERTAMA:', json.data?.data?.[0]);
    
    setData(json.data?.data ?? json.data ?? []);
  } catch (err) {
    console.error('Error:', err);
    toast.error('Gagal memuat data ganti oli');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchData(); }, []);

  // ── Summary cards ──────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total    = data.length;
    const selesai  = data.filter(d => d.sudah_ganti_oli).length;
    const kritis   = data.filter(d => hitungStatus(d) === 'kritis').length;
    const segera   = data.filter(d => hitungStatus(d) === 'segera').length;
    return { total, selesai, kritis, segera };
  }, [data]);

  // ── Grafik: distribusi status (pie) ────────────────────────────────────
  const chartStatus = useMemo(() => {
    const map: Record<string, number> = { aman: 0, segera: 0, kritis: 0, selesai: 0 };
    data.forEach(d => { map[hitungStatus(d)]++; });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name:  STATUS_COLORS[key as keyof typeof STATUS_COLORS].label,
        value,
        color: STATUS_COLORS[key as keyof typeof STATUS_COLORS].hex,
      }));
  }, [data]);

  // ── Grafik: ganti oli per bulan ─────────────────────────────────────────
  const chartBulanan = useMemo(() => {
    const map: Record<number, number> = {};
    for (let i = 0; i < 12; i++) map[i] = 0;
    data.filter(d => d.sudah_ganti_oli && d.tanggal_ganti_oli).forEach(d => {
      const bulan = new Date(d.tanggal_ganti_oli!).getMonth();
      if (new Date(d.tanggal_ganti_oli!).getFullYear() === new Date().getFullYear()) {
        map[bulan]++;
      }
    });
    return BULAN_LABEL.map((label, i) => ({ bulan: label, jumlah: map[i] }));
  }, [data]);

  // ── Filter tabel ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return data.filter(d => {
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        d.user.nama.toLowerCase().includes(term) ||
        d.user.email.toLowerCase().includes(term) ||
        d.kendaraan.nama_kendaraan.toLowerCase().includes(term) ||
        d.kendaraan.nomor_plat.toLowerCase().includes(term);

      const status = hitungStatus(d);
      const matchStatus = filterStatus === 'Semua' || status === filterStatus.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const totalPages     = Math.ceil(filtered.length / itemsPerPage);
  const paginated      = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTanggal = (d?: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <DashboardLayout title="Riwayat Ganti Oli">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Riwayat Ganti Oli</h2>
        <p className="text-sm text-gray-500 mt-1">
          Monitoring status ganti oli semua pengguna
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Total Pengguna',
                value: summary.total,
                icon: <Users size={20} className="text-blue-600" />,
                bg: 'bg-blue-50', border: 'border-blue-100',
              },
              {
                label: 'Sudah Ganti Oli',
                value: summary.selesai,
                icon: <CheckCircle size={20} className="text-green-600" />,
                bg: 'bg-green-50', border: 'border-green-100',
              },
              {
                label: 'Segera Ganti',
                value: summary.segera,
                sub: 'Sisa ≤ 7 hari',
                icon: <Clock size={20} className="text-amber-600" />,
                bg: 'bg-amber-50', border: 'border-amber-100',
              },
              {
                label: 'Status Kritis',
                value: summary.kritis,
                sub: 'Sisa ≤ 1 hari',
                icon: <Droplets size={20} className="text-red-600" />,
                bg: 'bg-red-50', border: 'border-red-100',
              },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} border ${card.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>{card.icon}</div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{card.value}</p>
                {card.sub && <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Grafik */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">

            {/* Pie: distribusi status */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Distribusi Status Oli</h3>
              <p className="text-xs text-gray-400 mb-4">Proporsi status semua pengguna</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartStatus}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    labelLine={false}
                  >
                    {chartStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar: ganti oli per bulan */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Ganti Oli Per Bulan</h3>
              <p className="text-xs text-gray-400 mb-4">Jumlah konfirmasi ganti oli tahun {new Date().getFullYear()}</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartBulanan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ganti Oli" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  Detail Per Pengguna
                  <span className="ml-2 text-xs font-normal text-gray-400">({filtered.length} data)</span>
                </h3>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none sm:w-52">
                    <input
                      type="text"
                      placeholder="Cari nama / kendaraan..."
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  </div>
                  {/* Filter status */}
                  <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {['Semua', 'Aman', 'Segera', 'Kritis', 'Selesai'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Pengguna</th>
                    <th className="px-4 py-3 text-left">Kendaraan</th>
                    <th className="px-4 py-3 text-right">Est. KM</th>
                    <th className="px-4 py-3 text-right">Target KM</th>
                    <th className="px-4 py-3 text-right">Sisa Hari</th>
                    <th className="px-4 py-3 text-left">Deadline</th>
                    <th className="px-4 py-3 text-left">Tgl Ganti Oli</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Droplets size={32} className="text-gray-300" />
                          <span>Tidak ada data</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map(d => {
                      const status    = hitungStatus(d);
                      const warna     = STATUS_COLORS[status];
                      const sisaHari  = hitungSisaHari(d.estimasi_tanggal_deadline);
                      const estKm     = hitungEstimasiKm(d);

                      return (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{d.user.nama}</p>
                            <p className="text-xs text-gray-400">{d.user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700">{d.kendaraan.nama_kendaraan}</p>
                            <p className="text-xs text-gray-400">{d.kendaraan.nomor_plat}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            {estKm.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            {d.km_target_oli.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${
                              sisaHari <= 1 ? 'text-red-600' :
                              sisaHari <= 7 ? 'text-amber-600' : 'text-gray-700'
                            }`}>
                              {d.sudah_ganti_oli ? '-' : `${sisaHari} hari`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatTanggal(d.estimasi_tanggal_deadline)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {d.tanggal_ganti_oli ? formatTanggal(d.tanggal_ganti_oli) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${warna.bg} ${warna.text}`}>
                              {warna.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page = totalPages <= 7 ? i + 1
                      : currentPage <= 4 ? i + 1
                      : currentPage >= totalPages - 3 ? totalPages - 6 + i
                      : currentPage - 3 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}