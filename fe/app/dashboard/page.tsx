'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle, XCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,       // pastikan ini diimport
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const [stats, setStats] = useState<Stat[]>([
    { title: 'Total Gejala', value: 0, icon: AlertTriangle, color: 'border-yellow-500' },
    { title: 'Total Kerusakan', value: 0, icon: XCircle, color: 'border-red-500' },
    { title: 'Total Pengguna', value: 0, icon: Users, color: 'border-emerald-500' },
  ]);

  const [userChartData, setUserChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: 'Pengguna Baru',
        data: [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // hijau toska
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  });

  const [adminChartData, setAdminChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: 'Admin Baru',
        data: [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // merah
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      setLoading(true);
      const isAuth = await AuthService.requireAuth();
      if (!isAuth) {
        router.replace('/login');
        return;
      }

      try {
        const [totalGejala, totalKerusakan, monthlyUserStats, totalPengguna] = await Promise.all([
          GejalaService.count?.() ?? GejalaService.getAll().then((res) => res.length),
          KerusakanService.count?.() ?? KerusakanService.getAll().then((res) => res.length),
          UserService.getMonthlyUserStats?.() ?? Promise.resolve([]),  // optional chaining aman
          await UserService.getAll?.()
            ? UserService.getAll().then((res) => res.length ?? 0)
            : Promise.resolve(0),
        ]);

        setStats([
          { title: 'Total Gejala', value: totalGejala, icon: AlertTriangle, color: 'border-yellow-500' },
          { title: 'Total Kerusakan', value: totalKerusakan, icon: XCircle, color: 'border-red-500' },
          { title: 'Total Pengguna', value: totalPengguna, icon: Users, color: 'border-emerald-500' },
        ]);

        if (monthlyUserStats.length > 0) {
          const months = monthlyUserStats.map((stat: MonthlyUserStat) => stat.month);

          setUserChartData({
            labels: months,
            datasets: [
              {
                label: 'Pengguna Baru',
                data: monthlyUserStats.map((stat: MonthlyUserStat) => stat.userCount),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
              },
            ],
          });

          setAdminChartData({
            labels: months,
            datasets: [
              {
                label: 'Admin Baru',
                data: monthlyUserStats.map((stat: MonthlyUserStat) => stat.adminCount),
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1,
              },
            ],
          });
        }

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          AuthService.logout();
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

 const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { font: { size: 13 } },
    },
    title: {
      display: true,
      font: { size: 15, weight: 'bold' as const },
      padding: { top: 10, bottom: 12 },
    },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, font: { size: 11 } },
      grid: { color: 'rgba(0,0,0,0.04)' },
    },
  },
};

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Admin">
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
          <img
            src="/asset/load.png"
            alt="Loading"
            className="w-28 sm:w-36 md:w-44 h-auto animate-pulse"
          />
          <p className="text-base sm:text-lg md:text-xl text-gray-500 font-medium">
            Memuat data dashboard...
          </p>
        </div>
      </DashboardLayout>
    );
  }

 return (
  <DashboardLayout title="Dashboard Admin">
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Dua Chart Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Chart Pengguna (kiri) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="w-full aspect-[4/3] md:aspect-[5/3] max-h-[420px]">
            <Bar
              data={userChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { ...chartOptions.plugins.title, text: 'Pengguna Baru per Bulan' },
                },
              }}
            />
          </div>
        </div>

        {/* Chart Admin (kanan) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="w-full aspect-[4/3] md:aspect-[5/3] max-h-[420px]">
            <Bar
              data={adminChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { ...chartOptions.plugins.title, text: 'Admin Baru per Bulan' },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);
}