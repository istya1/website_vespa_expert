'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthService from '@/services/auth-service';

import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  XCircle,
  Database,
  Users,
  Wrench,
  Clock,
  ChevronDown,
  Smartphone,
  BookOpen,
  Settings,
  Activity,
  CalendarCheck,
  X,
  Menu,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path?: string;
  icon: any;
  role?: string;
  submenu?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Data Aturan',
    icon: FileText,
    submenu: [
      { name: 'Data Gejala', path: '/data-aturan/gejala', icon: AlertTriangle },
      { name: 'Data Kerusakan', path: '/data-aturan/kerusakan', icon: XCircle },
      { name: 'Aturan', path: '/data-aturan/aturan', icon: Settings },
    ],
  },
  {
    name: 'Master Data',
    icon: Database,
    submenu: [
      { name: 'User', path: '/master-data/user', icon: Users },
      {
        name: 'Admin',
        path: '/master-data/admin',
        icon: Wrench,
        role: 'superadmin', // hanya superadmin
      },
    ],
  },
  {
    name: 'Konten Mobile',
    icon: Smartphone,
    submenu: [
      { name: 'Vespa Pedia', path: '/konten-mobile/vespa-pedia', icon: BookOpen },
      { name: 'Vespa Care', path: '/konten-mobile/services-template', icon: Wrench },
    ],
  },
  {
    name: 'Riwayat',
    icon: Clock,
    submenu: [
      {
        name: 'Riwayat Diagnosa',
        path: '/riwayat/riwayat-diagnosa',
        icon: Activity,
      },
      {
        name: 'Riwayat Service Berkala',
        path: '/riwayat/riwayat-service',
        icon: CalendarCheck,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(['Data Aturan']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const user = AuthService.getUser();
    setRole(user?.role || null);
  }, []);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((item) => item !== menuName)
        : [...prev, menuName]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isActive = (path?: string) => path && pathname === path;

  const filterMenu = (items: MenuItem[]) => {
    return items
      .map((item) => {
        if (item.submenu) {
          const filteredSub = item.submenu.filter(
            (sub) => !sub.role || sub.role === role
          );

          return { ...item, submenu: filteredSub };
        }

        return item;
      })
      .filter((item) => !item.role || item.role === role);
  };

  const menuItems = filterMenu(MENU_ITEMS);

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus.includes(item.name);
    const Icon = item.icon;

    if (hasSubmenu) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-primary-100 rounded-lg transition-colors ${
              isOpen || item.submenu?.some((sub) => isActive(sub.path))
                ? 'bg-primary-50 text-primary-700'
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="ml-8 mt-1 mb-2 space-y-1">
              {item.submenu?.map((subItem) => {
                const SubIcon = subItem.icon;

                return (
                  <Link
                    key={subItem.path}
                    href={subItem.path || '#'}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                      isActive(subItem.path)
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-primary-50'
                    }`}
                  >
                    <SubIcon size={18} />
                    <span>{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path || '#'}
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
          isActive(item.path)
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-primary-50'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2.5 bg-primary-600 text-white rounded-lg md:hidden"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50
        w-72 bg-white border-r border-gray-200
        transform transition-transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
        flex flex-col
      `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b">
          <img src="/asset/logo.png" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-bold">Vespa</h1>
            <p className="text-sm text-gray-500">Expert</p>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>
        </div>
      </aside>
    </>
  );
}