'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Upload, X, BookOpen, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import VespaPediaService from '@/services/vespa-pedia-service';
import JenisMotorService from '@/services/jenis-montor-service';
import { VespaPedia, JenisMotor } from '@/types/index';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['draft', 'published'];
const ITEMS_PER_PAGE = 5;

interface FormData {
  judul: string;
  jenis_motor_id: number;
  spesifikasi: string;
  keunggulan: string;
  tips: string;
  urutan: number;
  status: string;
  gambar: File | null;
}

interface FormErrors {
  judul?: string;
  spesifikasi?: string;
  keunggulan?: string;
  tips?: string;
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};
  if (!data.judul.trim()) {
    errors.judul = 'Judul tidak boleh kosong';
  } else if (data.judul.trim().length < 5) {
    errors.judul = 'Judul minimal 5 karakter';
  }
  if (!data.spesifikasi.trim()) {
    errors.spesifikasi = 'Spesifikasi tidak boleh kosong';
  }
  if (!data.keunggulan.trim()) {
    errors.keunggulan = 'Keunggulan tidak boleh kosong';
  }
  if (!data.tips.trim()) {
    errors.tips = 'Tips tidak boleh kosong';
  }
  return errors;
};

export default function VespaPediaPage() {
  const [pediaList, setPediaList] = useState<VespaPedia[]>([]);
  const [jenisMotorList, setJenisMotorList] = useState<JenisMotor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    judul: '',
    jenis_motor_id: 0,
    spesifikasi: '',
    keunggulan: '',
    tips: '',
    urutan: 0,
    status: 'published',
    gambar: null,
  });

  useEffect(() => {
    fetchJenisMotor();
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const fetchJenisMotor = async () => {
    try {
      const data = await JenisMotorService.getAll();
      setJenisMotorList(data);
      if (data.length > 0) {
        setActiveTab(data[0].id_jenis_motor);
        setFormData(prev => ({ ...prev, jenis_motor_id: data[0].id_jenis_motor }));
      }
    } catch {
      toast.error('Gagal memuat jenis motor');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await VespaPediaService.getAll();
      setPediaList(data);
    } catch {
      toast.error('Gagal memuat data Vespa Pedia');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: VespaPedia) => {
    setFormErrors({});
    if (item) {
      setEditMode(true);
      setSelectedId(item.id);
      setCurrentImage(item.gambar_url ?? null);
      setFormData({
        judul: item.judul,
        jenis_motor_id: item.jenis_motor_id ?? activeTab,
        spesifikasi: item.spesifikasi ?? '',
        keunggulan: item.keunggulan ?? '',
        tips: item.tips ?? '',
        urutan: item.urutan,
        status: item.status,
        gambar: null,
      });
    } else {
      setEditMode(false);
      setSelectedId(0);
      setCurrentImage(null);
      setFormData({
        judul: '',
        jenis_motor_id: activeTab,
        spesifikasi: '',
        keunggulan: '',
        tips: '',
        urutan: 0,
        status: 'published',
        gambar: null,
      });
    }
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedId(0);
    setPreviewImage(null);
    setCurrentImage(null);
    setFormErrors({});
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w\s.-]/gi, '_')
        .toLowerCase();
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
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const loadingToast = toast.loading(editMode ? 'Mengupdate...' : 'Menambahkan...');
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]: any) => {
      if (val !== null) data.append(key, val);
    });
    if (editMode) data.append('_method', 'PUT');
    try {
      if (editMode) {
        await VespaPediaService.update(selectedId, data);
      } else {
        await VespaPediaService.create(data);
      }
      toast.success(editMode ? 'Konten berhasil diupdate' : 'Konten berhasil ditambahkan', { id: loadingToast });
      handleCloseModal();
      fetchData();
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
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus konten', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(0);
    }
  };

  const activeMotorName = jenisMotorList.find(j => j.id_jenis_motor === activeTab)?.nama_motor ?? '';

  const filteredPedia = pediaList
    .filter(p => p.jenis_motor_id === activeTab)
    .filter(p =>
      searchQuery.trim() === '' ||
      p.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredPedia.length / ITEMS_PER_PAGE);
  const currentPedia = filteredPedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout title="Vespa Pedia">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Vespa Pedia</h2>
          <p className="text-gray-600 mt-1">Konten edukasi untuk mobile app pengguna</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari judul atau status..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} /> Tambah Konten
          </button>

        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          {jenisMotorList.map(jm => (
            <button
              key={jm.id_jenis_motor}
              onClick={() => { setActiveTab(jm.id_jenis_motor); setCurrentPage(1); setSearchQuery(''); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === jm.id_jenis_motor
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {jm.nama_motor}
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
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full border border-gray-300 border-collapse">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Judul
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Gambar
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Status
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Urutan
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {currentPedia.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 border-b border-gray-300"
                    >
                      <BookOpen size={48} className="mx-auto mb-2 text-gray-300" />
                      {searchQuery
                        ? `Tidak ada konten yang cocok dengan "${searchQuery}"`
                        : `Tidak ada konten untuk ${activeMotorName}`}
                    </td>
                  </tr>
                ) : (
                  currentPedia.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">

                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs border-r border-b border-gray-300">
                        <span className="line-clamp-2">{p.judul}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap border-r border-b border-gray-300">
                        {p.gambar_url ? (
                          <img
                            src={p.gambar_url}
                            alt={p.judul}
                            className="h-32 w-48 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://via.placeholder.com/480x320?text=Gagal+Dimuat';
                            }}
                          />
                        ) : (
                          <div className="h-32 w-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                            Tidak ada gambar
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap border-r border-b border-gray-300">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${p.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {p.status === 'published' ? 'Dipublikasi' : 'Draft'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r border-b border-gray-300">
                        {p.urutan}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center border-b border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(p)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {currentPedia.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                <BookOpen size={48} className="mx-auto mb-2 text-gray-300" />
                {searchQuery
                  ? `Tidak ada konten yang cocok dengan "${searchQuery}"`
                  : `Tidak ada konten untuk ${activeMotorName}`}
              </div>
            ) : (
              currentPedia.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow-md p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{p.judul}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button onClick={() => handleOpenModal(p)} className="text-primary-600 p-1 hover:bg-primary-50 rounded transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600 p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {p.gambar_url && (
                    <img
                      src={p.gambar_url}
                      alt={p.judul}
                      className="w-full h-48 object-cover rounded-lg mt-2"
                      onError={e => { e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                    />
                  )}
                  <div className="flex justify-between items-center text-sm mt-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {p.status === 'published' ? 'Dipublikasi' : 'Draft'}
                    </span>
                    <span className="text-gray-500">Urutan: {p.urutan}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm ${page === currentPage ? 'bg-primary-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">
                {editMode ? 'Edit Konten Vespa Pedia' : 'Tambah Konten Vespa Pedia'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={e => { setFormData({ ...formData, judul: e.target.value }); setFormErrors(p => ({ ...p, judul: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm ${formErrors.judul ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Masukkan judul konten"
                />
                {formErrors.judul && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.judul}</p>}
              </div>

              {/* Jenis Motor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Motor</label>
                <input
                  type="text"
                  value={jenisMotorList.find(j => j.id_jenis_motor === formData.jenis_motor_id)?.nama_motor ?? ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Mengikuti tab aktif, tidak dapat diubah</p>
              </div>

              {/* Spesifikasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spesifikasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.spesifikasi}
                  onChange={e => { setFormData({ ...formData, spesifikasi: e.target.value }); setFormErrors(p => ({ ...p, spesifikasi: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm ${formErrors.spesifikasi ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows={3}
                  placeholder="Masukkan spesifikasi motor"
                />
                {formErrors.spesifikasi && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.spesifikasi}</p>}
              </div>

              {/* Keunggulan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keunggulan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.keunggulan}
                  onChange={e => { setFormData({ ...formData, keunggulan: e.target.value }); setFormErrors(p => ({ ...p, keunggulan: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm ${formErrors.keunggulan ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows={3}
                  placeholder="Masukkan keunggulan motor"
                />
                {formErrors.keunggulan && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.keunggulan}</p>}
              </div>

              {/* Tips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tips <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.tips}
                  onChange={e => { setFormData({ ...formData, tips: e.target.value }); setFormErrors(p => ({ ...p, tips: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm ${formErrors.tips ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows={3}
                  placeholder="Masukkan tips perawatan"
                />
                {formErrors.tips && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.tips}</p>}
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
                {!(previewImage || currentImage) ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload file</span>
                          <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP maks. 2MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <img src={previewImage || currentImage || ''} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Urutan & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={e => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                  >
                    <option value="published">Dipublikasi</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm">
                  {editMode ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Konten Ini?</h3>
              <p className="text-sm text-gray-600 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                  Batal
                </button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
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