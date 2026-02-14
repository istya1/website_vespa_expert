'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Upload, X, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import VespaPediaService from '@/services/vespa-pedia-service';
import { VespaPedia } from '@/types/index';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';

const KATEGORI_OPTIONS = ['Pengenalan', 'Keunggulan', 'Spesifikasi', 'Tips'];
const STATUS_OPTIONS = ['draft', 'published'];

export default function VespaPediaPage() {
  const [pediaList, setPediaList] = useState<VespaPedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPedia, setSelectedPedia] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'>('Primavera 150');

  const [formData, setFormData] = useState<{
    judul: string;
    jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
    kategori: 'Pengenalan' | 'Keunggulan' | 'Spesifikasi' | 'Tips';
    gambar: File | null;
    konten: string;
    urutan: number;
    status: 'draft' | 'published';
  }>({
    judul: '',
    jenis_motor: 'Sprint 150',
    kategori: 'Pengenalan',
    gambar: null,
    konten: '',
    urutan: 0,
    status: 'published',
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPedia();
  }, []);

  const fetchPedia = async () => {
    try {
      setLoading(true);
      const data = await VespaPediaService.getAll();
      setPediaList(data);
    } catch (error) {
      console.error('Error fetching vespa pedia:', error);
      toast.error('Gagal memuat data Vespa Pedia');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pedia?: VespaPedia) => {
    if (pedia) {
      setEditMode(true);
      setSelectedPedia(pedia.id);
      setCurrentImage(pedia.gambar_url ?? null);
      setFormData({
        judul: pedia.judul,
        jenis_motor: pedia.jenis_motor as 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150',
        kategori: pedia.kategori as 'Pengenalan' | 'Keunggulan' | 'Spesifikasi' | 'Tips',
        gambar: null,
        konten: pedia.konten,
        urutan: pedia.urutan,
        status: pedia.status as 'draft' | 'published',
      });
      setPreviewImage(null);
    } else {
      setEditMode(false);
      setCurrentImage(null);
      setPreviewImage(null);
      setFormData({
        judul: '',
        jenis_motor: activeTab,
        kategori: 'Pengenalan',
        gambar: null,
        konten: '',
        urutan: 0,
        status: 'published',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPedia(0);
    setPreviewImage(null);
    setCurrentImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Rename file: ganti spasi dan karakter aneh dengan underscore
      let newFileName = file.name
        .replace(/\s+/g, '_')           // spasi -> underscore
        .replace(/[^\w\s.-]/gi, '_')    // karakter aneh -> underscore
        .toLowerCase();                  // lowercase

      const renamedFile = new File([file], newFileName, { type: file.type });

      setFormData({ ...formData, gambar: renamedFile });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, gambar: null });
    setPreviewImage(null);
    setCurrentImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editMode ? 'Mengupdate...' : 'Menambahkan...');

    const submitData = new FormData();
    submitData.append('judul', formData.judul);
    submitData.append('jenis_motor', formData.jenis_motor);
    submitData.append('kategori', formData.kategori);
    submitData.append('konten', formData.konten);
    submitData.append('urutan', formData.urutan.toString());
    submitData.append('status', formData.status);

    if (formData.gambar) {
      submitData.append('gambar', formData.gambar);
    }

    // Tambahkan ini khusus untuk update
    if (editMode) {
      submitData.append('_method', 'PUT');
    }

    try {
      if (editMode) {
        await VespaPediaService.update(selectedPedia, submitData);
      } else {
        await VespaPediaService.create(submitData);
      }
      toast.success(editMode ? 'Konten berhasil diupdate' : 'Konten berhasil ditambahkan', { id: loadingToast });
      handleCloseModal();
      fetchPedia();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading('Menghapus konten...');
    try {
      await VespaPediaService.delete(deletingId);
      toast.success('Konten berhasil dihapus', { id: loadingToast });
      fetchPedia();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus konten', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(0);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(0);
  };

  // Filter berdasarkan tab aktif
  const filteredPedia = pediaList.filter((pedia) => pedia.jenis_motor === activeTab);

  return (
    <DashboardLayout title="Vespa Pedia">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Vespa Pedia</h2>
          <p className="text-gray-600 mt-1">Konten edukasi untuk mobile app pengguna</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Tambah Konten
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

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table - FIXED TAG RUSAK */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urutan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPedia.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <BookOpen size={48} className="mx-auto mb-2 text-gray-300" />
                      Tidak ada konten untuk {activeTab}
                    </td>
                  </tr>
                ) : (
                  filteredPedia.map((pedia) => (
                    <tr key={pedia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{pedia.judul}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pedia.kategori}</td>
                      {/* KOLOM GAMBAR - INI YANG HARUS DIGANTI */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pedia.gambar_url ? (
                          <img
                            src={pedia.gambar_url}
                            alt={pedia.judul}
                            className="h-32 w-48 object-cover border-4 border-white"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/480x320?text=Gambar+Gagal+Dimuat";
                            }}
                          />
                        ) : (
                          <div className="h-32 w-48 bg-gray-300 rounded-xl flex items-center justify-center text-gray-600 font-medium">
                            Tidak ada gambar
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${pedia.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {pedia.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{pedia.urutan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleOpenModal(pedia)} className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors">
                            <Pencil size={20} />
                          </button>
                          <button onClick={() => handleDelete(pedia.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredPedia.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                <BookOpen size={48} className="mx-auto mb-2 text-gray-300" />
                Tidak ada konten untuk {activeTab}
              </div>
            ) : (
              filteredPedia.map((pedia) => (
                <div key={pedia.id} className="bg-white rounded-lg shadow-md p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pedia.judul}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        <span className="text-gray-600">{pedia.kategori}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button onClick={() => handleOpenModal(pedia)} className="text-primary-600 p-1">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(pedia.id)} className="text-red-600 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {/* GAMBAR DI MOBILE */}
                  {pedia.gambar_url && (
                    <div className="mt-4">
                      <img
                        src={pedia.gambar_url}
                        alt={pedia.judul}
                        className="w-full h-80 object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/600x400?text=No+Image";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm mt-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pedia.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {pedia.status}
                    </span>
                    <span className="text-gray-500">Urutan: {pedia.urutan}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Konten Vespa Pedia' : 'Tambah Konten Vespa Pedia'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Motor <span className="text-red-500">*</span></label>
                <select
                  value={formData.jenis_motor}
                  onChange={(e) => setFormData({ ...formData, jenis_motor: e.target.value as 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={editMode}
                >
                  {JENIS_MOTOR.map((jenis) => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as 'Pengenalan' | 'Keunggulan' | 'Spesifikasi' | 'Tips' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                >
                  {KATEGORI_OPTIONS.map((kat) => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>Upload file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP hingga 2MB</p>
                  </div>
                </div>
                {(previewImage || currentImage) && (
                  <div className="mt-4 relative">
                    <img src={previewImage || currentImage || ''} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konten <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.konten}
                  onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={6}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
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

      {/* Modal Validasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Konten Ini?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.
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