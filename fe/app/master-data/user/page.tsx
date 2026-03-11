'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import UserService from '@/services/user-service';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function UserPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.get('pengguna');
      setUserList(data ?? []);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const roleBadge = (role: string) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
        role === 'admin'
          ? 'bg-red-100 text-red-800'
          : 'bg-emerald-100 text-emerald-800'
      }`}
    >
      {role === 'admin' ? 'Admin' : 'Pengguna'}
    </span>
  );

  return (
    <DashboardLayout title="Master Data Pengguna">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Pengguna</h2>

          {/* Uncomment jika ingin mengaktifkan tombol tambah */}
          {/* <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Pengguna
          </button> */}
        </div>

        {/* Table Container */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Memuat data pengguna...
            </div>
          ) : userList.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Belum ada data pengguna
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
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700 md:px-4"
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
                      Jenis Monitor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {userList.map((user) => (
                    <tr
                      key={user.id_user}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.nama || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 md:px-4">
                        {user.email || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {roleBadge(user.role)}
                      </td>
                      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {user.jenis_motor || '—'}
                      </td>

                      {/* Aksi (jika diaktifkan nanti) */}
                      {/* <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-indigo-600 hover:text-indigo-800">
                            <Pencil size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
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