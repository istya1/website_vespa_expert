'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Key, Save, X, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import AuthService from '@/services/auth-service';
import UserService from '@/services/user-service';
import { User as UserType } from '@/types';
import toast from 'react-hot-toast';

// ── Helpers validasi ──────────────────────────────────────────────
const validateProfile = (data: { nama: string; email: string; no_hp: string; alamat: string }) => {
  if (!data.nama.trim()) return 'Nama lengkap wajib diisi';
  if (data.nama.trim().length < 3) return 'Nama minimal 3 karakter';
  if (!data.email.trim()) return 'Email wajib diisi';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Format email tidak valid';
  if (data.no_hp && !/^(\+62|0)[0-9]{8,13}$/.test(data.no_hp.replace(/\s/g, '')))
    return 'Format nomor HP tidak valid (contoh: 081234567890)';
  return null;
};

const validatePassword = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
  if (!data.currentPassword) return 'Password lama wajib diisi';
  if (!data.newPassword) return 'Password baru wajib diisi';
  if (data.newPassword.length < 6) return 'Password baru minimal 6 karakter';
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(data.newPassword))
    return 'Password baru harus mengandung huruf dan angka';
  if (data.newPassword !== data.confirmPassword) return 'Konfirmasi password tidak cocok';
  if (data.currentPassword === data.newPassword) return 'Password baru tidak boleh sama dengan password lama';
  return null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  const [formData, setFormData] = useState({ nama: '', email: '', no_hp: '', alamat: '' });
  const [formErrors, setFormErrors] = useState<Partial<typeof formData>>({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false, new: false, confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<typeof passwordData>>({});

  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => { fetchProfile(); }, []);

  // Ganti fungsi getPhotoUrl dengan ini:
  const getPhotoUrl = (foto?: string) => {
    if (!foto) return '';

    // Jika sudah full URL
    if (foto.startsWith('http')) {
      return foto;
    }

    // Bersihkan path
    let path = foto.startsWith('/') ? foto.substring(1) : foto;

    // Pastikan ada folder storage
    if (!path.startsWith('storage/')) {
      path = `storage/${path}`;
    }

    // PAKAI PROXY Next.js (paling stabil untuk ngrok)
    return `/storage/${path.replace('storage/', '')}`;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getUser();
      if (!currentUser?.id_user) {
        toast.error('Silakan login terlebih dahulu');
        window.location.href = '/login';
        return;
      }

      const userData = await UserService.getById(Number(currentUser.id_user));
      if (!userData) throw new Error('Data user kosong');

      setUser(userData);
      setFormData({
        nama: userData.nama || '',
        email: userData.email || '',
        no_hp: userData.no_hp || '',
        alamat: userData.alamat || '',
      });
      if (userData.foto) setPreviewImage(getPhotoUrl(userData.foto));

    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal memuat profil';
      toast.error(msg);
      if ([401, 404].includes(error.response?.status)) {
        AuthService.logout();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Validasi per-field real-time ──────────────────────────────
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // hapus error field ini saat user mulai mengetik
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) setPasswordErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran file maksimal 2MB'); return; }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Hanya file gambar (JPEG, PNG, GIF) yang diperbolehkan');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Update profil ─────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const error = validateProfile(formData);

    if (error) {
      toast.error(error);
      return;
    }

    setIsUpdating(true);

    const loadingToast = toast.loading('Menyimpan perubahan...');

    try {
      // update data profil
      await UserService.update(Number(user.id_user), {
        nama: formData.nama.trim(),
        alamat: formData.alamat.trim(),
        no_hp: formData.no_hp.trim(),
      });

      // upload foto jika ada
      if (selectedFile) {
        await UserService.uploadPhoto(
          Number(user.id_user),
          selectedFile
        );
      }

      // 🔥 ambil ulang data terbaru dari database
      const freshUser = await UserService.getById(
        Number(user.id_user)
      );

      // validasi agar tidak null
      if (!freshUser) {
        throw new Error('Gagal memuat data user terbaru');
      }

      // update state halaman profil
      setUser(freshUser);

      // update localStorage untuk header
      localStorage.setItem(
        'user',
        JSON.stringify(freshUser)
      );

      // refresh header realtime
      window.dispatchEvent(
        new Event('userUpdated')
      );

      // update foto preview
      if (freshUser.foto) {
        setPreviewImage(
          getPhotoUrl(freshUser.foto)
        );
      }

      // reset state
      setEditMode(false);
      setSelectedFile(null);
      setFormErrors({});

      toast.success(
        'Profil berhasil diperbarui',
        { id: loadingToast }
      );

    } catch (error: any) {

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Gagal memperbarui profil',
        { id: loadingToast }
      );

    } finally {
      setIsUpdating(false);
    }
  };

  // ── Ganti password ────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const error = validatePassword(passwordData);
    if (error) { toast.error(error); return; }

    setIsChangingPassword(true);
    const loadingToast = toast.loading('Mengubah password...');

    try {
      await UserService.changePassword(Number(user.id_user), {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setChangePasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      toast.success('Password berhasil diubah', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password', { id: loadingToast });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        nama: user.nama || '',
        email: user.email || '',
        no_hp: user.no_hp || '',
        alamat: user.alamat || '',
      });
      // ✅ Fix: gunakan getPhotoUrl agar preview tidak hilang
      setPreviewImage(user.foto ? getPhotoUrl(user.foto) : '');
      setSelectedFile(null);
      setFormErrors({});
    }
    setEditMode(false);
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout title="Profil Saya">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="Profil Saya">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={36} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Anda belum login</h3>
            <p className="text-gray-500 mb-6">Silakan login untuk mengakses profil Anda</p>
            <a href="/login" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
              Login Sekarang
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profil Saya">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-xl p-5 sm:p-8 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Profil Saya</h1>
          <p className="text-sm opacity-80 mt-1">Kelola informasi profil Anda</p>
        </div>

        {/* Card utama */}
        <div className="bg-white rounded-b-xl shadow-lg p-5 sm:p-8">

          {/* ── Foto + Info ── */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gray-100">
            {/* Foto */}
            <div className="flex flex-col items-center sm:items-start shrink-0">
              <div className="relative mb-3">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={user.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load failed:', previewImage);
                        // Fallback ke avatar huruf
                        e.currentTarget.style.display = 'none';
                        // Atau bisa pakai ini jika mau pakai div avatar
                        // e.currentTarget.src = '';
                      }}
                      referrerPolicy="no-referrer"
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
                  <label className="absolute bottom-0 right-0 bg-white text-primary-600 p-2 rounded-full shadow cursor-pointer hover:bg-gray-50">
                    <Camera size={18} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              {editMode && selectedFile && (
                <p className="text-xs text-green-600 font-medium">✓ Foto baru dipilih</p>
              )}
              <span className="mt-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>

            {/* Info grid */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{user.nama}</h2>
              <p className="text-gray-500 text-sm mb-4">{user.email}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: 'No. HP', value: user.no_hp },
                  { icon: MapPin, label: 'Alamat', value: user.alamat },
                  { icon: Mail, label: 'Email', value: user.email },
                  {
                    icon: User, label: 'Bergabung', value: user.created_at
                      ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
                      : '-'
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 text-gray-700">
                    <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium truncate">{value || 'Belum diisi'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tombol aksi / Form edit ── */}
          {editMode ? (
            <form onSubmit={handleUpdateProfile} noValidate className="space-y-5 mb-8">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <User size={18} /> Edit Profil
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={e => handleFormChange('nama', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-400 ${formErrors.nama ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Masukkan nama lengkap"
                    disabled={isUpdating}
                  />
                  {formErrors.nama && <p className="text-xs text-red-500 mt-1">{formErrors.nama}</p>}
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                  <input
                    type="tel"
                    value={formData.no_hp}
                    onChange={e => handleFormChange('no_hp', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-400 ${formErrors.no_hp ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="081234567890"
                    disabled={isUpdating}
                  />
                  {formErrors.no_hp && <p className="text-xs text-red-500 mt-1">{formErrors.no_hp}</p>}
                </div>

                {/* Alamat */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={e => handleFormChange('alamat', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    rows={3}
                    placeholder="Masukkan alamat lengkap"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Menyimpan...</>
                    : <><Save size={16} /> Simpan Perubahan</>
                  }
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X size={16} /> Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => setEditMode(true)}
                className="bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <User size={16} /> Edit Profil
              </button>
              {/* <button
                onClick={() => setChangePasswordMode(prev => !prev)}
                className="bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Key size={16} /> Ubah Password
              </button> */}

            </div>
          )}

          {/* ── Form ganti password ── */}
          {changePasswordMode && !editMode && (
            <div className="mt-4 pt-6 border-t border-gray-100">
              <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Key size={18} /> Ubah Password
              </h3>

              <form onSubmit={handleChangePassword} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password lama */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Lama <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 ${passwordErrors.currentPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Masukkan password lama"
                        disabled={isChangingPassword}
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>}
                  </div>

                  {/* Password baru */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={e => handlePasswordChange('newPassword', e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 ${passwordErrors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Min. 6 karakter + angka"
                        disabled={isChangingPassword}
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>}
                  </div>

                  {/* Konfirmasi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Password Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 ${passwordErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Ulangi password baru"
                        disabled={isChangingPassword}
                      />
                      <button type="button" onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isChangingPassword
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Mengubah...</>
                      : <><Key size={16} /> Ubah Password</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordErrors({});
                    }}
                    disabled={isChangingPassword}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <X size={16} /> Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Terakhir diperbarui */}
          {user.updated_at && (
            <div className="mt-8 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Terakhir diperbarui:{' '}
                {new Date(user.updated_at).toLocaleDateString('id-ID', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}