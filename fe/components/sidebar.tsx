'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthService from '@/services/auth-service';

import {
  LayoutDashboard, FileText, AlertTriangle, XCircle,
  Database, Users, Wrench, Clock, ChevronDown,
  Smartphone, BookOpen, Settings, Activity,
  CalendarCheck, Motorbike,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path?: string;
  icon: any;
  role?: string;
  submenu?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Data Aturan', icon: FileText,
    submenu: [
      { name: 'Jenis Motor', path: '/data-aturan/jenis-montor', icon: Motorbike },
      { name: 'Kategori Kerusakan', path: '/data-aturan/kategori', icon: AlertTriangle },
      { name: 'Data Gejala', path: '/data-aturan/gejala', icon: AlertTriangle },
      { name: 'Data Kerusakan', path: '/data-aturan/kerusakan', icon: XCircle },
      { name: 'Aturan', path: '/data-aturan/aturan', icon: Settings },
    ],
  },
  {
    name: 'Manajemen Pengguna', icon: Users,
    submenu: [
      { name: 'User', path: '/master-data/user', icon: Users },
      { name: 'Admin', path: '/master-data/admin', icon: Wrench, role: 'superadmin' },
    ],
  },
  {
    name: 'Manajemen Konten', icon: Smartphone,
    submenu: [
      { name: 'Informasi Bengkel', path: '/konten-mobile/bengkel', icon: Database },
      { name: 'Informasi Vespa (Pedia)', path: '/konten-mobile/vespa-pedia', icon: BookOpen },
    ],
  },
  {
    name: 'Riwayat Aktifitas', icon: Clock,
    submenu: [
      { name: 'Riwayat Diagnosa', path: '/riwayat/riwayat-diagnosa', icon: Activity },
      { name: 'Riwayat Ganti Oli', path: '/riwayat/riwayat-service', icon: CalendarCheck },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    MENU_ITEMS.forEach(item => {
      if (
        item.submenu?.some(sub => pathname === sub.path)
      ) {
        setOpenMenus(prev =>
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [pathname]);

  // Tutup saat resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) onClose();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onClose]);

  // Lock scroll body saat sidebar mobile terbuka
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev =>
      prev.includes(menuName) ? prev.filter(i => i !== menuName) : [...prev, menuName]
    );
  };

  useEffect(() => {
  const user = AuthService.getUser();
  setRole(user?.role ?? null); // sesuaikan field-nya dengan tipe User kamu
}, []);

  const isActive = (path?: string) => path && pathname === path;

  const filterMenu = (items: MenuItem[]) =>
    items
      .map(item => {
        if (item.submenu) {
          return { ...item, submenu: item.submenu.filter(s => !s.role || s.role === role) };
        }
        return item;
      })
      .filter(item => !item.role || item.role === role);

  const menuItems = filterMenu(MENU_ITEMS);

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus.includes(item.name);
    const Icon = item.icon;
    const isParentActive = item.submenu?.some(sub => isActive(sub.path));

    if (hasSubmenu) {
      return (
        <div key={item.name} className="mb-0.5">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-150 ${isOpen || isParentActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <ChevronDown
              size={15}
              className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="ml-4 mt-1 mb-1 pl-4 border-l-2 border-gray-100 space-y-0.5">
              {item.submenu?.map(subItem => {
                const SubIcon = subItem.icon;
                const active = isActive(subItem.path);
                return (
                  <Link
                    key={subItem.path}
                    href={subItem.path || '#'}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                  >
                    <SubIcon size={16} className="flex-shrink-0" />
                    <span>{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path || '#'}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-0.5 text-sm transition-all duration-150 ${isActive(item.path)
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
          }`}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:sticky md:top-0 md:h-screen md:shadow-none
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 ">
        <img src="/asset/logo.png" className="w-16 h-16 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vespa Matic</h1>
          <p className="text-xs text-gray-400">Expert Sistem</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <nav className="space-y-0.5">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </aside>
  );
}