'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import UserService from '@/services/user-service';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function UserPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

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

  const filteredUsers = userList.filter((user) => {
    const search = searchQuery.toLowerCase();

    return (
      user.nama?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search) ||
      user.jenis_motor?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const roleBadge = (role: string) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${role === 'admin'
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
          <h2 className="text-2xl font-bold text-gray-900">
            Daftar Pengguna
          </h2>

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
              placeholder="Cari pengguna..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : userList.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Belum ada data pengguna
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 border-collapse">

                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 sm:px-6 border-r border-b border-gray-300"
                    >
                      Nama
                    </th>

                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700 md:px-4 border-r border-b border-gray-300"
                    >
                      Email
                    </th>

                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-700 border-r border-b border-gray-300"
                    >
                      Role
                    </th>

                    <th
                      scope="col"
                      className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-300"
                    >
                      Jenis Motor
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id_user}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 border-r border-b border-gray-300">
                        {user.nama || '—'}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 md:px-4 border-r border-b border-gray-300">
                        {user.email || '—'}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm border-r border-b border-gray-300">
                        {roleBadge(user.role)}
                      </td>

                      <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-600 border-b border-gray-300">
                        {user.jenis_motor || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>


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
          )}
        </div>
      </div>


    </DashboardLayout>
  );
}