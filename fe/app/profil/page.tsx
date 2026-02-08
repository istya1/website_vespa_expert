'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Key, Save, X } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import AuthService from '@/services/auth-service';
import UserService from '@/services/user-service';
import { User as UserType } from '@/types';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  // Data untuk edit profil
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
  });

  // Data untuk ganti password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch data profil saat pertama kali load
  useEffect(() => {
    fetchProfile();
  }, []);

  // src/app/profil/page.tsx (bagian fetchProfile)
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getUser();

      console.log('📍 Current User from localStorage:', currentUser);

      if (!currentUser) {
        toast.error('Silakan login terlebih dahulu');
        window.location.href = '/login';
        return;
      }

      if (!currentUser.id_user) {
        console.error('❌ User missing id_user:', currentUser);
        toast.error('Data user tidak valid. Silakan login ulang.');
        AuthService.logout();
        window.location.href = '/login';
        return;
      }

      console.log('📍 Fetching user with ID:', currentUser.id_user);

      // Ambil data user terbaru dari API
      const userData = await UserService.getById(currentUser.id_user);

      console.log('✅ User data received:', userData);

      // ✅ VALIDASI: Pastikan userData tidak null/undefined
      if (!userData) {
        throw new Error('User data is empty');
      }

      setUser(userData);

      // Set form data dengan fallback
      setFormData({
        nama: userData.nama || '',
        email: userData.email || '',
        no_hp: userData.no_hp || '',
        alamat: userData.alamat || '',
      });

      // Set preview image jika ada foto
      if (userData.foto) {
        setPreviewImage(userData.foto);
      }

    } catch (error: any) {
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);

      const errorMessage = error.response?.data?.message || error.message || 'Gagal memuat profil';
      toast.error(errorMessage);

      // Jika error 401 atau 404, redirect ke login
      if (error.response?.status === 401 || error.response?.status === 404) {
        toast.error('Sesi login berakhir. Silakan login kembali.');
        AuthService.logout();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan gambar profil
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Hanya file gambar (JPEG, PNG, GIF) yang diperbolehkan');
      return;
    }

    setSelectedFile(file);

    // Buat preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle update profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    const loadingToast = toast.loading('Menyimpan perubahan...');

    try {
      const response = await UserService.update(user.id_user, {
        nama: formData.nama,
        alamat: formData.alamat,
      });

      if (!response.data) {
        throw new Error('Data user kosong dari server');
      }

      setUser(response.data);     // ✅ FIX
      localStorage.setItem('user', JSON.stringify(response.data));

      setEditMode(false);
      setSelectedFile(null);

      toast.success('Profil berhasil diperbarui', { id: loadingToast });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Gagal memperbarui profil',
        { id: loadingToast }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle ganti password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    const loadingToast = toast.loading('Mengubah password...');

    try {
      await UserService.changePassword(user.id_user, {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Password berhasil diubah', { id: loadingToast });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Gagal mengubah password',
        { id: loadingToast }
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Reset form ke data awal
  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        nama: user.nama || '',
        email: user.email || '',
        no_hp: user.no_hp || '',
        alamat: user.alamat || '',
      });
      setPreviewImage(user.foto || '');
      setSelectedFile(null);
    }
    setEditMode(false);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout title="Profil Saya">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data profil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Jika tidak ada user (belum login)
  if (!user) {
    return (
      <DashboardLayout title="Profil Saya">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Anda belum login</h3>
            <p className="text-gray-600 mb-6">Silakan login untuk mengakses profil Anda</p>
            <a
              href="/login"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Login Sekarang
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profil Saya">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-lg p-6 text-white">
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          <p className="opacity-90">Kelola informasi profil Anda</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-lg shadow-lg p-6 -mt-2">
          {/* Profile Info & Picture */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 pb-8 border-b">
            {/* Profile Picture */}
            <div className="flex flex-col items-center md:items-start">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={user.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {user.nama?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>

                {editMode && (
                  <>
                    <label className="absolute bottom-0 right-0 bg-white text-primary-600 p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Camera size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {selectedFile && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Foto baru dipilih
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{user.nama}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">No. HP</p>
                    <p className="font-medium">{user.no_hp || 'Belum diisi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Alamat</p>
                    <p className="font-medium">{user.alamat || 'Belum diisi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <User size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                        })
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {editMode ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User size={20} />
                Edit Profil
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Masukkan nama lengkap"
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    placeholder="nama@email.com"
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. HP
                  </label>
                  <input
                    type="tel"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    placeholder="081234567890"
                    disabled={isUpdating}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                    rows={3}
                    placeholder="Masukkan alamat lengkap"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                >
                  <User size={18} />
                  Edit Profil
                </button>
                <button
                  onClick={() => setChangePasswordMode(true)}
                  className="bg-gray-600 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Key size={18} />
                  Ubah Password
                </button>
              </div>
            </div>
          )}

          {/* Change Password Form */}
          {changePasswordMode && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Key size={20} />
                Ubah Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Lama <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                      placeholder="Masukkan password lama"
                      required
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      disabled={isChangingPassword}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                      placeholder="Ulangi password baru"
                      required
                      minLength={6}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Mengubah...
                      </>
                    ) : (
                      'Ubah Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    disabled={isChangingPassword}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Last Updated Info */}
          {user.updated_at && (
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-gray-500">
                Terakhir diperbarui: {new Date(user.updated_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}