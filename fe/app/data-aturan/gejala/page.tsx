'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import GejalaService from '@/services/gejala-service';
import KategoriService, { KategoriItem } from '@/services/kategori-service';
import { Gejala } from '@/types';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';

export default function GejalaPage() {
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGejala, setSelectedGejala] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKode, setDeletingKode] = useState('');

  const [activeTab, setActiveTab] = useState<'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'>('Primavera 150');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    nama_gejala: '',
    jenis_motor: 'Primavera 150',
    kategori_id: '',
  });

  useEffect(() => {
    fetchGejala();
    fetchKategori();
  }, []);

  const fetchGejala = async () => {
    try {
      setLoading(true);
      const data = await GejalaService.getAll();
      setGejalaList(data);
    } catch {
      toast.error('Gagal memuat data gejala');
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    try {
      const data = await KategoriService.getAll();
      setKategoriList(data);
    } catch {
      toast.error('Gagal memuat kategori');
    }
  };

  const handleOpenModal = (g?: Gejala) => {
    if (g) {
      setEditMode(true);
      setSelectedGejala(g.kode_gejala);
      setFormData({
        nama_gejala: g.nama_gejala,
        jenis_motor: g.jenis_motor as any,
        kategori_id: g.kategori_id?.toString() || '',
      });
    } else {
      setEditMode(false);
      setFormData({
        nama_gejala: '',
        jenis_motor: activeTab,
        kategori_id: '',
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
    const t = toast.loading(editMode ? 'Mengupdate...' : 'Menambahkan...');

    try {
      if (editMode) {
        await GejalaService.update(selectedGejala, formData);
      } else {
        await GejalaService.create(formData);
      }
      toast.success('Berhasil', { id: t });
      handleCloseModal();
      fetchGejala();
    } catch {
      toast.error('Gagal', { id: t });
    }
  };

  const handleDelete = (kode: string) => {
    setDeletingKode(kode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const t = toast.loading('Menghapus...');
    try {
      await GejalaService.delete(deletingKode);
      toast.success('Berhasil dihapus', { id: t });
      fetchGejala();
    } catch {
      toast.error('Gagal', { id: t });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const filtered = gejalaList.filter(g => g.jenis_motor === activeTab);
  const currentData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Data Gejala">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Gejala</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} /> Tambah Gejala
        </button>
      </div>

      {/* TABS */}
      <div className="border-b mb-6">
        <div className="flex space-x-6">
          {JENIS_MOTOR.map(j => (
            <button
              key={j}
              onClick={() => setActiveTab(j)}
              className={`pb-2 border-b-2 ${
                activeTab === j
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left">Kode</th>
                <th className="px-6 py-3 text-left">Nama</th>
                <th className="px-6 py-3 text-left">Kategori</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {currentData.map((g, i) => (
                <tr key={`${g.kode_gejala}-${i}`} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{g.kode_gejala}</td>
                  <td className="px-6 py-4">{g.nama_gejala}</td>
                  <td className="px-6 py-4">{g.kategori}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleOpenModal(g)} className="text-blue-600 mr-2">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(g.kode_gejala)} className="text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

   {/* MODAL FORM */}
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
      
      <h3 className="text-xl font-bold mb-4">
        {editMode ? 'Edit Gejala' : 'Tambah Gejala'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* KODE (hanya saat edit) */}
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
            <p className="text-xs text-gray-500 mt-1">
              Kode otomatis, tidak dapat diubah
            </p>
          </div>
        )}

        {/* NAMA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Gejala <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama_gejala}
            onChange={(e) =>
              setFormData({ ...formData, nama_gejala: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Masukkan nama gejala"
            required
          />
        </div>

        {/* JENIS MOTOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Motor <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.jenis_motor}
            onChange={(e) =>
              setFormData({
                ...formData,
                jenis_motor: e.target.value as any,
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

        {/* KATEGORI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.kategori_id}
            onChange={(e) =>
              setFormData({ ...formData, kategori_id: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            required
          >
            <option value="">Pilih kategori</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} (Bobot {k.bobot})
              </option>
            ))}
          </select>
        </div>

        {/* BUTTON */}
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg text-center">
            <AlertTriangle className="mx-auto text-red-600 mb-3" size={40} />
            <p>Hapus gejala {deletingKode}?</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-300 py-2 rounded">Batal</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2 rounded">Hapus</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}