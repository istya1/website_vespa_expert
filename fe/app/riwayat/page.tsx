// src/app/riwayat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import DiagnosaService from '@/services/diagnosa-service';
import { Diagnosa } from '@/types';
import toast from 'react-hot-toast';

export default function RiwayatPage() {
  const [diagnosaList, setDiagnosaList] = useState<Diagnosa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<Diagnosa | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchDiagnosa();
  }, []);

  const fetchDiagnosa = async () => {
    try {
      setLoading(true);
      const data = await DiagnosaService.getAll();
      setDiagnosaList(data);
    } catch (error) {
      console.error('Error fetching diagnosa:', error);
      toast.error('Gagal memuat data riwayat');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = (diagnosa: Diagnosa) => {
    setSelectedDiagnosa(diagnosa);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedDiagnosa(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus riwayat diagnosa ini?')) {
      const loadingToast = toast.loading('Menghapus riwayat...');
      
      try {
        await DiagnosaService.delete(id);
        toast.success('Riwayat diagnosa berhasil dihapus', { id: loadingToast });
        fetchDiagnosa();
      } catch (error: any) {
        toast.error(error.message || 'Gagal menghapus riwayat', { id: loadingToast });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout title="Riwayat Diagnosa">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Riwayat Diagnosa</h2>
        <p className="text-gray-600 mt-1">History semua diagnosa yang telah dilakukan</p>
      </div>

      {/* Table */}
      {loading ? (
         <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img
            src="/asset/load.png"
            alt="Loading"
            className="w-44 h-28 animate-pulse"
          />
          <p className="text-sm text-gray-500">
            Memuat data...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kerusakan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diagnosaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data riwayat diagnosa
                  </td>
                </tr>
              ) : (
                diagnosaList.map((diagnosa) => (
                  <tr key={diagnosa.id_diagnosa} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{diagnosa.id_diagnosa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {diagnosa.user?.nama || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {diagnosa.kerusakan?.nama_kerusakan || diagnosa.kode_kerusakan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {diagnosa.persentase}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(diagnosa.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShowDetail(diagnosa)}
                          className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(diagnosa.id_diagnosa)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDiagnosa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Detail Diagnosa</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Informasi User</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-medium">{selectedDiagnosa.user?.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedDiagnosa.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis Result */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Hasil Diagnosa</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Kerusakan</p>
                    <p className="font-medium text-lg">{selectedDiagnosa.kerusakan?.nama_kerusakan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tingkat Keyakinan</p>
                    <p className="font-medium text-2xl text-green-600">{selectedDiagnosa.persentase}%</p>
                  </div>
                  {selectedDiagnosa.kerusakan?.solusi && (
                    <div>
                      <p className="text-sm text-gray-600">Solusi</p>
                      <p className="font-medium">{selectedDiagnosa.kerusakan.solusi}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Symptoms */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Gejala yang Dipilih</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedDiagnosa.gejala_terpilih}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm text-gray-600">Tanggal Diagnosa</p>
                <p className="font-medium">{formatDate(selectedDiagnosa.tanggal)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}