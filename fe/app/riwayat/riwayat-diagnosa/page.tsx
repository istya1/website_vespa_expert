'use client';
import { useEffect, useState, useMemo } from 'react';
import { Trash2, Search, ChevronLeft, ChevronRight, TrendingUp, Wrench, Users, Activity, ChevronDown, FileDown } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import DiagnosaService from '@/services/diagnosa-service';
import KerusakanService from '@/services/kerusakan-service';
import { Diagnosa, Kerusakan } from '@/types';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

interface ExtendedDiagnosa extends Omit<Diagnosa, 'jenis_motor'> {
  user?: { id_user: number; nama: string; email: string } | null;
  jenis_motor?: string;
  created_at: string;
  updated_at: string;
  gejala?: Array<{
    kode_gejala: string;
    nama_gejala: string;
    kategori: string;
    deskripsi?: string;
  }> | null;
  hasil_diagnosis?: Array<{
    kode_kerusakan: string;
    persentase_kecocokan: number;
    kerusakan?: { nama_kerusakan: string; solusi: string };
  }> | null;
}

const MOTOR_COLORS: Record<string, string> = {
  'Sprint 150': '#3b82f6',
  'Sprint S 150': '#6366f1',
  'LX 125': '#10b981',
  'Primavera 150': '#f59e0b',
  'Primavera S 150': '#ef4444',
};

const BULAN_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const MOTOR_LIST = ['Semua', 'Sprint 150', 'Sprint S 150', 'LX 125', 'Primavera 150', 'Primavera S 150'];

export default function DiagnosaPage() {
  const [diagnosaList, setDiagnosaList] = useState<ExtendedDiagnosa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statistik, setStatistik] = useState<any>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMotor, setFilterMotor] = useState('Semua');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

const fetchStatistik = async () => {
  try {
    const res = await fetch('https://api.expertvespa.cloud/api/diagnosa/statistik');
    const data = await res.json();
    setStatistik(data);
  } catch (error) {
    console.error('Error fetch statistik:', error);
  }
};

  useEffect(() => { fetchData(); fetchStatistik(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diagnosaRes] = await Promise.all([
        DiagnosaService.getAllAdmin(),
        KerusakanService.getAll(),
      ]);
      const raw = diagnosaRes?.data || diagnosaRes || [];
      const filtered = Array.isArray(raw)
        ? raw.filter((d: any) => d && (d.kode_kerusakan || d.hasil_diagnosis?.length))
        : [];
      setDiagnosaList(filtered);
    } catch {
      toast.error('Gagal memuat data diagnosa');
      setDiagnosaList([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const t = toast.loading('Menghapus diagnosa...');
    try {
      await DiagnosaService.deleteAdmin(deleteId);
      toast.success('Diagnosa dihapus', { id: t });
      fetchData();
    } catch {
      toast.error('Gagal menghapus', { id: t });
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const formatTanggal = (d?: string | null) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const exportPDF = () => {
    const judul = filterMotor !== 'Semua'
      ? `Laporan Evaluasi Bengkel — ${filterMotor}`
      : 'Laporan Evaluasi Bengkel — Semua Motor';
    const periode = filterBulan
      ? `${BULAN_LABEL[parseInt(filterBulan) - 1]} ${filterTahun}`
      : `Tahun ${filterTahun}`;

    const rows = filteredDiagnosa.map((d, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${d.user?.nama || d.user?.email || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${d.jenis_motor || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatTanggal(d.tanggal || d.created_at)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px">${d.gejala?.map(g => g.nama_gejala).join(', ') || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px">
          ${d.hasil_diagnosis?.map(h =>
      `${h.kerusakan?.nama_kerusakan || h.kode_kerusakan} (${Number(h.persentase_kecocokan || 0).toFixed(0)}%)`
    ).join('<br/>') || '-'}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${judul}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; padding: 32px; }
          .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 20px; font-weight: 700; color: #1e3a5f; }
          .header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
          .summary-card { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 20px; flex: 1; min-width: 140px; }
          .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .summary-card .val { font-size: 18px; font-weight: 700; color: #1e40af; margin-top: 4px; }
          .summary-card .sub { font-size: 11px; color: #9ca3af; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead tr { background: #1e3a5f; color: white; }
          thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
          .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${judul}</h1>
          <p>Periode: ${periode} &nbsp;|&nbsp; Total data: ${filteredDiagnosa.length} diagnosa &nbsp;|&nbsp; Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="label">Total Diagnosa</div>
            <div class="val">${summaryStats.total}</div>
          </div>
          <div class="summary-card">
            <div class="label">Motor Terbanyak</div>
            <div class="val" style="font-size:14px">${summaryStats.motorTerbanyak?.[0] || '-'}</div>
            <div class="sub">${summaryStats.motorTerbanyak ? summaryStats.motorTerbanyak[1] + 'x diagnosa' : ''}</div>
          </div>
          <div class="summary-card">
            <div class="label">Kerusakan Terbanyak</div>
            <div class="val" style="font-size:13px">${summaryStats.kerusakanTerbanyak?.[0] || '-'}</div>
            <div class="sub">${summaryStats.kerusakanTerbanyak ? summaryStats.kerusakanTerbanyak[1] + 'x terdeteksi' : ''}</div>
          </div>
          <div class="summary-card">
            <div class="label">Pengguna</div>
            <div class="val">${summaryStats.userUnik}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:36px">No</th>
              <th>User</th>
              <th>Jenis Motor</th>
              <th>Tanggal</th>
              <th>Gejala</th>
              <th>Hasil Kerusakan</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          Laporan ini dibuat otomatis oleh Sistem Vespa Expert &nbsp;|&nbsp; ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) { toast.error('Popup diblokir browser, izinkan popup terlebih dahulu'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
    toast.success('Laporan PDF siap dicetak!');
  };

  // ── Summary cards ─────────────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    const total = diagnosaList.length;

    // Motor terbanyak
    const motorCount: Record<string, number> = {};
    diagnosaList.forEach(d => {
      const m = d.jenis_motor || 'Tidak diketahui';
      motorCount[m] = (motorCount[m] || 0) + 1;
    });
    const motorTerbanyak = Object.entries(motorCount).sort((a, b) => b[1] - a[1])[0];

    // Kerusakan terbanyak
    const kerusakanCount: Record<string, number> = {};
    diagnosaList.forEach(d => {
      d.hasil_diagnosis?.forEach(h => {
        const nama = h.kerusakan?.nama_kerusakan || h.kode_kerusakan;
        kerusakanCount[nama] = (kerusakanCount[nama] || 0) + 1;
      });
    });
    const kerusakanTerbanyak = Object.entries(kerusakanCount).sort((a, b) => b[1] - a[1])[0];

    // User unik
    const userUnik = new Set(diagnosaList.map(d => d.user?.id_user)).size;

    return { total, motorTerbanyak, kerusakanTerbanyak, userUnik };
  }, [diagnosaList]);

  // ── Grafik: kerusakan per motor (bar grouped) ────────────────────────────

  const chartKerusakanPerMotor = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    diagnosaList.forEach(d => {
      const motor = d.jenis_motor || 'Lainnya';
      d.hasil_diagnosis?.forEach(h => {
        const nama = h.kerusakan?.nama_kerusakan || h.kode_kerusakan;
        if (!map[nama]) map[nama] = {};
        map[nama][motor] = (map[nama][motor] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([kerusakan, motors]) => ({ kerusakan, ...motors }))
      .sort((a: any, b: any) => {
        const sumA = Object.values(a).filter(v => typeof v === 'number').reduce((s: any, v: any) => s + v, 0);
        const sumB = Object.values(b).filter(v => typeof v === 'number').reduce((s: any, v: any) => s + v, 0);
        return (sumB as number) - (sumA as number);
      })
      .slice(0, 8);
  }, [diagnosaList]);

  // ── Grafik: tren diagnosa per bulan ──────────────────────────────────────

  const chartTrenBulanan = useMemo(() => {
    const tahun = parseInt(filterTahun) || new Date().getFullYear();
    const map: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) map[i] = {};

    diagnosaList.forEach(d => {
      const date = new Date(d.created_at);
      if (date.getFullYear() !== tahun) return;
      const bulan = date.getMonth();
      const motor = d.jenis_motor || 'Lainnya';
      map[bulan][motor] = (map[bulan][motor] || 0) + 1;
    });

    return BULAN_LABEL.map((label, i) => ({ bulan: label, ...map[i] }));
  }, [diagnosaList, filterTahun]);

  // ── Grafik: kerusakan terbanyak per motor (filter motor) ─────────────────

  const chartKerusakanMotorFilter = useMemo(() => {
    const filtered = filterMotor === 'Semua'
      ? diagnosaList
      : diagnosaList.filter(d => d.jenis_motor === filterMotor);

    const map: Record<string, number> = {};
    filtered.forEach(d => {
      d.hasil_diagnosis?.forEach(h => {
        const nama = h.kerusakan?.nama_kerusakan || h.kode_kerusakan;
        map[nama] = (map[nama] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 8);
  }, [diagnosaList, filterMotor]);

  // ── Filter tabel ──────────────────────────────────────────────────────────

  const filteredDiagnosa = useMemo(() => {
    return diagnosaList.filter(d => {
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        (d.user?.nama || d.user?.email || '').toLowerCase().includes(term) ||
        (d.jenis_motor || '').toLowerCase().includes(term) ||
        (d.hasil_diagnosis || []).map(h => h.kerusakan?.nama_kerusakan || '').join(' ').toLowerCase().includes(term);

      const matchMotor = filterMotor === 'Semua' || d.jenis_motor === filterMotor;

      const matchBulan = !filterBulan || (() => {
        const date = new Date(d.created_at);
        return date.getMonth() === parseInt(filterBulan) - 1 &&
          date.getFullYear() === parseInt(filterTahun);
      })();

      return matchSearch && matchMotor && matchBulan;
    });
  }, [diagnosaList, searchTerm, filterMotor, filterBulan, filterTahun]);

  const totalPages = Math.ceil(filteredDiagnosa.length / itemsPerPage);
  const paginatedDiagnosa = filteredDiagnosa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tahunList = useMemo(() => {
    const years = new Set(diagnosaList.map(d => new Date(d.created_at).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [diagnosaList]);

  return (
    <DashboardLayout title="Riwayat Diagnosa">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Riwayat Diagnosa</h2>
            <p className="text-sm text-gray-500 mt-1">
              Melihat riwayat diagnosa, tren diagnosa per bulan, dan kerusakan tiap jenis motor
            </p>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* ── Summary cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Total Diagnosa',
                value: summaryStats.total,
                icon: <Activity size={20} className="text-blue-600" />,
                bg: 'bg-blue-50', border: 'border-blue-100',
              },
              {
                label: 'Motor Terbanyak',
                value: summaryStats.motorTerbanyak?.[0] || '-',
                sub: summaryStats.motorTerbanyak ? `${summaryStats.motorTerbanyak[1]}x diagnosa` : '',
                icon: <TrendingUp size={20} className="text-amber-600" />,
                bg: 'bg-amber-50', border: 'border-amber-100',
              },
              {
                label: 'Kerusakan Terbanyak',
                value: summaryStats.kerusakanTerbanyak?.[0] || '-',
                sub: summaryStats.kerusakanTerbanyak ? `${summaryStats.kerusakanTerbanyak[1]}x terdeteksi` : '',
                icon: <Wrench size={20} className="text-red-600" />,
                bg: 'bg-red-50', border: 'border-red-100',
              },
              {
                label: 'Pengguna',
                value: summaryStats.userUnik,
                icon: <Users size={20} className="text-emerald-600" />,
                bg: 'bg-emerald-50', border: 'border-emerald-100',
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

          {/* ── Grafik section ─────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">

            {/* Tren diagnosa per bulan per motor */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-gray-800">Tren Diagnosa Per Bulan</h3>
                  <p className="text-xs text-gray-400">Jumlah diagnosa per jenis motor tiap bulan</p>
                </div>
                <div className="flex items-center">
                  <select
                    value={filterTahun}
                    onChange={e => setFilterTahun(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {tahunList.length > 0
                      ? tahunList.map(y => <option key={y} value={y}>{y}</option>)
                      : <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    }
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartTrenBulanan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Object.keys(MOTOR_COLORS).map(motor => (
                    <Line
                      key={motor}
                      type="monotone"
                      dataKey={motor}
                      stroke={MOTOR_COLORS[motor]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Kerusakan terbanyak — filter per motor */}
            {/* <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Kerusakan Terbanyak</h3>
                  <p className="text-xs text-gray-400">
                    {filterMotor === 'Semua' ? 'Semua jenis motor' : filterMotor}
                  </p>
                </div>
                <select
                  value={filterMotor}
                  onChange={e => { setFilterMotor(e.target.value); setCurrentPage(1); }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {MOTOR_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartKerusakanMotorFilter} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="nama" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar
                    dataKey="jumlah"
                    fill={filterMotor !== 'Semua' ? (MOTOR_COLORS[filterMotor] || '#3b82f6') : '#3b82f6'}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div> */}

            {/* Kerusakan per motor (grouped bar) — full width */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm lg:col-span-2">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">Distribusi Kerusakan per Jenis Motor</h3>
                <p className="text-xs text-gray-400">Perbandingan kerusakan yang sama di berbagai jenis motor</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartKerusakanPerMotor} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="kerusakan" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Object.entries(MOTOR_COLORS).map(([motor, color]) => (
                    <Bar key={motor} dataKey={motor} fill={color} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Filter tabel ──────────────────────────────────────────── */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

                {/* Judul */}
                <h3 className="font-semibold text-gray-800 shrink-0">
                  Detail Riwayat Diagnosa
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({filteredDiagnosa.length} data)
                  </span>
                </h3>

                {/* Kontrol kanan */}
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">

                  {/* Export PDF */}
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shrink-0"
                  >
                    <FileDown size={16} />
                    Export PDF
                  </button>

                  {/* Search */}
                  <div className="relative w-full sm:w-52">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      type="text"
                      placeholder="Cari user / kerusakan..."
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  {/* Filter motor */}
                  <select
                    value={filterMotor}
                    onChange={e => { setFilterMotor(e.target.value); setCurrentPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {MOTOR_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  {/* Filter bulan */}
                  <select
                    value={filterBulan}
                    onChange={e => { setFilterBulan(e.target.value); setCurrentPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Semua Bulan</option>
                    {BULAN_LABEL.map((b, i) => (
                      <option key={i} value={String(i + 1)}>{b}</option>
                    ))}
                  </select>

                  {/* Filter tahun */}
                  <select
                    value={filterTahun}
                    onChange={e => { setFilterTahun(e.target.value); setCurrentPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {tahunList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                </div>
              </div>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Jenis Motor</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Gejala</th>
                    <th className="px-4 py-3 text-left">Hasil Kerusakan</th>
                    {/* <th className="px-4 py-3 text-center">Aksi</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedDiagnosa.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Activity size={32} className="text-gray-300" />
                          <span>{searchTerm || filterMotor !== 'Semua' || filterBulan ? 'Tidak ada data sesuai filter' : 'Belum ada diagnosa'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedDiagnosa.map(d => (
                      <tr key={d.id_diagnosa} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {d.user?.nama || d.user?.email || 'Tidak diketahui'}
                        </td>
                        <td className="px-4 py-3">
                          {d.jenis_motor ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: MOTOR_COLORS[d.jenis_motor] || '#6b7280' }}
                            >
                              {d.jenis_motor}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatTanggal(d.tanggal || d.created_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                          <span className="line-clamp-2">
                            {d.gejala?.length ? d.gejala.map(g => g.nama_gejala).join(', ') : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {d.hasil_diagnosis?.length ? (
                            <div className="space-y-1">
                              {d.hasil_diagnosis.map(h => (
                                <div key={h.kode_kerusakan} className="flex items-center gap-2">
                                  <span className="text-gray-700 text-xs">
                                    {h.kerusakan?.nama_kerusakan || h.kode_kerusakan}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-600 shrink-0">
                                    {Number(h.persentase_kecocokan || 0).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                      
                      </tr>
                    ))
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
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage
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
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">Hapus Diagnosa?</p>
            <p className="text-sm text-gray-500 mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
