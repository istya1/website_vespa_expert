'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import UserService from '@/services/user-service';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [adminList, setAdminList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(false);
  // Tambah state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const itemsPerPage = 5;
  const validateForm = () => {
    const errors: FormErrors = {};

    // Nama
    if (!formData.nama.trim()) {
      errors.nama = 'Nama admin wajib diisi';
    } else if (formData.nama.trim().length < 3) {
      errors.nama = 'Nama admin minimal 3 karakter';
    }

    // Email
    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.email)) {
        errors.email = 'Format email tidak valid';
      }
    }

    // Password
    if (!editMode && !formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }

    // Alamat
    if (!formData.alamat.trim()) {
      errors.alamat = 'Alamat wajib diisi';
    } else if (formData.alamat.trim().length < 5) {
      errors.alamat = 'Alamat minimal 5 karakter';
    }

    return errors;
  };
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number>(0);
  const [deletingName, setDeletingName] = useState<string>('');
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    alamat: '',
  });

  interface FormErrors {
    nama?: string;
    email?: string;
    password?: string;
    alamat?: string;
  }
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role !== 'superadmin') {
      toast.error('Anda tidak memiliki akses');
      window.location.href = '/dashboard';
      return;
    }

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await UserService.get('admin');
      setAdminList(data ?? []);
    } catch {
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditMode(true);
    setFormData({
      nama: user.nama,
      email: user.email,
      password: '',
      alamat: user.alamat ?? '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditAdmin = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const loadingToast = toast.loading('Menyimpan perubahan...');
    try {
      await UserService.update(Number(editingUser!.id_user), {
        nama: formData.nama.trim(),
        alamat: formData.alamat.trim(),
        ...(formData.password ? { password: formData.password } : {}),
      });
      toast.success('Admin berhasil diperbarui', { id: loadingToast });
      setShowModal(false);
      setEditMode(false);
      setEditingUser(null);
      setFormData({ nama: '', email: '', password: '', alamat: '' });
      setFormErrors({});
      fetchAdmins();
    } catch {
      toast.error('Gagal memperbarui admin', { id: loadingToast });
    }
  };

  const filteredAdmins = adminList.filter((user) => {
    const search = searchQuery.toLowerCase();

    return (
      user.nama?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search) ||
      user.no_hp?.toLowerCase().includes(search) ||
      user.alamat?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setCurrentPage(page);
    }
  };

  const handleDelete = (id: number, nama: string) => {
    setDeletingId(id);
    setDeletingName(nama);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading('Menghapus admin...');
    try {
      await UserService.delete(deletingId);
      toast.success('Admin berhasil dihapus', { id: loadingToast });
      fetchAdmins();
    } catch {
      toast.error('Gagal menghapus admin', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(0);
      setDeletingName('');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(0);
    setDeletingName('');
  };

  const handleAddAdmin = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const loadingToast = toast.loading('Menyimpan admin...');
    try {
      await UserService.create({
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        password: formData.password,
        alamat: formData.alamat.trim(),
        role: 'admin',
      });

      toast.success('Admin berhasil ditambahkan', { id: loadingToast });
      setShowModal(false);
      setFormData({ nama: '', email: '', password: '', alamat: '' });
      setFormErrors({});
      fetchAdmins();

    } catch (error: any) {
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((msg: any) => {
          toast.error(msg[0]);
        });
        toast.dismiss(loadingToast);
      } else {
        toast.error('Gagal menambah admin', { id: loadingToast });
      }
    }
  };

  const roleBadge = (role: string) => (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${role === 'admin'
        ? 'bg-red-100 text-red-800'
        : 'bg-green-100 text-green-800'
        }`}
    >
      {role}
    </span>
  );

  return (
    <DashboardLayout title="Master Data Admin">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <h2 className="text-2xl font-bold text-gray-900">
            Daftar Admin
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

            <div className="relative w-full sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari admin..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              Tambah Admin
            </button>

          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : adminList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Tidak ada data admin saat ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 border-collapse">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6 border-r border-b border-gray-300">
                      Nama
                    </th>

                    <th className="hidden md:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700 border-r border-b border-gray-300">
                      Email
                    </th>

                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border-r border-b border-gray-300">
                      Role
                    </th>

                    {/* <th className="hidden sm:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700 border-r border-b border-gray-300">
              No HP
            </th> */}

                    <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700 border-r border-b border-gray-300">
                      Alamat
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6 border-b border-gray-300">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {paginatedAdmins.map((user) => (
                    <tr
                      key={user.id_user}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 border-r border-b border-gray-300">
                        {user.nama}
                      </td>

                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-r border-b border-gray-300">
                        {user.email}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm border-r border-b border-gray-300">
                        {roleBadge(user.role)}
                      </td>

                      {/* <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-r border-b border-gray-300">
                {user.no_hp || '—'}
              </td> */}

                      <td className="hidden lg:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500 border-r border-b border-gray-300">
                        {user.alamat || '—'}
                      </td>

                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 border-b border-gray-300">
                        <div className="flex items-center justify-start gap-3">

                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>


                          <button
                            onClick={() => handleDelete(Number(user.id_user), user.nama)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah / Edit Admin */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-screen overflow-y-auto">

            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Admin' : 'Tambah Admin'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editMode ? handleEditAdmin() : handleAddAdmin();
              }}
              className="space-y-4"
            >

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => {
                    setFormData({ ...formData, nama: e.target.value });
                    setFormErrors((prev) => ({ ...prev, nama: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.nama
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                  placeholder="Masukkan nama admin"
                />

                {formErrors.nama && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {formErrors.nama}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.email
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                  placeholder="Masukkan email admin"
                />

                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>

                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setFormErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.password
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                  placeholder="Masukkan password"
                />

                {formErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {formErrors.password}
                  </p>
                )}
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={formData.alamat}
                  onChange={(e) => {
                    setFormData({ ...formData, alamat: e.target.value });
                    setFormErrors((prev) => ({ ...prev, alamat: undefined }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.alamat
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                    }`}
                  placeholder="Masukkan alamat admin"
                  rows={3}
                />

                {formErrors.alamat && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠ {formErrors.alamat}
                  </p>
                )}
              </div>

              {/* Button */}
              <div className="flex justify-end gap-3 pt-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setEditingUser(null);
                    setFormData({ nama: '', email: '', password: '', alamat: '' });
                    setFormErrors({});
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Simpan
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">

              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Hapus admin ini?
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Anda akan menghapus
              </p>

              <div className="w-full bg-gray-50 rounded-lg px-4 py-3 mb-3 flex items-center gap-3">
                <UserCircle size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 text-left truncate">
                  {deletingName}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-5">
                Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} />
                  Ya, hapus
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-white">

                <p className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages || 1}
                </p>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight size={18} />
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout >
  );
}