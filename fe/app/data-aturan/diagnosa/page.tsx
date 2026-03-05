'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import DiagnosaService from '@/services/diagnosa-service';
import KerusakanService from '@/services/kerusakan-service';
import { Diagnosa, Kerusakan } from '@/types';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Extend tipe dengan semua relasi opsional
interface ExtendedDiagnosa extends Diagnosa {
  user?: {
    id_user: number;
    nama: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
  gejala?: Array<{
    kode_gejala: string;
    nama_gejala: string;
    kategori: string;
    deskripsi?: string;
  }> | null;
  hasilDiagnosis?: Array<{
    kode_kerusakan: string;
    persentase_kecocokan: number;
    kerusakan?: {
      nama_kerusakan: string;
      solusi: string;
    };
  }> | null;
}

export default function DiagnosaPage() {
  const [diagnosaList, setDiagnosaList] = useState<ExtendedDiagnosa[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diagnosaRes, kerusakanRes] = await Promise.all([
        DiagnosaService.getAllAdmin(),
        KerusakanService.getAll(),
      ]);

      console.log('FULL RESPONSE ADMIN DIAGNOSA:', diagnosaRes);
      console.log('Jumlah data diagnosa:', diagnosaRes?.data?.length || diagnosaRes?.length || 0);

      const diagnosaListRaw = diagnosaRes?.data || diagnosaRes || [];
      const filteredList = Array.isArray(diagnosaListRaw)
        ? diagnosaListRaw.filter(d => d && (d.kode_kerusakan || d.hasilDiagnosis?.length > 0))
        : [];

      console.log('Data yang diset ke state:', filteredList.length, 'item');

      setDiagnosaList(filteredList);
      setKerusakanList(Array.isArray(kerusakanRes) ? kerusakanRes : []);
    } catch (error) {
      console.error('Error fetch data diagnosa:', error);
      toast.error('Gagal memuat data diagnosa');
      setDiagnosaList([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const t = toast.loading('Menghapus diagnosa...');
    try {
      await DiagnosaService.deleteAdmin(deleteId);
      toast.success('Diagnosa dihapus', { id: t });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus', { id: t });
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Data Diagnosa">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Riwayat Diagnosa</h2>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Gejala Dipilih</th>
                <th className="px-4 py-3 text-left">Hasil Kerusakan</th>
                <th className="px-4 py-3 text-center">Persentase</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!diagnosaList || diagnosaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Belum ada diagnosa
                  </td>
                </tr>
              ) : (
                diagnosaList.map((d) => (
                  <tr key={d.id_diagnosa} className="border-t">
                    <td className="px-4 py-3">
                      {d.user?.nama || d.user?.email || 'User tidak diketahui'}
                    </td>
                    <td className="px-4 py-3">
                      {formatTanggal(d.tanggal || d.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {d.gejala?.length
                        ? d.gejala.map((g) => g.nama_gejala).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {d.hasilDiagnosis?.length ? (
                        d.hasilDiagnosis.map((h) => (
                          <div key={h.kode_kerusakan}>
                            {h.kerusakan?.nama_kerusakan || 'Kerusakan tidak ditemukan'}
                            ({Number(h.persentase_kecocokan || 0).toFixed(2)}%)
                          </div>
                        ))
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {Number(d.persentase || 0).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 flex justify-center">
                      <button
                        onClick={() => {
                          setDeleteId(d.id_diagnosa);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <p className="mb-5">Yakin ingin menghapus diagnosa ini?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
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