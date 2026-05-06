'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import KategoriService, { Kategori } from '@/services/kategori-service';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const BOBOT_OPTIONS = [
  { value: 1, label: '1 - Ringan (Indikasi Awal)' },
  { value: 2, label: '2 - Sedang (Gangguan Performa)' },
  { value: 3, label: '3 - Berat (Risiko Tinggi)' },
];

const getBobotBadge = (bobot: number) => {
  if (bobot === 1) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">1 - Ringan</span>;
  if (bobot === 2) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">2 - Sedang</span>;
  if (bobot === 3) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">3 - Berat</span>;
  return <span className="text-gray-400">-</span>;
};

export default function KategoriPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingNama, setDeletingNama] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({ nama_kategori: '', bobot_default: 1 });

  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    try {
      setLoading(true);
      const data = await KategoriService.getAll();
      setKategoriList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat kategori');
      setKategoriList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (kategori?: Kategori) => {
    if (kategori) {
      setEditMode(true);
      setSelectedId(kategori.id);
      setFormData({ nama_kategori: kategori.nama_kategori, bobot_default: kategori.bobot_default ?? 1 });
    } else {
      setEditMode(false);
      setSelectedId(null);
     setFormData({ nama_kategori: '', bobot_default: 1 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editMode ? 'Mengupdate kategori...' : 'Menambahkan kategori...');
    try {
      if (editMode && selectedId) {
        await KategoriService.update(selectedId, formData);
        toast.success('Kategori berhasil diupdate', { id: loadingToast });
      } else {
        await KategoriService.create(formData);
        toast.success('Kategori berhasil ditambahkan', { id: loadingToast });
      }
      handleCloseModal();
      fetchKategori();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = (kategori: Kategori) => {
    setDeletingId(kategori.id);
    setDeletingNama(kategori.nama_kategori);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const loadingToast = toast.loading('Menghapus kategori...');
    try {
      await KategoriService.delete(deletingId);
      toast.success('Kategori berhasil dihapus', { id: loadingToast });
      fetchKategori();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kategori', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
      setDeletingNama('');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
    setDeletingNama('');
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentKategori = kategoriList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(kategoriList.length / ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Data Kategori">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Kategori</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Kategori
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bobot</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentKategori.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data kategori
                  </td>
                </tr>
              ) : (
                currentKategori.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{k.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{k.nama_kategori}</td>
                    <td className="px-6 py-4 text-sm">{getBobotBadge(k.bobot_default)}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(k)} className="text-primary-600 hover:text-primary-800">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(k)} className="text-red-600 hover:text-red-800">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                page === currentPage ? 'bg-primary-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Kategori</label>
                  <input
                    type="text"
                    value={selectedId ?? ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">ID tidak dapat diubah</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_kategori}
                  onChange={(e) => setFormData({ ...formData, nama_kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan nama kategori"
                  required
                />
              </div>

              {/* Bobot Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bobot <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {BOBOT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        formData.bobot_default === opt.value
                          ? opt.value === 1
                            ? 'border-green-500 bg-green-50'
                            : opt.value === 2
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bobot"
                        value={opt.value}
                        checked={formData.bobot_default === opt.value}
                       onChange={() => setFormData({ ...formData, bobot_default: opt.value })}
                        className="accent-primary-600"
                      />
                      <span className={`text-sm font-medium ${
                        formData.bobot_default === opt.value
                          ? opt.value === 1
                            ? 'text-green-700'
                            : opt.value === 2
                            ? 'text-yellow-700'
                            : 'text-red-700'
                          : 'text-gray-700'
                      }`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editMode ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kategori Ini?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-medium text-gray-900">{deletingNama}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}