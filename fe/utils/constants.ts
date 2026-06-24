// src/utils/constants.ts
import { MenuItem } from '@/types';

// utils/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.expertvespa.cloud/api';

export const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '📊'
  },
  {
    name: 'Data Aturan',
    icon: '📋',
    submenu: [
      { name: 'Data Gejala', path: '/data-aturan/gejala', icon: '⚠️' },
      { name: 'Data Kerusakan', path: '/data-aturan/kerusakan', icon: '❌' }
    ]
  },
  {
    name: 'Master Data',
    icon: '💾',
    submenu: [
      { name: 'User', path: '/master-data/user', icon: '👤' },
    
    ]
  },
  {
    name: 'Riwayat',
    path: '/riwayat',
    icon: '🕐'
  }
];

export const JENIS_MOTOR = [
  'LX 125',
  'Primavera 150',
  'Primavera S 150',
  'Sprint 150',
  'Sprint S 150',
] as const;
export const ROLE_OPTIONS = ['admin', 'pengguna'] as const;