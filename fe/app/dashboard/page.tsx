'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle, XCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import DashboardLayout from '@/components/dashboard-layout';
import StatCard from '@/components/stat-card';
import GejalaService from '@/services/gejala-service';
import KerusakanService from '@/services/kerusakan-service';
import DiagnosaService from '@/services/diagnosa-service';
import AuthService from '@/services/auth-service';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Stat {
  title: string;
  value: number;
  icon: any;
  color: string;
}

interface MonthlyStat {
  month: string;
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([
    { title: 'Total Gejala', value: 0, icon: AlertTriangle, color: 'border-yellow-500' },
    { title: 'Total Kerusakan', value: 0, icon: XCircle, color: 'border-red-500' },
    { title: 'Total Diagnosa', value: 0, icon: Users, color: 'border-blue-500' },
  ]);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: 'Jumlah Diagnosa',
        data: [],
        borderColor: 'rgb(0, 102, 255)',
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        tension: 0.4,
        fill: true,
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
        const [totalGejala, totalKerusakan, monthlyStats] = await Promise.all([
          GejalaService.count
            ? GejalaService.count()
            : GejalaService.getAll().then((res) => res.length),
          KerusakanService.count
            ? KerusakanService.count()
            : KerusakanService.getAll().then((res) => res.length),
          DiagnosaService.getMonthlyStats ? DiagnosaService.getMonthlyStats() : [],
        ]);

        const totalDiagnosa = monthlyStats.reduce(
          (sum: number, stat: MonthlyStat) => sum + stat.count,
          0
        );

        setStats([
          { title: 'Total Gejala', value: totalGejala, icon: AlertTriangle, color: 'border-yellow-500' },
          { title: 'Total Kerusakan', value: totalKerusakan, icon: XCircle, color: 'border-red-500' },
          { title: 'Total Diagnosa', value: totalDiagnosa, icon: Users, color: 'border-blue-500' },
        ]);

        if (monthlyStats.length > 0) {
          setChartData({
            labels: monthlyStats.map((stat: MonthlyStat) => stat.month),
            datasets: [
              {
                label: 'Jumlah Diagnosa',
                data: monthlyStats.map((stat: MonthlyStat) => stat.count),
                borderColor: 'rgb(0, 102, 255)',
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                tension: 0.4,
                fill: true,
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
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Statistik Diagnosa Bulanan',
        font: { size: 16, weight: 'bold' as const },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Admin">
        <div className="flex flex-col justify-center items-center h-screen gap-3">
          <img
            src="/asset/load.png"
            alt="Loading"
            className="w-32 sm:w-40 md:w-44 h-20 sm:h-24 md:h-28 animate-pulse"
          />
          <p className="text-sm sm:text-base md:text-lg text-gray-500">Memuat data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Admin">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
        <div className="relative w-full h-64 sm:h-80 md:h-96">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </DashboardLayout>
  );
}