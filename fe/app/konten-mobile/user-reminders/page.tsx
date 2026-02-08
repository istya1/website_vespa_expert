// 'use client';
// import { useEffect, useState } from 'react';
// import { Bell, BellOff, User, Calendar, Gauge } from 'lucide-react';
// import DashboardLayout from '@/components/dashboard-layout';
// import UserServiceReminderService from '@/services/user-service-reminder-service';
// import { UserServiceReminder } from '@/types';
// import { JENIS_MOTOR } from '@/utils/constants';
// import toast from 'react-hot-toast';

// export default function UserRemindersPage() {
//   const [reminders, setReminders] = useState<UserServiceReminder[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150' | 'all'>('all');
//   const [filterStatus, setFilterStatus] = useState<'all' | 'aktif' | 'terlewat' | 'selesai'>('all');

//   useEffect(() => {
//     fetchReminders();
//   }, [activeTab, filterStatus]);

//   const fetchReminders = async () => {
//     try {
//       setLoading(true);
//       const params: any = {};
//       if (activeTab !== 'all') params.jenis_motor = activeTab;
//       if (filterStatus !== 'all') params.status = filterStatus;

//       const data = await UserServiceReminderService.getAll(params);
//       const transformedData = data.map(item => ({
//         ...item,
//         jenis_motor: item.jenis_motor as 'Primavera 150' | 'Primavera S 150' | 'LX 125' | 'Sprint 150' | 'Sprint S 150'
//       }));
//       setReminders(transformedData);
//     } catch (error) {
//       toast.error('Gagal memuat data reminder user');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendNotification = async (id: number) => {
//     if (confirm('Kirim notifikasi ke user ini?')) {
//       try {
//         await UserServiceReminderService.sendNotification(id);
//         toast.success('Notifikasi berhasil dikirim!');
//         fetchReminders();
//       } catch (error) {
//         toast.error('Gagal mengirim notifikasi');
//       }
//     }
//   };

//   const filtered = reminders.filter(r => 
//     activeTab === 'all' || r.jenis_motor === activeTab
//   ).filter(r => 
//     filterStatus === 'all' || r.status === filterStatus
//   );

//   return (
//     <DashboardLayout title="Reminder Service User">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-800 mb-2">Reminder Service User</h2>
//         <p className="text-gray-600">Pantau jadwal service setiap pengguna Vespa</p>
//       </div>

//       {/* Filter */}
//       <div className="flex flex-wrap gap-4 mb-6">
//         <div>
//           <label className="block text-sm font-medium mb-1">Filter Motor</label>
//           <select
//             value={activeTab}
//             onChange={(e) => setActiveTab(e.target.value as any)}
//             className="px-4 py-2 border rounded-lg"
//           >
//             <option value="all">Semua Motor</option>
//             {JENIS_MOTOR.map(m => <option key={m} value={m}>{m}</option>)}
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Filter Status</label>
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value as any)}
//             className="px-4 py-2 border rounded-lg"
//           >
//             <option value="all">Semua Status</option>
//             <option value="aktif">Aktif</option>
//             <option value="terlewat">Terlewat</option>
//             <option value="selesai">Selesai</option>
//           </select>
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center py-12">Memuat reminder user...</div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filtered.length === 0 ? (
//             <div className="col-span-full text-center py-12 text-gray-500">
//               Belum ada reminder user
//             </div>
//           ) : (
//             filtered.map((reminder) => (
//               <div key={reminder.id} className="bg-white rounded-xl shadow-lg p-6">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="font-semibold text-lg">{reminder.user?.nama || 'User #' + reminder.id_user}</p>
//                     <p className="text-sm text-gray-600">{reminder.user?.email || '-'}</p>
//                   </div>
//                   <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
//                     reminder.status === 'aktif' ? 'bg-blue-100 text-blue-800' :
//                     reminder.status === 'terlewat' ? 'bg-red-100 text-red-800' :
//                     'bg-green-100 text-green-800'
//                   }`}>
//                     {reminder.status}
//                   </span>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex items-center gap-2">
//                     <Gauge size={18} className="text-gray-600" />
//                     <span className="font-medium">{reminder.jenis_motor} - {reminder.jenis_service}</span>
//                   </div>
//                   <div className="text-sm text-gray-600 space-y-1">
//                     <p>Terakhir: {reminder.km_terakhir.toLocaleString()} km ({reminder.tanggal_terakhir})</p>
//                     <p className="font-medium text-primary-600">
//                       Berikutnya: {reminder.km_berikutnya.toLocaleString()} km ({reminder.tanggal_berikutnya})
//                     </p>
//                   </div>
//                 </div>

//                 <div className="mt-6 flex gap-3">
//                   {reminder.status === 'terlewat' && reminder.sudah_notif === 0 && (
//                     <button
//                       onClick={() => handleSendNotification(reminder.id)}
//                       className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
//                     >
//                       <Bell size={18} />
//                       Kirim Notif
//                     </button>
//                   )}
//                   {reminder.sudah_notif === 1 && (
//                     <button disabled className="flex-1 bg-gray-300 text-gray-600 py-2 rounded-lg flex items-center justify-center gap-2">
//                       <BellOff size={18} />
//                       Sudah Notif
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </DashboardLayout>
//   );
// }