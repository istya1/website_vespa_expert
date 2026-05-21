'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import AuthService from '@/services/auth-service';
import { User as UserType } from '@/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const refreshUser = () => {
    const currentUser = AuthService.getUser();
    setUser(currentUser);
  };

  useEffect(() => {
    refreshUser();
    window.addEventListener('storage', refreshUser);
    window.addEventListener('userUpdated', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('userUpdated', refreshUser);
    };
  }, []);

  const confirmLogout = () => {
    AuthService.logout();
    setShowLogoutModal(false);
    router.push('/login');
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-[#600px]">
        <div className="flex items-center justify-between gap-3">

          {/* Kiri: hamburger (mobile) + judul */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-primary-600 truncate">{title}</h1>
          </div>

          {/* Kanan: profile dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 md:gap-3 hover:bg-gray-100 px-2 md:px-3 py-2 rounded-lg transition-colors"
            >
              {user?.foto ? (
                <img
                  src={user.foto.startsWith('http') ? user.foto : `${process.env.NEXT_PUBLIC_API_URL}/storage/${user.foto}`}
                  alt={user.nama}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user?.nama?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.nama || 'Username'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'}</p>
              </div>
              <ChevronDown
                size={15}
                className={`text-gray-500 transition-transform hidden sm:block ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-20">
                  <button
                    onClick={() => { router.push('/profil'); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <User size={15} />
                    Profil Saya
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setShowDropdown(false); setShowLogoutModal(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Logout dari Akun?</h3>
              <p className="text-sm text-gray-600 mb-6">Apakah Anda yakin ingin keluar dari akun ini?</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={15} />
                  Ya, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}