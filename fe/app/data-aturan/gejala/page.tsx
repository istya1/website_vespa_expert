// src/app/data-aturan/gejala/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import GejalaService from '@/services/gejala-service';
import { Gejala } from '@/types';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function GejalaPage() {
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGejala, setSelectedGejala] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'>('Primavera 150');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState<{
    nama_gejala: string;
    jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
    kategori: string;
    bobot: number;

  }>({
    nama_gejala: '',
    jenis_motor: 'Primavera 150',
    kategori: '',
    bobot: 2,
    // deskripsi: '',
  });

  useEffect(() => {
    fetchGejala();
  }, []);

  const fetchGejala = async () => {
    try {
      setLoading(true);
      const data = await GejalaService.getAll();
      setGejalaList(data);
    } catch (error) {
      console.error('Error fetching gejala:', error);
      toast.error('Gagal memuat data gejala');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (gejala?: Gejala) => {
    if (gejala) {
      setEditMode(true);
      setSelectedGejala(gejala.kode_gejala);
      setFormData({
        nama_gejala: gejala.nama_gejala,
        jenis_motor: gejala.jenis_motor as typeof formData.jenis_motor,
        kategori: gejala.kategori,
        bobot: gejala.bobot,
        // deskripsi: gejala.deskripsi || '',
      });
    } else {
      setEditMode(false);
      setFormData({
        nama_gejala: '',
        jenis_motor: activeTab, // akan otomatis sesuai tab aktif
        kategori: '',
        bobot: 2,
        // deskripsi: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGejala('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editMode ? 'Mengupdate gejala...' : 'Menambahkan gejala...');

    try {
      if (editMode) {
        // Saat edit, kita kirim semua field kecuali kode_gejala (tidak diubah)
        await GejalaService.update(selectedGejala, formData);
        toast.success('Gejala berhasil diupdate', { id: loadingToast });
      } else {
        // Saat create, backend yang generate kode_gejala
        await GejalaService.create(formData);
        toast.success('Gejala berhasil ditambahkan', { id: loadingToast });
      }
      handleCloseModal();
      fetchGejala();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  // Di dalam component, tambahkan state:
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKode, setDeletingKode] = useState<string>('');

  // Ubah fungsi handleDelete jadi seperti ini:
  const handleDelete = (kode: string) => {
    setDeletingKode(kode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingKode) return;

    const loadingToast = toast.loading('Menghapus gejala...');
    try {
      await GejalaService.delete(deletingKode);
      toast.success('Gejala berhasil dihapus', { id: loadingToast });
      fetchGejala();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus gejala', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingKode('');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingKode('');
  };

  // Filter data berdasarkan tab aktif
  const filteredGejala = gejalaList.filter(g => g.jenis_motor === activeTab);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentGejala = filteredGejala.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGejala.length / ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Data Gejala">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Gejala</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Gejala
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {JENIS_MOTOR.map((jenis) => (
            <button
              key={jenis}
              onClick={() => setActiveTab(jenis)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === jenis
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {jenis}
            </button>
          ))}
        </nav>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Gejala
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Bobot
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentGejala.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data gejala untuk {activeTab}
                  </td>
                </tr>
              ) : (
                currentGejala.map((gejala) => (
                  <tr key={gejala.kode_gejala} className="hover:bg-gray-50">
                    {/* KODE */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {gejala.kode_gejala}
                    </td>

                    {/* NAMA */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {gejala.nama_gejala}
                    </td>

                    {/* KATEGORI */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {gejala.kategori}
                    </td>

                    {/* BOBOT */}
                    <td className="px-6 py-4 text-sm text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
              ${gejala.bobot === 3 ? 'bg-red-100 text-red-700' : ''}
              ${gejala.bobot === 2 ? 'bg-yellow-100 text-yellow-700' : ''}
              ${gejala.bobot === 1 ? 'bg-green-100 text-green-700' : ''}
            `}
                      >
                        {gejala.bobot === 3 && 'Berat'}
                        {gejala.bobot === 2 && 'Sedang'}
                        {gejala.bobot === 1 && 'Ringan'}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(gejala)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(gejala.kode_gejala)}
                          className="text-red-600 hover:text-red-800"
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
              className={`px-3 py-1 rounded ${page === currentPage
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Gejala' : 'Tambah Gejala Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* HAPUS INPUT KODE GEJALA KETIKA TAMBAH BARU */}
              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Gejala
                  </label>
                  <input
                    type="text"
                    value={selectedGejala}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kode otomatis saat dibuat, tidak dapat diubah</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Gejala <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_gejala}
                  onChange={(e) => setFormData({ ...formData, nama_gejala: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan nama gejala"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Motor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jenis_motor}
                  onChange={(e) => setFormData({
                    ...formData,
                    jenis_motor: e.target.value as 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={editMode} // Opsional: tidak boleh ganti jenis motor saat edit
                >
                  {JENIS_MOTOR.map((jenis) => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
                {editMode && (
                  <p className="text-xs text-gray-500 mt-1">Jenis motor tidak dapat diubah setelah dibuat</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bobot Gejala <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bobot}
                  onChange={(e) =>
                    setFormData({ ...formData, bobot: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value={3}>Berat (Risiko tinggi)</option>
                  <option value={2}>Sedang (Gangguan performa)</option>
                  <option value={1}>Ringan (Indikasi awal)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Contoh: Mesin, Kelistrikan, Rem"
                  required
                />
              </div>



              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                  placeholder="Deskripsi gejala (opsional)"
                />
              </div> */}

              <div className="flex gap-3">
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              {/* Icon Warning Besar */}
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
                {/* Kalau pakai lucide: <AlertTriangle className="h-12 w-12 text-red-600" /> */}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hapus Gejala Ini?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus gejala <span className="font-medium text-gray-900">{deletingKode}</span>?
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
