'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ChevronLeft, Check, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import AturanService from '@/services/aturan-service';
import GejalaService from '@/services/gejala-service';
import KerusakanService from '@/services/kerusakan-service';
import JenisMotorService from '@/services/jenis-montor-service';
import { Aturan, Gejala, Kerusakan, JenisMotor } from '@/types';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 10;

export default function AturanPage() {
  const [aturanList, setAturanList] = useState<Aturan[]>([]);
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [jenisMotorList, setJenisMotorList] = useState<JenisMotor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<{
    kode_kerusakan: string;
    gejala: string[];
  }>({ kode_kerusakan: '', gejala: [] });

  useEffect(() => { fetchData(); }, []);

  // reset halaman kalau tab / search berubah
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aturan, gejala, kerusakan, jenisMotor] = await Promise.all([
        AturanService.getAll(),
        GejalaService.getAll(),
        KerusakanService.getAll(),
        JenisMotorService.getAll(),
      ]);
      setAturanList(aturan);
      setGejalaList(gejala);
      setKerusakanList(kerusakan);
      setJenisMotorList(jenisMotor);
      if (jenisMotor.length > 0) setActiveTab(jenisMotor[0].id_jenis_motor);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredGejala = gejalaList.filter(g => g.jenis_motor_id === activeTab);
  const filteredKerusakan = kerusakanList.filter(k => k.jenis_motor_id === activeTab);

  const filteredAturan = aturanList.filter(a => {
    const k = kerusakanList.find(x => x.kode_kerusakan === a.kode_kerusakan);
    if (k?.jenis_motor_id !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const namaKerusakan = k?.nama_kerusakan?.toLowerCase() ?? '';
    const kodeGejala = a.gejala.map(g => g.kode_gejala.toLowerCase()).join(' ');
    return namaKerusakan.includes(q) || kodeGejala.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredAturan.length / PAGE_SIZE));
  const paginatedAturan = filteredAturan.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openModal = (aturan?: Aturan) => {
    if (aturan) {
      setEditMode(true);
      setSelectedId(aturan.id_aturan);
      setFormData({
        kode_kerusakan: aturan.kode_kerusakan,
        gejala: aturan.gejala.map(g => g.kode_gejala),
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({ kode_kerusakan: '', gejala: [] });
    }
    setModalStep(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
  };

  const handleNext = () => {
    if (formData.gejala.length === 0) {
      toast.error('Pilih minimal 1 gejala');
      return;
    }
    setModalStep(2);
  };

  const toggleGejala = (kode: string) => {
    setFormData(prev => ({
      ...prev,
      gejala: prev.gejala.includes(kode)
        ? prev.gejala.filter(x => x !== kode)
        : [...prev.gejala, kode],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_kerusakan) {
      toast.error('Pilih kerusakan terlebih dahulu');
      return;
    }
    const t = toast.loading(editMode ? 'Mengupdate aturan...' : 'Menyimpan aturan...');
    try {
      if (editMode && selectedId) {
        await AturanService.update(selectedId, formData);
      } else {
        await AturanService.create(formData);
      }
      toast.success('Berhasil disimpan', { id: t });
      closeModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan', { id: t });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const t = toast.loading('Menghapus aturan...');
    try {
      await AturanService.delete(deleteId);
      toast.success('Aturan dihapus', { id: t });
      fetchData();
    } catch {
      toast.error('Gagal menghapus', { id: t });
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <DashboardLayout title="Data Aturan">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Aturan</h2>
        <p className="text-gray-600 mt-1">Data aturan untuk menginputkan data gejala, kerusakan dan solusi berdasarkan base knowladge</p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kerusakan atau gejala..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors text-sm whitespace-nowrap"
          >
            <Plus size={16} /> Tambah Aturan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex gap-6 overflow-x-auto">
        {jenisMotorList.map(j => (
          <button
            key={j.id_jenis_motor}
            onClick={() => setActiveTab(j.id_jenis_motor)}
            className={`pb-2 text-sm whitespace-nowrap transition-colors ${activeTab === j.id_jenis_motor
                ? 'border-b-2 border-primary-600 text-primary-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {j.nama_motor}
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
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-x-auto">
            <table className="min-w-full border border-gray-300 border-collapse">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-b border-gray-300">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-r border-b border-gray-300">Gejala</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 border-r border-b border-gray-300">Kerusakan</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 border-r border-b border-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-r border-gray-300">
                {paginatedAturan.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400 border-r border-gray-300">
                      {searchQuery ? 'Tidak ada hasil yang cocok' : 'Tidak ada aturan untuk jenis motor ini'}
                    </td>
                  </tr>
                ) : (
                  paginatedAturan.map((a, idx) => {
                    const k = kerusakanList.find(x => x.kode_kerusakan === a.kode_kerusakan);
                    return (
                      <tr key={a.id_aturan} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs border-r border-gray-300">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-4 py-3 text-gray-700 border-r border-gray-300">
                          {a.gejala.map(g => g.kode_gejala).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-gray-700 border-r border-gray-300">{k?.nama_kerusakan ?? '—'}</td>
                        <td className="px-4 py-3 border-r border-gray-300">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openModal(a)}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => { setDeleteId(a.id_aturan); setShowDeleteModal(true); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Sebelum
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm ${page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
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
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL FORM — 2 STEP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden">

            {/* Header + Step Indicator */}
            <div className="px-8 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editMode ? 'Edit Aturan' : 'Tambah Aturan Baru'}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${modalStep === 1 ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                    }`}>
                    {modalStep > 1 ? <Check size={15} /> : '1'}
                  </div>
                  <span className={`text-sm font-medium ${modalStep === 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                    Pilih Gejala
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-2" />
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${modalStep === 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                    2
                  </div>
                  <span className={`text-sm font-medium ${modalStep === 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                    Pilih Kerusakan
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={submit}>
              {/* STEP 1: Pilih Gejala */}
              {modalStep === 1 && (
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Pilih gejala yang sesuai dengan aturan ini</p>
                    <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-medium">
                      {formData.gejala.length} dipilih
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg divide-y max-h-80 overflow-y-auto">
                    {filteredGejala.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">Tidak ada gejala tersedia</p>
                    ) : (
                      filteredGejala.map(g => {
                        const checked = formData.gejala.includes(g.kode_gejala);
                        return (
                          <label
                            key={g.kode_gejala}
                            onClick={() => toggleGejala(g.kode_gejala)}
                            className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-primary-50' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                              }`}>
                              {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-sm text-gray-700 leading-snug">
                              <span className="font-mono text-xs text-gray-400 mr-2">{g.kode_gejala}</span>
                              {g.nama_gejala}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-2.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Lanjut <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Pilih Kerusakan */}
              {modalStep === 2 && (
                <div className="px-8 py-6">
                  <p className="text-sm text-gray-600 mb-4">Pilih jenis kerusakan yang sesuai</p>
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {filteredKerusakan.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">Tidak ada kerusakan tersedia</p>
                    ) : (
                      filteredKerusakan.map(k => {
                        const selected = formData.kode_kerusakan === k.kode_kerusakan;
                        return (
                          <label
                            key={k.kode_kerusakan}
                            onClick={() => setFormData(prev => ({ ...prev, kode_kerusakan: k.kode_kerusakan }))}
                            className={`flex items-center gap-4 px-5 py-4 rounded-lg border-2 cursor-pointer transition-all ${selected
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-primary-600' : 'border-gray-300'
                              }`}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{k.nama_kerusakan}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{k.kode_kerusakan}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft size={16} /> Kembali
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> {editMode ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Hapus Aturan Ini?</h3>
            <p className="text-sm text-gray-500 mb-5">Semua relasi gejala pada aturan ini akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}