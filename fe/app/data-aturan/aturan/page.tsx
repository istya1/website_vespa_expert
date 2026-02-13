'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import AturanService from '@/services/aturan-service';
import GejalaService from '@/services/gejala-service';
import KerusakanService from '@/services/kerusakan-service';
import { Aturan, Gejala, Kerusakan } from '@/types';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AturanPage() {
  const [aturanList, setAturanList] = useState<Aturan[]>([]);
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [activeTab, setActiveTab] =
    useState<(typeof JENIS_MOTOR)[number]>('Primavera 150');

  const [formData, setFormData] = useState<{
    kode_kerusakan: string;
    gejala: string[];
  }>({
    kode_kerusakan: '',
    gejala: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aturan, gejala, kerusakan] = await Promise.all([
        AturanService.getAll(),
        GejalaService.getAll(),
        KerusakanService.getAll(),
      ]);
      setAturanList(aturan);
      setGejalaList(gejala);
      setKerusakanList(kerusakan);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredGejala = gejalaList.filter(g => g.jenis_motor === activeTab);
  const filteredKerusakan = kerusakanList.filter(
    k => k.jenis_motor === activeTab
  );

  const filteredAturan = aturanList.filter(a => {
    const k = kerusakanList.find(
      x => x.kode_kerusakan === a.kode_kerusakan
    );
    return k?.jenis_motor === activeTab;
  });

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
      setFormData({
        kode_kerusakan: '',
        gejala: [],
      });
    }
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading(
      editMode ? 'Mengupdate aturan...' : 'Menyimpan aturan...'
    );

    try {
      if (editMode && selectedId) {
        await AturanService.update(selectedId, formData);
      } else {
        await AturanService.create(formData);
      }
      toast.success('Berhasil', { id: t });
      setShowModal(false);
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

  return (
    <DashboardLayout title="Data Aturan">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Daftar Aturan</h2>
        <button
          onClick={() => openModal()}
          className="bg-primary-600 text-white px-5 py-2 rounded-lg flex gap-2"
        >
          <Plus size={18} /> Tambah Aturan
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-6">
        {JENIS_MOTOR.map(j => (
          <button
            key={j}
            onClick={() => setActiveTab(j)}
            className={`pb-2 ${
              activeTab === j
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500'
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Gejala</th>
                <th className="px-4 py-3 text-left">Kerusakan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAturan.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-500">
                    Tidak ada aturan
                  </td>
                </tr>
              ) : (
                filteredAturan.map(a => {
                  const k = kerusakanList.find(
                    x => x.kode_kerusakan === a.kode_kerusakan
                  );
                  return (
                    <tr key={a.id_aturan} className="border-t">
                      <td className="px-4 py-3">
                        {a.gejala.map(g => g.kode_gejala).join(', ')}
                      </td>
                      <td className="px-4 py-3">{k?.nama_kerusakan}</td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => openModal(a)}>
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(a.id_aturan);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-bold mb-4">
              {editMode ? 'Edit Aturan' : 'Tambah Aturan'}
            </h3>

            <form onSubmit={submit} className="space-y-4">
              {/* Gejala */}
              <div>
                <label className="text-sm font-medium">Gejala</label>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {filteredGejala.map(g => (
                    <label key={g.kode_gejala} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.gejala.includes(g.kode_gejala)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            gejala: checked
                              ? [...prev.gejala, g.kode_gejala]
                              : prev.gejala.filter(x => x !== g.kode_gejala),
                          }));
                        }}
                      />
                      {g.nama_gejala}
                    </label>
                  ))}
                </div>
              </div>

              {/* Kerusakan */}
              <div>
                <label className="text-sm font-medium">Kerusakan</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.kode_kerusakan}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      kode_kerusakan: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">-- Pilih --</option>
                  {filteredKerusakan.map(k => (
                    <option key={k.kode_kerusakan} value={k.kode_kerusakan}>
                      {k.nama_kerusakan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 py-2 rounded"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <p className="mb-5">Yakin ingin menghapus aturan ini?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
