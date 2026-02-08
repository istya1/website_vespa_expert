// 'use client';
// import { useEffect, useState } from 'react';
// import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
// import DashboardLayout from '@/components/dashboard-layout';
// import VespaCareTemplateService, { VespaCareTemplate } from '@/services/vespa-care.service';
// import { JENIS_MOTOR } from '@/utils/constants';
// import toast from 'react-hot-toast';

// const JENIS_SERVICE_OPTIONS = ['Ganti Oli', 'Service Berkala'];

// export default function VespaCareTemplatePage() {
//   const [templateList, setTemplateList] = useState<VespaCareTemplate[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedTemplate, setSelectedTemplate] = useState<number>(0);

//   const [formData, setFormData] = useState<{
//     jenis_motor: 'Sprint' | 'LX' | 'Primavera';
//     jenis_service: 'Ganti Oli' | 'Service Berkala';
//     interval_km: number;
//     interval_hari: number;
//     deskripsi: string;
//     biaya_estimasi: string;
//   }>({
//     jenis_motor: 'Sprint',
//     jenis_service: 'Ganti Oli',
//     interval_km: 2000,
//     interval_hari: 90,
//     deskripsi: '',
//     biaya_estimasi: '',
//   });

//   useEffect(() => {
//     fetchTemplates();
//   }, []);

//   const fetchTemplates = async () => {
//   try {
//     setLoading(true);
//     const templates = await VespaCareTemplateService.getAll();
//     setTemplateList(templates); 
//   } catch (error) {
//     console.error('Error fetching templates:', error);
//     toast.error('Gagal memuat template service');
//   } finally {
//     setLoading(false);
//   }
// };


//   const handleOpenModal = (template?: VespaCareTemplate) => {
//     if (template) {
//       setEditMode(true);
//       setSelectedTemplate(template.id);
//       setFormData({
//         jenis_motor: template.jenis_motor,
//         jenis_service: template.jenis_service,
//         interval_km: template.interval_km,
//         interval_hari: template.interval_hari,
//         deskripsi: template.deskripsi || '',
//         biaya_estimasi: template.biaya_estimasi || '',
//       });
//     } else {
//       setEditMode(false);
//       setFormData({
//         jenis_motor: 'Sprint',
//         jenis_service: 'Ganti Oli',
//         interval_km: 2000,
//         interval_hari: 90,
//         deskripsi: '',
//         biaya_estimasi: '',
//       });
//     }
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setSelectedTemplate(0);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const loadingToast = toast.loading(editMode ? 'Mengupdate template...' : 'Menambahkan template...');
//     try {
//       if (editMode) {
//         await VespaCareTemplateService.update(selectedTemplate, formData);
//         toast.success('Template berhasil diupdate', { id: loadingToast });
//       } else {
//         await VespaCareTemplateService.create(formData);
//         toast.success('Template berhasil ditambahkan', { id: loadingToast });
//       }
//       handleCloseModal();
//       fetchTemplates();
//     } catch (error: any) {
//       toast.error(error.message || 'Terjadi kesalahan', { id: loadingToast });
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
//       const loadingToast = toast.loading('Menghapus template...');
//       try {
//         await VespaCareTemplateService.delete(id);
//         toast.success('Template berhasil dihapus', { id: loadingToast });
//         fetchTemplates();
//       } catch (error: any) {
//         toast.error(error.message || 'Gagal menghapus template', { id: loadingToast });
//       }
//     }
//   };

//   return (
//     <DashboardLayout title="Template Service">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800">Template Service Vespa Care</h2>
//           <p className="text-gray-600 mt-1">Kelola template pengingat service untuk user mobile</p>
//         </div>
//         <button
//           onClick={() => handleOpenModal()}
//           className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
//         >
//           <Plus size={20} />
//           Tambah Template
//         </button>
//       </div>

//       {loading ? (
//         <div className="flex flex-col justify-center items-center h-64 gap-3">
//           <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
//           <p className="text-sm text-gray-500">Memuat data...</p>
//         </div>
//       ) : (
//         <>
//           {/* Desktop Table */}
//           <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Motor</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Service</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval KM</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval Hari</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biaya Estimasi</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {templateList.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
//                       <Settings size={48} className="mx-auto mb-2 text-gray-300" />
//                       Tidak ada template service
//                     </td>
//                   </tr>
//                 ) : (
//                   templateList.map((template) => (
//                     <tr key={template.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.jenis_motor}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.jenis_service}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.interval_km} km</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.interval_hari} hari</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.biaya_estimasi || '-'}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex items-center gap-2">
//                           <button onClick={() => handleOpenModal(template)} className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors" title="Edit">
//                             <Pencil size={18} />
//                           </button>
//                           <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors" title="Hapus">
//                             <Trash2 size={18} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Mobile Card View */}
//           <div className="lg:hidden space-y-4">
//             {templateList.length === 0 ? (
//               <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
//                 <Settings size={48} className="mx-auto mb-2 text-gray-300" />
//                 Tidak ada template service
//               </div>
//             ) : (
//               templateList.map((template) => (
//                 <div key={template.id} className="bg-white rounded-lg shadow-md p-5">
//                   <div className="flex justify-between items-start mb-3">
//                     <div>
//                       <p className="font-semibold text-gray-900">{template.jenis_motor}</p>
//                       <p className="text-sm text-gray-600">{template.jenis_service}</p>
//                     </div>
//                     <div className="flex gap-2">
//                       <button onClick={() => handleOpenModal(template)} className="text-primary-600 p-1">
//                         <Pencil size={18} />
//                       </button>
//                       <button onClick={() => handleDelete(template.id)} className="text-red-600 p-1">
//                         <Trash2 size={18} />
//                       </button>
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <p className="text-gray-500">Interval KM</p>
//                       <p className="font-medium">{template.interval_km} km</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-500">Interval Hari</p>
//                       <p className="font-medium">{template.interval_hari} hari</p>
//                     </div>
//                     <div className="col-span-2">
//                       <p className="text-gray-500">Biaya Estimasi</p>
//                       <p className="font-medium">{template.biaya_estimasi || '-'}</p>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </>
//       )}

//       {/* Modal – Responsif */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <h3 className="text-xl font-bold mb-4">
//               {editMode ? 'Edit Template Service' : 'Tambah Template Service'}
//             </h3>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Motor <span className="text-red-500">*</span></label>
//                 <select
//                   value={formData.jenis_motor}
//                   onChange={(e) => setFormData({ ...formData, jenis_motor: e.target.value as any })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                   required
//                 >
//                   {JENIS_MOTOR.map((jenis) => (
//                     <option key={jenis} value={jenis}>{jenis}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Service <span className="text-red-500">*</span></label>
//                 <select
//                   value={formData.jenis_service}
//                   onChange={(e) => setFormData({ ...formData, jenis_service: e.target.value as any })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                   required
//                 >
//                   {JENIS_SERVICE_OPTIONS.map((jenis) => (
//                     <option key={jenis} value={jenis}>{jenis}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Interval KM <span className="text-red-500">*</span></label>
//                   <input
//                     type="number"
//                     value={formData.interval_km}
//                     onChange={(e) => setFormData({ ...formData, interval_km: parseInt(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                     required
//                     min="1"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Interval Hari <span className="text-red-500">*</span></label>
//                   <input
//                     type="number"
//                     value={formData.interval_hari}
//                     onChange={(e) => setFormData({ ...formData, interval_hari: parseInt(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                     required
//                     min="1"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Estimasi</label>
//                 <input
//                   type="text"
//                   value={formData.biaya_estimasi}
//                   onChange={(e) => setFormData({ ...formData, biaya_estimasi: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                   placeholder="Rp 50.000 - Rp 100.000"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
//                 <textarea
//                   value={formData.deskripsi}
//                   onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
//                   rows={3}
//                   placeholder="Deskripsi service..."
//                 />
//               </div>
//               <div className="flex gap-3 pt-4">
//                 <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
//                   {editMode ? 'Update' : 'Simpan'}
//                 </button>
//                 <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
//                   Batal
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </DashboardLayout>
//   );
// }