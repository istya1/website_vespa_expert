'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle, XCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import DashboardLayout from '@/components/dashboard-layout';
import StatCard from '@/components/stat-card';
import GejalaService from '@/services/gejala-service';
import KerusakanService from '@/services/kerusakan-service';
import UserService from '@/services/user-service';
import AuthService from '@/services/auth-service';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Stat {
  title: string;
  value: number;
  icon: any;
  color: string;
}

interface MonthlyUserStat {
  month: string;
  userCount: number;
  adminCount: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [totalAdmin, setTotalAdmin] = useState(0);

  const [userChartData, setUserChartData] = useState<any>({ labels: [], datasets: [] });
  const [adminChartData, setAdminChartData] = useState<any>({ labels: [], datasets: [] });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const isAuth = await AuthService.requireAuth();
      if (!isAuth) {
        router.replace('/login');
        return;
      }

      try {
        const currentUser = await AuthService.getUser();
        setUser(currentUser);

        const [totalGejala, totalKerusakan, monthlyStats, totalPengguna] = await Promise.all([
          GejalaService.count?.() ?? GejalaService.getAll().then(res => res.length),
          KerusakanService.count?.() ?? KerusakanService.getAll().then(res => res.length),
          UserService.getMonthlyUserStats?.() ?? [],
          UserService.getAll?.().then(res => res.length) ?? 0,
        ]);

        let statsData: Stat[] = [
          { title: 'Total Gejala', value: totalGejala, icon: AlertTriangle, color: 'border-yellow-500' },
          { title: 'Total Kerusakan', value: totalKerusakan, icon: XCircle, color: 'border-red-500' },
          { title: 'Total Pengguna', value: totalPengguna, icon: Users, color: 'border-emerald-500' },
        ];

        // 🔥 SUPER ADMIN TAMBAHAN
        if (currentUser?.role === 'superadmin') {
          const adminCount = await UserService.countByRole?.('admin') ?? 0;
          setTotalAdmin(adminCount);

          statsData.push({
            title: 'Total Admin',
            value: adminCount,
            icon: Users,
            color: 'border-blue-500',
          });
        }

        setStats(statsData);

        // 🔥 CHART
        if (monthlyStats.length > 0) {
          const months = monthlyStats.map((s: MonthlyUserStat) => s.month);

          setUserChartData({
            labels: months,
            datasets: [{
              label: 'Pengguna Baru',
              data: monthlyStats.map((s: MonthlyUserStat) => s.userCount),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
            }],
          });

          setAdminChartData({
            labels: months,
            datasets: [{
              label: 'Admin Baru',
              data: monthlyStats.map((s: MonthlyUserStat) => s.adminCount),
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
            }],
          });
        }

      } catch (err: any) {
        console.error(err);
        AuthService.logout();
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // 🔥 LOADING
  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={user?.role === 'superadmin' ? 'Dashboard Super Admin' : 'Dashboard Admin'}
    >
      <div className="space-y-8">

        {/* 🔹 STAT */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* 🔹 CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* USER */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="mb-3 font-semibold">Pengguna Baru</h3>
            <div className="h-[300px]">
              <Bar data={userChartData} options={chartOptions} />
            </div>
          </div>

          {/* 🔥 ADMIN (SUPER ADMIN ONLY) */}
          {user?.role === 'superadmin' && (
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="mb-3 font-semibold">Admin Baru</h3>
              <div className="h-[300px]">
                <Bar data={adminChartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* 🔥 SUPER ADMIN SECTION */}
        {/* {user?.role === 'superadmin' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-2">System Control</h2>
            <p className="text-gray-500 text-sm mb-4">
              Anda memiliki akses penuh untuk mengelola sistem dan admin.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <p className="text-sm text-gray-400">Manajemen Admin</p>
                <p className="font-semibold">Tambah / Hapus Admin</p>
              </div>

              <div className="border p-4 rounded-lg">
                <p className="text-sm text-gray-400">Monitoring Sistem</p>
                <p className="font-semibold">Statistik & Aktivitas</p>
              </div>
            </div>
          </div>
        )} */}

      </div>
    </DashboardLayout>
  );
}