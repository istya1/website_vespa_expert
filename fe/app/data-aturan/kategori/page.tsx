'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import KategoriService, { Kategori } from '@/services/kategori-service';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormData {
  nama_kategori: string;
}

interface FormErrors {
  nama_kategori?: string;
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.nama_kategori.trim()) {
    errors.nama_kategori = 'Nama kategori tidak boleh kosong';
  } else if (data.nama_kategori.trim().length < 3) {
    errors.nama_kategori = 'Nama kategori minimal 3 karakter';
  }

  return errors;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState<FormData>({
    nama_kategori: '',
  });

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
    setFormErrors({});
    if (kategori) {
      setEditMode(true);
      setSelectedId(kategori.id);
      setFormData({
        nama_kategori: kategori.nama_kategori,
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({ nama_kategori: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedId(null);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

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

  const filteredKategori = kategoriList.filter((k) =>
    searchQuery.trim() === '' ||
    k.nama_kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(k.id).includes(searchQuery)
  );

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentKategori = filteredKategori.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKategori.length / ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Data Kategori">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daftar Kategori Kerusakan</h2>
          <p className="text-gray-600 mt-1">Data kategori kerusakan untuk menginputkan informasi kategori berdasarkan jenis kerusakan</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari ID atau nama kategori..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-60"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Tambah Kategori
          </button>
        </div>
      </div>

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
          <table className="min-w-full border border-gray-300 border-collapse">
            <thead className="bg-gray-50 ">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-b border-gray-300">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-b border-gray-300">Nama Kategori</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r border-b border-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 border-r border-gray-300">
              {currentKategori.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 border-r border-b border-gray-300 ">
                    {searchQuery
                      ? `Tidak ada kategori yang cocok dengan "${searchQuery}"`
                      : 'Tidak ada data kategori'}
                  </td>
                </tr>
              ) : (
                currentKategori.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-300">{k.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-300">{k.nama_kategori}</td>
                    <td className="px-6 py-4 text-sm text-center border-r border-gray-300">
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Sebelum
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${page === currentPage ? 'bg-primary-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
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
            Selanjutnya
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
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

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
                  onChange={(e) => {
                    setFormData({ ...formData, nama_kategori: e.target.value });
                    setFormErrors((prev) => ({ ...prev, nama_kategori: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.nama_kategori ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="Masukkan nama kategori"
                />
                {formErrors.nama_kategori && (
                  <p className="text-xs text-red-600 mt-1">⚠ {formErrors.nama_kategori}</p>
                )}
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
