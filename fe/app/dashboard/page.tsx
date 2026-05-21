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
  const [recentAdmins, setRecentAdmins] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
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

        // ✅ Deklarasi sekali pakai let
        let totalGejala = 0;
        let totalKerusakan = 0;
        let monthlyStats: MonthlyUserStat[] = [];
        let totalPengguna = 0;
        let recentUsersData: any[] = [];

        try {
          const gejala = await GejalaService.getAll();
          totalGejala = gejala?.length || 0;
        } catch { }

        try {
          const kerusakan = await KerusakanService.getAll();
          totalKerusakan = kerusakan?.length || 0;
        } catch { }

        try {
          monthlyStats = await UserService.getMonthlyUserStats();
        } catch { }

        try {
          totalPengguna = await UserService.count();
        } catch { }

        try {
          recentUsersData = await UserService.getRecent(5);
        } catch { }

        setRecentUsers(recentUsersData);

        let statsData: Stat[] = [
          { title: 'Total Gejala', value: totalGejala, icon: AlertTriangle, color: 'border-yellow-500' },
          { title: 'Total Kerusakan', value: totalKerusakan, icon: XCircle, color: 'border-red-500' },
          { title: 'Total Pengguna', value: totalPengguna, icon: Users, color: 'border-emerald-500' },
        ];

        if (currentUser?.role === 'superadmin') {
          const [adminCount, adminsData] = await Promise.all([
            UserService.countByRole('admin'),
            UserService.getByRole('admin'),
          ]);
          setTotalAdmin(adminCount);
          setRecentAdmins(adminsData.slice(0, 5));
          statsData.push({
            title: 'Total Admin',
            value: adminCount,
            icon: Users,
            color: 'border-blue-500',
          });
        }

        setStats(statsData);

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

  const getUserLabel = (u: any) =>
    u?.name ?? u?.nama ?? u?.username ?? '—';

  const getUserInitial = (u: any) =>
    (u?.name ?? u?.nama ?? u?.username ?? u?.email ?? '??')
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <DashboardLayout title="...">
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={user?.role === 'superadmin' ? 'Dashboard Super Admin' : 'Dashboard Admin'}
    >
      <div className="space-y-8">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* GRAFIK + TABEL PENGGUNA TERBARU */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="mb-3 font-semibold">Pengguna Baru</h3>
            <div className="h-[300px]">
              <Bar data={userChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Pengguna Terdaftar Terbaru</h3>

              <a href="/master-data/user" className="text-sm text-blue-500 hover:underline">
                Lihat semua →
              </a>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">
                      Belum ada pengguna terdaftar
                    </td>
                  </tr>
                ) : recentUsers.map((u, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {getUserInitial(u)}
                        </div>
                        <span>{getUserLabel(u)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{u.email}</td>
                    <td className="py-2 text-gray-400 text-xs">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* SUPER ADMIN ONLY */}
        {user?.role === 'superadmin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="mb-3 font-semibold">Admin Baru</h3>
              <div className="h-[300px]">
                <Bar data={adminChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Daftar Admin Terdaftar</h3>
                <a href="/master-data/user" className="text-sm text-blue-500 hover:underline">
                  Lihat semua →
                </a>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-400">
                        Belum ada admin terdaftar
                      </td>
                    </tr>
                  ) : recentAdmins.map((admin, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {getUserInitial(admin)}
                          </div>
                          <span>{getUserLabel(admin)}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${admin.is_active !== false
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          {admin.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString('id-ID', {
                            month: 'short', year: 'numeric',
                          })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-4 rounded-xl shadow lg:col-span-2">
              <h3 className="font-semibold mb-4">Distribusi Pengguna</h3>
              <div className="space-y-4 max-w-md">
                {[
                  {
                    label: 'Pengguna biasa',
                    value: (stats.find(s => s.title === 'Total Pengguna')?.value ?? 0) - totalAdmin,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Admin',
                    value: totalAdmin,
                    color: 'bg-blue-500',
                  },
                ].map(({ label, value, color }) => {
                  const total = stats.find(s => s.title === 'Total Pengguna')?.value ?? 0;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="text-gray-400 text-xs">{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}