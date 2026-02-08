'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import ServiceTemplateService from '@/services/service-template-service'; 
import { ServiceTemplate } from '@/types';
import { JENIS_MOTOR } from '@/utils/constants';
import toast from 'react-hot-toast';

const JENIS_SERVICE = ['Ganti Oli', 'Service Berkala', 'Ganti CVT'];

export default function ServiceTemplatePage() {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
 const [activeTab, setActiveTab] = useState<'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'>('Primavera 150');

  const [formData, setFormData] = useState<{
    jenis_motor: 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150';
    jenis_service: 'Ganti Oli' | 'Service Berkala' | 'Ganti CVT';
    interval_km: number;
    interval_hari: number;
    deskripsi: string;
    biaya_estimasi: string;
  }>({
    jenis_motor: 'Primavera 150',
    jenis_service: 'Ganti Oli',
    interval_km: 3000,
    interval_hari: 90,
    deskripsi: '',
    biaya_estimasi: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await ServiceTemplateService.getAll({ jenis_motor: activeTab });
      const mappedData = data.map(item => ({
        ...item,
        jenis_motor: activeTab
      }));
      setTemplates(mappedData);
    } catch (error) {
      toast.error('Gagal memuat template service');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template?: ServiceTemplate) => {
    if (template) {
      setEditMode(true);
      setSelectedId(template.id);
      setFormData({
        jenis_motor: template.jenis_motor,
        jenis_service: template.jenis_service,
        interval_km: template.interval_km,
        interval_hari: template.interval_hari,
        deskripsi: template.deskripsi || '',
        biaya_estimasi: template.biaya_estimasi || '',
      });
    } else {
      setEditMode(false);
      setFormData({
        jenis_motor: activeTab,
        jenis_service: 'Ganti Oli',
        interval_km: 3000,
        interval_hari: 90,
        deskripsi: '',
        biaya_estimasi: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editMode ? 'Mengupdate...' : 'Menambahkan...');

    try {
      // Extract base model name (e.g., "Primavera" from "Primavera 150")
      const baseMotorName = formData.jenis_motor.split(' ')[0] as 'Primavera' | 'LX' | 'Sprint';
      const submitData = { ...formData, jenis_motor: baseMotorName };

      if (editMode && selectedId) {
        await ServiceTemplateService.update(selectedId, submitData);
        toast.success('Template berhasil diupdate', { id: loadingToast });
      } else {
        await ServiceTemplateService.create(submitData);
        toast.success('Template berhasil ditambahkan', { id: loadingToast });
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus template ini?')) {
      try {
        await ServiceTemplateService.delete(id);
        toast.success('Template dihapus');
        fetchTemplates();
      } catch (error) {
        toast.error('Gagal menghapus');
      }
    }
  };

  return (
    <DashboardLayout title="Template Service">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vespa Care (Template Interval Service)</h2>
          <p className="text-gray-600 mt-1">Atur interval default untuk reminder service per motor</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Template
        </button>
      </div>

      {/* Tabs Motor */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {JENIS_MOTOR.map((motor) => (
            <button
              key={motor}
              onClick={() => setActiveTab(motor)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === motor
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {motor}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Memuat...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval Hari</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biaya Estimasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Wrench size={48} className="mx-auto mb-3 text-gray-300" />
                    Belum ada template untuk {activeTab}
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{template.jenis_service}</td>
                    <td className="px-6 py-4">{template.interval_km.toLocaleString()} km</td>
                    <td className="px-6 py-4">{template.interval_hari > 0 ? template.interval_hari + ' hari' : '-'}</td>
                    <td className="px-6 py-4">{template.biaya_estimasi || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(template)} className="text-primary-600 hover:text-primary-800">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-800">
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

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">
              {editMode ? 'Edit' : 'Tambah'} Template Service
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jenis Motor</label>
                <input value={formData.jenis_motor} disabled className="w-full px-3 py-2 border rounded bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jenis Service *</label>
                <select
                  value={formData.jenis_service}
                  onChange={(e) => setFormData({ ...formData, jenis_service: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded"
                  required
                  disabled={editMode}
                >
                  {JENIS_SERVICE.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Interval KM *</label>
                  <input
                    type="number"
                    value={formData.interval_km}
                    onChange={(e) => setFormData({ ...formData, interval_km: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interval Hari *</label>
                  <input
                    type="number"
                    value={formData.interval_hari}
                    onChange={(e) => setFormData({ ...formData, interval_hari: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Biaya Estimasi</label>
                <input
                  type="text"
                  value={formData.biaya_estimasi}
                  onChange={(e) => setFormData({ ...formData, biaya_estimasi: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Rp 150.000 - 250.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded hover:bg-primary-700">
                  {editMode ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}