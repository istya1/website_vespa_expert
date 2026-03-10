'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import UserService from '@/services/user-service';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [adminList, setAdminList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    alamat: '',
  });

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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;

    try {
      await UserService.delete(id);
      toast.success('Admin berhasil dihapus');
      fetchAdmins();
    } catch {
      toast.error('Gagal menghapus admin');
    }
  };

  const handleAddAdmin = async () => {
  try {

    await UserService.create({
      ...formData,
      role: 'admin'
    });

    toast.success('Admin berhasil ditambahkan');

    setShowModal(false);

    setFormData({
      nama: '',
      email: '',
      password: '',
      alamat: '',
    });

    fetchAdmins();

  } catch (error:any) {

    console.error("Tambah admin error:", error.response?.data);

    if (error.response?.data?.errors) {
      Object.values(error.response.data.errors).forEach((msg:any) => {
        toast.error(msg[0]);
      });
    } else {
      toast.error('Gagal menambah admin');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Admin</h2>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={18} />
            Tambah Admin
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Memuat data...
            </div>
          ) : adminList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Tidak ada data admin saat ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sm:px-6">
                      Nama
                    </th>

                    <th className="hidden md:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>

                    <th className="hidden sm:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700">
                      No HP
                    </th>

                    <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-700">
                      Alamat
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 sm:px-6">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {adminList.map((user) => (
                    <tr
                      key={user.id_user}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.nama}
                      </td>

                      <td className="hidden md:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {roleBadge(user.role)}
                      </td>

                      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.no_hp || '—'}
                      </td>

                      <td className="hidden lg:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.alamat || '—'}
                      </td>

                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-3">

                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(Number(user.id_user))
                            }
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
              Tambah Admin
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddAdmin();
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
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan nama admin"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan email admin"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>

                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan password"
                  required
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Masukkan alamat admin"
                  rows={3}
                  required
                />
              </div>

              {/* Button */}
              <div className="flex justify-end gap-3 pt-4">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </DashboardLayout >
  );
}