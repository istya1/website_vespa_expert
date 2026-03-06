'use client';
import { useEffect, useState, useMemo } from 'react';
import { Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import DiagnosaService from '@/services/diagnosa-service';
import KerusakanService from '@/services/kerusakan-service';
import { Diagnosa, Kerusakan } from '@/types';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Extend tipe (sudah pakai hasil_diagnosis sesuai fix sebelumnya)
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
  hasil_diagnosis?: Array<{
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

  // Untuk search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // bisa diubah sesuai kebutuhan

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

      const diagnosaListRaw = diagnosaRes?.data || diagnosaRes || [];
      const filteredList = Array.isArray(diagnosaListRaw)
        ? diagnosaListRaw.filter(d => d && (d.kode_kerusakan || d.hasil_diagnosis?.length))
        : [];

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

  // Filter berdasarkan search
  const filteredDiagnosa = useMemo(() => {
    if (!searchTerm.trim()) return diagnosaList;

    const term = searchTerm.toLowerCase();
    return diagnosaList.filter((d) => {
      const userName = (d.user?.nama || d.user?.email || '').toLowerCase();
      const kerusakanNames = (d.hasil_diagnosis || [])
        .map(h => h.kerusakan?.nama_kerusakan || h.kode_kerusakan || '')
        .join(' ')
        .toLowerCase();

      return userName.includes(term) || kerusakanNames.includes(term);
    });
  }, [diagnosaList, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDiagnosa.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDiagnosa = filteredDiagnosa.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <DashboardLayout title="Data Diagnosa">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Riwayat Diagnosa</h2>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset ke halaman 1 saat search
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <img
            src="/load.png"           
            alt="Loading..."
            className="w-24 h-24"
          />
        </div>
      ) : (
        <>
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
                {paginatedDiagnosa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      {searchTerm ? 'Tidak ditemukan hasil pencarian' : 'Belum ada diagnosa'}
                    </td>
                  </tr>
                ) : (
                  paginatedDiagnosa.map((d) => (
                    <tr key={d.id_diagnosa} className="border-t hover:bg-gray-50">
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
                        {d.hasil_diagnosis?.length ? (
                          d.hasil_diagnosis.map((h) => (
                            <div key={h.kode_kerusakan}>
                              {h.kerusakan?.nama_kerusakan || 'Kerusakan tidak ditemukan'}
                              {' '}
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

          {/* Pagination Controls */}
        {filteredDiagnosa.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded text-sm font-medium min-w-[40px] ${
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
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