'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import KerusakanService from '@/services/kerusakan-service';
import JenisMotorService from '@/services/jenis-montor-service';
import { Kerusakan, JenisMotor } from '@/types';
import toast from 'react-hot-toast';

interface FormData {
  nama_kerusakan: string;
  solusi: string;
  kategori: string;
  jenis_motor_id: number;  // ← ganti dari jenis_motor: JenisMotor
}

interface FormErrors {
  nama_kerusakan?: string;
  solusi?: string;
  kategori?: string;
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};
  if (!data.nama_kerusakan.trim()) {
    errors.nama_kerusakan = 'Nama kerusakan tidak boleh kosong';
  } else if (data.nama_kerusakan.trim().length < 5) {
    errors.nama_kerusakan = 'Nama kerusakan minimal 5 karakter';
  }
  if (!data.kategori) {
    errors.kategori = 'Kategori harus dipilih';
  }
  if (!data.solusi.trim()) {
    errors.solusi = 'Solusi tidak boleh kosong';
  } else if (data.solusi.trim().length < 10) {
    errors.solusi = 'Solusi minimal 10 karakter';
  }
  return errors;
};

export default function KerusakanPage() {
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedKerusakan, setSelectedKerusakan] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKode, setDeletingKode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);              // ← pakai id
  const [jenisMotorList, setJenisMotorList] = useState<JenisMotor[]>([]); // ← dinamis
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState<FormData>({
    nama_kerusakan: '',
    solusi: '',
    kategori: '',
    jenis_motor_id: 0,  // ← ganti
  });

  useEffect(() => {
    fetchJenisMotor();
    fetchKerusakan();
  }, []);

  const fetchJenisMotor = async () => {
    try {
      const data = await JenisMotorService.getAll();
      setJenisMotorList(data);
      if (data.length > 0) {
        setActiveTab(data[0].id_jenis_motor);
        setFormData((prev) => ({ ...prev, jenis_motor_id: data[0].id_jenis_motor }));
      }
    } catch {
      toast.error('Gagal memuat jenis motor');
    }
  };

  const fetchKerusakan = async () => {
    try {
      setLoading(true);
      const data = await KerusakanService.getAll();
      setKerusakanList(data);
    } catch (error) {
      console.error('Error fetching kerusakan:', error);
      toast.error('Gagal memuat data kerusakan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (kerusakan?: Kerusakan) => {
    setFormErrors({});
    if (kerusakan) {
      setEditMode(true);
      setSelectedKerusakan(kerusakan.kode_kerusakan);
      setFormData({
        nama_kerusakan: kerusakan.nama_kerusakan,
        solusi: kerusakan.solusi || '',
        kategori: kerusakan.kategori || '',
        jenis_motor_id: kerusakan.jenis_motor_id ?? activeTab,  // ← ganti
      });
    } else {
      setEditMode(false);
      setFormData({
        nama_kerusakan: '',
        solusi: '',
        kategori: '',
        jenis_motor_id: activeTab,  // ← otomatis tab aktif
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedKerusakan('');
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const loadingToast = toast.loading(editMode ? 'Mengupdate kerusakan...' : 'Menambahkan kerusakan...');
    try {
      if (editMode) {
        await KerusakanService.update(selectedKerusakan, formData);
        toast.success('Kerusakan berhasil diupdate', { id: loadingToast });
      } else {
        await KerusakanService.create(formData);
        toast.success('Kerusakan berhasil ditambahkan', { id: loadingToast });
      }
      handleCloseModal();
      fetchKerusakan();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = (kode: string) => {
    setDeletingKode(kode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingKode) return;
    const loadingToast = toast.loading('Menghapus kerusakan...');
    try {
      await KerusakanService.delete(deletingKode);
      toast.success('Kerusakan berhasil dihapus', { id: loadingToast });
      fetchKerusakan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kerusakan', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingKode('');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingKode('');
  };

  const handleTabChange = (id: number) => {
    setActiveTab(id);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const filteredKerusakan = kerusakanList
    .filter((k) => k.jenis_motor_id === activeTab)  // ← filter by id
    .filter((k) =>
      searchQuery.trim() === '' ||
      k.nama_kerusakan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kode_kerusakan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kategori?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentKerusakan = filteredKerusakan.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKerusakan.length / ITEMS_PER_PAGE);

  const activeMotorName = jenisMotorList.find((j) => j.id_jenis_motor === activeTab)?.nama_motor ?? '';

  return (
    <DashboardLayout title="Data Kerusakan">

      <div className="flex flex-row items-center justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Daftar Kerusakan
        </h2>
        <p className="text-gray-600 mt-1">Data kerusakan untuk menginputkan informasi kerusakan berdasarkan jenis motor</p>

        <div className="flex flex-row items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode atau nama kerusakan..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-56 sm:w-64"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Tambah Kerusakan
          </button>
        </div>
      </div>

      {/* ── Tabs dinamis dari API ── */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          {jenisMotorList.map((jm) => (
            <button
              key={jm.id_jenis_motor}
              onClick={() => handleTabChange(jm.id_jenis_motor)}
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">Kode</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">Nama Kerusakan</th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">Kategori</th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">Solusi</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 border-r border-gray-300">
                {currentKerusakan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery
                        ? `Tidak ada kerusakan yang cocok dengan "${searchQuery}"`
                        : `Tidak ada data kerusakan untuk ${activeMotorName}`}
                    </td>
                  </tr>
                ) : (
                  currentKerusakan.map((kerusakan) => (
                    <tr key={kerusakan.kode_kerusakan} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                        {kerusakan.kode_kerusakan}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-[160px] sm:max-w-xs border-r border-gray-300">
                        <span className="line-clamp-2">{kerusakan.nama_kerusakan}</span>
                        {kerusakan.kategori && (
                          <span className="md:hidden mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {kerusakan.kategori}
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900 border-r border-gray-300">
                        {kerusakan.kategori ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {kerusakan.kategori}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-xs border-r border-b border-gray-300 align-top">
                        {kerusakan.solusi ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {kerusakan.solusi
                              .split('•')
                              .filter((item) => item.trim() !== '')
                              .map((item, index) => (
                                <li key={index}>
                                  {item.trim()}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-center border-r border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(kerusakan)} className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors">
                            <Pencil size={17} />
                          </button>
                          <button onClick={() => handleDelete(kerusakan.kode_kerusakan)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm">Sebelum</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded text-sm ${page === currentPage ? 'bg-primary-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm">Selanjutnya</button>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit Kerusakan' : 'Tambah Kerusakan'}</h3>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Kerusakan</label>
                  <input type="text" value={selectedKerusakan} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
                  <p className="text-xs text-gray-500 mt-1">Kode otomatis, tidak dapat diubah</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kerusakan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.nama_kerusakan}
                  onChange={(e) => { setFormData({ ...formData, nama_kerusakan: e.target.value }); setFormErrors((p) => ({ ...p, nama_kerusakan: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.nama_kerusakan ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Masukkan nama kerusakan"
                />
                {formErrors.nama_kerusakan && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.nama_kerusakan}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                <select
                  value={formData.kategori}
                  onChange={(e) => { setFormData({ ...formData, kategori: e.target.value }); setFormErrors((p) => ({ ...p, kategori: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white ${formErrors.kategori ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">-- Pilih Kategori --</option>
                  <option value="Mesin">Mesin</option>
                  <option value="CVT">CVT</option>
                  <option value="Kelistrikan">Kelistrikan</option>
                  <option value="Rem & Keselamatan">Rem & Keselamatan</option>
                  <option value="Handling/Suspensi">Handling/Suspensi</option>
                  <option value="Injeksi/Fuel System">Injeksi/Fuel System</option>
                </select>
                {formErrors.kategori && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.kategori}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solusi <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.solusi}
                  onChange={(e) => { setFormData({ ...formData, solusi: e.target.value }); setFormErrors((p) => ({ ...p, solusi: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none ${formErrors.solusi ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Masukkan solusi kerusakan"
                  rows={3}
                />
                {formErrors.solusi && <p className="text-xs text-red-600 mt-1">⚠ {formErrors.solusi}</p>}
              </div>

              {/* Jenis Motor: tampil nama, value pakai id */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Motor</label>
                <input
                  type="text"
                  value={jenisMotorList.find((j) => j.id_jenis_motor === formData.jenis_motor_id)?.nama_motor ?? ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Jenis motor mengikuti tab yang sedang aktif dan tidak dapat diubah</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">{editMode ? 'Update' : 'Simpan'}</button>
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kerusakan Ini?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus kerusakan <span className="font-medium text-gray-900">{deletingKode}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={cancelDelete} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}