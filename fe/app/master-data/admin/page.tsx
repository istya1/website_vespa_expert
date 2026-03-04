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
  // const [showModal, setShowModal] = useState(false);       // dikomen karena modal juga dikomen
  // const [editMode, setEditMode] = useState(false);
  // const [selectedUser, setSelectedUser] = useState<number | null>(null);
  // const [formData, setFormData] = useState<Partial<User>>({ ... });

  useEffect(() => {
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

  // Fungsi lain dikomen karena tombol & modal juga dikomen di kode asli
  // const handleOpenModal = ... 
  // const handleSubmit = ...
  // const handleDelete = ...

  const roleBadge = (role: string) => (
    <span
      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
        role === 'admin'
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
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Admin</h2>

          {/* Uncomment jika ingin mengaktifkan tombol tambah lagi */}
          {/* <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Admin
          </button> */}
        </div>

        {/* Table container */}
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
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 sm:px-6"
                    >
                      Nama
                    </th>
                    <th
                      scope="col"
                      className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-700"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-700"
                    >
                      No HP
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-700"
                    >
                      Alamat
                    </th>
                    {/* <th
                      scope="col"
                      className="relative px-4 py-3.5 sm:px-6"
                    >
                      <span className="sr-only">Aksi</span>
                    </th> */}
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

                      {/* Uncomment jika ingin mengaktifkan aksi edit & hapus */}
                      {/* <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id_user)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      
    </DashboardLayout>
  );
}