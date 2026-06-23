'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Bike,
} from 'lucide-react';

import DashboardLayout from '@/components/dashboard-layout';
import JenisMotorService from '@/services/jenis-montor-service';
import { JenisMotor } from '@/types';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormData {
  nama_motor: string;
}

interface FormErrors {
  nama_motor?: string;
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.nama_motor.trim()) {
    errors.nama_motor = 'Nama jenis motor wajib diisi';
  } else if (data.nama_motor.trim().length < 3) {
    errors.nama_motor = 'Minimal 3 karakter';
  }

  return errors;
};

export default function JenisMotorPage() {
  const [motorList, setMotorList] = useState<JenisMotor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingNama, setDeletingNama] = useState('');

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState<FormData>({
    nama_motor: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await JenisMotorService.getAll();

      setMotorList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data jenis motor');
      setMotorList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (motor?: JenisMotor) => {
    setFormErrors({});

    if (motor) {
      setEditMode(true);
      setSelectedId(motor.id_jenis_motor);

      setFormData({
        nama_motor: motor.nama_motor,
      });
    } else {
      setEditMode(false);
      setSelectedId(null);

      setFormData({
        nama_motor: '',
      });
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

    const loadingToast = toast.loading(
      editMode
        ? 'Mengupdate jenis motor...'
        : 'Menambahkan jenis motor...'
    );

    try {
      if (editMode && selectedId) {
        await JenisMotorService.update(selectedId, formData);

        toast.success('Jenis motor berhasil diupdate', {
          id: loadingToast,
        });
      } else {
        await JenisMotorService.create(formData);

        toast.success('Jenis motor berhasil ditambahkan', {
          id: loadingToast,
        });
      }

      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        'Terjadi kesalahan',
        {
          id: loadingToast,
        }
      );
    }
  };

  const handleDelete = (motor: JenisMotor) => {
    setDeletingId(motor.id_jenis_motor);
    setDeletingNama(motor.nama_motor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    const loadingToast = toast.loading(
      'Menghapus jenis motor...'
    );

    try {
      await JenisMotorService.delete(deletingId);

      toast.success('Jenis motor berhasil dihapus', {
        id: loadingToast,
      });

      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        'Gagal menghapus jenis motor',
        {
          id: loadingToast,
        }
      );
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

  const filteredData = motorList.filter(
    (item) =>
      searchQuery.trim() === '' ||
      item.nama_motor
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      String(item.id_jenis_motor).includes(searchQuery)
  );

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem =
    indexOfLastItem - ITEMS_PER_PAGE;

  const currentData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    filteredData.length / ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout title="Jenis Motor">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Daftar Jenis Motor
        </h2>
        <p className="text-gray-600 mt-1">Data jenis motor untuk menginputkan jenis motor Vespa Matic</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Cari jenis motor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none w-60"
            />
          </div>

          {/* Button */}
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Tambah Jenis Motor
          </button>
        </div>
      </div>

      {/* Table */}
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
          <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">
                  ID
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">
                  Nama Motor
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500 border border-gray-200"
                  >
                    {searchQuery
                      ? `Tidak ada data yang cocok dengan "${searchQuery}"`
                      : 'Belum ada data jenis motor'}
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr
                    key={item.id_jenis_motor}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-200">
                      {indexOfFirstItem + currentData.indexOf(item) + 1}  {/* ← ganti di sini */}
                    </td>

                    <td className="px-6 py-4 text-sm text-center text-gray-900 border border-gray-200">
                      <div className="flex items-center gap-2">

                        {item.nama_motor}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-center border border-gray-200">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            handleOpenModal(item)
                          }
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(item)
                          }
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
            onClick={() =>
              setCurrentPage((prev) =>
                Math.max(prev - 1, 1)
              )
            }
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Sebelum
          </button>

          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((page) => (
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
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editMode
                ? 'Edit Jenis Motor'
                : 'Tambah Jenis Motor'}
            </h3>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
            >
              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Jenis Motor
                  </label>

                  <input
                    type="text"
                    value={selectedId ?? ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Motor{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formData.nama_motor}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      nama_motor: e.target.value,
                    });

                    setFormErrors((prev) => ({
                      ...prev,
                      nama_motor: undefined,
                    }));
                  }}
                  placeholder="Contoh: Primavera 150"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.nama_motor
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                />

                {formErrors.nama_motor && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {formErrors.nama_motor}
                  </p>
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

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hapus Jenis Motor?
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus{' '}
                <span className="font-medium text-gray-900">
                  {deletingNama}
                </span>
                ?
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