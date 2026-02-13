// src/components/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Bell,
  Fuel,
  Gauge,
  Menu,
  X
} from 'lucide-react';

interface MenuItem {
  name: string;
  path?: string;
  icon: any;
  submenu?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Data Aturan',
    icon: FileText,
    submenu: [
      { name: 'Data Gejala', path: '/data-aturan/gejala', icon: AlertTriangle },
      { name: 'Data Kerusakan', path: '/data-aturan/kerusakan', icon: XCircle },
      { name: 'Data Solusi', path: '/data-aturan/solusi', icon: Fuel },
      { name: 'Aturan', path: '/data-aturan/aturan', icon: Settings },
      { name: ' Diagnosa', path: '/data-aturan/diagnosa', icon: Gauge }
    ]
  },
  {
    name: 'Master Data',
    icon: Database,
    submenu: [
      { name: 'User', path: '/master-data/user', icon: Users },
      { name: 'Admin', path: '/master-data/admin', icon: Wrench }
    ]
  },
  {
    name: 'Konten Mobile',
    icon: Smartphone,
    submenu: [
      { name: 'Vespa Pedia', path: '/konten-mobile/vespa-pedia', icon: BookOpen },
      // { name: 'Vespa Care', path: '/konten-mobile/vespa-care', icon: Settings },
      { name: 'Vespa Care', path: '/konten-mobile/services-template', icon: Wrench },
      // { name: 'Reminder Service User', path: '/konten-mobile/user-reminders', icon: Bell },
      
    ]
  },
  {
    name: 'Riwayat',
    path: '/riwayat',
    icon: Clock
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(['Data Aturan', 'Master Data']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((item) => item !== menuName)
        : [...prev, menuName]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isActive = (path?: string) => {
    return path && pathname === path;
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus.includes(item.name);
    const Icon = item.icon;

    if (hasSubmenu) {
      return (
        <div key={item.name} className="mb-2">
          <button
            onClick={() => toggleMenu(item.name)}
            className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-primary-50 rounded-lg transition-colors"
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
            <div className="ml-8 mt-2 space-y-1">
              {item.submenu?.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.path}
                    href={subItem.path || '#'}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
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
      {/* Hamburger Button - Visible on medium screens and below */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-lg shadow-lg md:hidden hover:bg-primary-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay - Visible when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static
          w-64 bg-primary-50 min-h-screen p-6 border-r border-primary-100
          z-40
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center mb-8 pb-6 border-b border-primary-200">
          <div className="w-20 h-16 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src="/asset/logo.png"
              alt="Vespa Expert Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Vespa</h1>
            <p className="text-sm text-gray-600">Expert</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  );
}