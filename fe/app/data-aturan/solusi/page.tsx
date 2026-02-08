'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import SolusiService from '@/services/solusi-services';
import { Solusi } from '@/types';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';

export default function SolusiPage() {
  const [solusiList, setSolusiList] = useState<Solusi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedKode, setSelectedKode] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKode, setDeletingKode] = useState('');
  const [activeTab, setActiveTab] =
    useState<(typeof JENIS_MOTOR)[number]>('Primavera 150');

  const [formData, setFormData] = useState<{
    nama_solusi: string;
    jenis_motor: (typeof JENIS_MOTOR)[number];
  }>({
    nama_solusi: '',
    jenis_motor: 'Primavera 150',
  });

  useEffect(() => {
    fetchSolusi();
  }, []);

  const fetchSolusi = async () => {
    try {
      setLoading(true);
      const data = await SolusiService.getAll();
      setSolusiList(data);
    } catch {
      toast.error('Gagal memuat data solusi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (solusi?: Solusi) => {
    if (solusi) {
      setEditMode(true);
      setSelectedKode(solusi.kode_solusi);
      setFormData({
        nama_solusi: solusi.nama_solusi,
        jenis_motor: solusi.jenis_motor,
      });
    } else {
      setEditMode(false);
      setFormData({
        nama_solusi: '',
        jenis_motor: activeTab,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(
      editMode ? 'Mengupdate solusi...' : 'Menambahkan solusi...'
    );

    try {
      if (editMode) {
        await SolusiService.update(selectedKode, formData);
      } else {
        await SolusiService.create(formData);
      }
      toast.success('Berhasil Menambahkan Solusi', { id: loadingToast });
      setShowModal(false);
      fetchSolusi();
    } catch {
      toast.error('Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = (kode: string) => {
    setDeletingKode(kode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading('Menghapus solusi...');
    try {
      await SolusiService.delete(deletingKode);
      toast.success('Solusi dihapus', { id: loadingToast });
      fetchSolusi();
    } catch {
      toast.error('Gagal menghapus', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingKode('');
    }
  };

  const filteredSolusi = solusiList.filter(
    (s) => s.jenis_motor === activeTab
  );

  return (
    <DashboardLayout title="Data Solusi">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Daftar Solusi</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Tambah Solusi
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-6">
        {JENIS_MOTOR.map((jenis) => (
          <button
            key={jenis}
            onClick={() => setActiveTab(jenis)}
            className={`pb-2 ${activeTab === jenis
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500'
              }`}
          >
            {jenis}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Kode</th>
              <th className="p-4 text-left">Nama Solusi</th>
              <th className="p-4 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSolusi.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data solusi untuk {activeTab}
                </td>
              </tr>
            ) : (
              filteredSolusi.map((solusi) => (
                <tr
                  key={solusi.kode_solusi}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {solusi.kode_solusi}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">
                    {solusi.nama_solusi}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(solusi)}
                        className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(solusi.kode_solusi)}
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
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Solusi' : 'Tambah Solusi'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kode hanya tampil saat edit (read-only) */}
              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Solusi
                  </label>
                  <input
                    type="text"
                    value={selectedKode}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kode otomatis, tidak dapat diubah
                  </p>
                </div>
              )}

              {/* Nama Solusi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Solusi <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={formData.nama_solusi}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_solusi: e.target.value })
                  }
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                  placeholder="Masukkan Solusi"
                  required
                />

              </div>



              {/* Jenis Motor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Motor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jenis_motor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jenis_motor: e.target.value as
                        | 'Primavera 150'
                        | 'Primavera S 150'
                        | 'LX 125'
                        | 'Sprint 150'
                        | 'Sprint S 150',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={editMode}
                >
                  {JENIS_MOTOR.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
                {editMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Jenis motor tidak dapat diubah
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editMode ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-600" size={40} />
            <p>Hapus solusi {deletingKode}?</p>
            <div className="flex gap-3 mt-4">
              <button onClick={confirmDelete} className="bg-red-600 text-white px-4 py-2 rounded">
                Hapus
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="bg-gray-300 px-4 py-2 rounded">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
