'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import UserService from '@/services/user-service';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function UserPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    nama: '',
    email: '',
    password: '',
    role: 'pengguna',
    no_hp: '',
    alamat: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.get('pengguna');
      setUserList(data ?? []);
    } catch {
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditMode(true);
      setSelectedUser(user.id_user);
      setFormData({ ...user, password: '' });
    } else {
      setEditMode(false);
      setSelectedUser(null);
      setFormData({ nama: '', email: '', password: '', role: 'pengguna', no_hp: '', alamat: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editMode ? 'Mengupdate user...' : 'Menambahkan user...');
    try {
      if (editMode && selectedUser) {
        const { password, ...updateData } = formData;
        const dataToUpdate = password ? { ...updateData, password } : updateData;
        await UserService.update(selectedUser, dataToUpdate);
        toast.success('User berhasil diupdate', { id: toastId });
      } else {
        await UserService.create(formData);
        toast.success('User berhasil ditambahkan', { id: toastId });
      }
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan', { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    const toastId = toast.loading('Menghapus user...');
    try {
      await UserService.delete(id);
      toast.success('User berhasil dihapus', { id: toastId });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus user', { id: toastId });
    }
    
  };

    const roleBadge = (role: string) => (
    <span className={`px-2 py-1 text-sm rounded-full font-semibold ${role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
      {role}
    </span>
  );

  return (
    <DashboardLayout title="Master Data User">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Daftar User</h2>
        {/* <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah User
        </button> */}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {loading ? (
          <p className="text-center py-6 text-gray-500">Memuat data...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Nama', 'Email', 'Role', 'No HP', 'Alamat'].map((title) => (
                  <th key={title} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">Tidak ada data user</td>
                </tr>
              ) : (
                userList.map((user) => (
                  <tr key={user.id_user} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{user.nama}</td>
                    <td className="px-4 py-2">{user.email}</td>
                     <td className="px-4 py-2">{roleBadge(user.role)}</td>
                    <td className="px-4 py-2">{user.no_hp || '-'}</td>
                    <td className="px-4 py-2">{user.alamat || '-'}</td>
                    {/* <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id_user)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Hapus
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {/* {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit User' : 'Tambah User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="Nama"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required={!editMode}
              />
              <select
                value={formData.role || 'pengguna'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'pengguna' })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pengguna">Pengguna</option>
                <option value="admin">Admin</option>
              </select>
              <input
                placeholder="No HP"
                value={formData.no_hp || ''}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                placeholder="Alamat"
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-3 mt-2">
                <button type="submit" className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition">
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </DashboardLayout>
  );
}
