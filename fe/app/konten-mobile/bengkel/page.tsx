'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Upload, X, Store, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import BengkelService from '@/services/bengkel-service';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['draft', 'published'];
const ITEMS_PER_PAGE = 5;

function validateForm(formData: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.nama || formData.nama.trim() === '') {
    errors.nama = 'Nama bengkel wajib diisi.';
  } else if (formData.nama.trim().length < 3) {
    errors.nama = 'Nama bengkel minimal 3 karakter.';
  } else if (formData.nama.trim().length > 100) {
    errors.nama = 'Nama bengkel maksimal 100 karakter.';
  }

  if (formData.alamat && formData.alamat.length > 255) {
    errors.alamat = 'Alamat maksimal 255 karakter.';
  }

  if (formData.telepon) {
    const teleponRegex = /^[0-9+\-\s]+$/;
    if (!teleponRegex.test(formData.telepon)) {
      errors.telepon = 'Nomor telepon hanya boleh berisi angka, +, -, dan spasi.';
    } else if (formData.telepon.length < 6) {
      errors.telepon = 'Nomor telepon minimal 6 karakter.';
    } else if (formData.telepon.length > 20) {
      errors.telepon = 'Nomor telepon maksimal 20 karakter.';
    }
  }

  if (formData.website) {
    try {
      const url = new URL(formData.website);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.website = 'Format website tidak valid. Contoh: https://example.com';
      }
    } catch {
      errors.website = 'Format website tidak valid. Contoh: https://example.com';
    }
  }

  if (formData.rating) {
    const rating = parseFloat(formData.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.rating = 'Rating harus berupa angka antara 0 sampai 5.';
    }
  }

  if (formData.maps_link) {
    try {
      new URL(formData.maps_link);
    } catch {
      errors.maps_link = 'Format link Maps tidak valid.';
    }
  }

  // if (formData.urutan !== '' && formData.urutan < 0) {
  //   errors.urutan = 'Urutan tidak boleh kurang dari 0.';
  // }

  if (!formData.status) {
    errors.status = 'Status wajib dipilih.';
  }

  return errors;
}

export default function BengkelPage() {
  const [bengkelList, setBengkelList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    website: '',
    rating: '',
    jam_operasional: '',
    maps_link: '',
    deskripsi: '',
    // urutan: 0,
    status: 'published',
    gambar: [] as File[],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

 const fetchData = async () => {
  try {
    setLoading(true);

    const data = await BengkelService.getAll();

    const fixed = data.map((item: any) => ({
      ...item,
      gambar_url: (item.gambar_url || []).map((url: string) => {
        if (url.startsWith("http")) {
          return url;
        }

        return `/storage/${url}`;
      }),
    }));

    console.log("gambar_url setelah fix:", fixed[0]?.gambar_url);

    setBengkelList(fixed);

  } catch (error) {
    console.error(error);
    toast.error("Gagal memuat data bengkel");
  } finally {
    setLoading(false);
  }
};

  const filteredList = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return bengkelList;
    return bengkelList.filter(
      (b) =>
        b.nama?.toLowerCase().includes(query) ||
        b.alamat?.toLowerCase().includes(query) ||
        b.telepon?.toLowerCase().includes(query)
    );
  }, [bengkelList, searchQuery]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handleOpenModal = (item?: any) => {
    setFormErrors({});

    if (item) {
      setEditMode(true);
      setSelectedId(item.id);

      setCurrentImages(item.gambar_url || []);

      setFormData({
        ...item,
        gambar: [],
      });

    } else {

      setEditMode(false);
      setSelectedId(0);

      setCurrentImages([]);

      setFormData({
        nama: '',
        alamat: '',
        telepon: '',
        website: '',
        rating: '',
        jam_operasional: '',
        maps_link: '',
        deskripsi: '',
        // urutan: 0,
        status: 'published',
        gambar: [],
      });
    }

    setPreviewImages([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedId(0);

    setPreviewImages([]);
    setCurrentImages([]);

    setFormErrors({});
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    files.forEach((file) => {

      // Validasi ukuran
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} melebihi 2MB`);
        return;
      }

      // Validasi format
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} format tidak didukung`);
        return;
      }

      // Rename file
      const newFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w\s.-]/gi, '_')
        .toLowerCase();

      const renamedFile = new File(
        [file],
        newFileName,
        { type: file.type }
      );

      validFiles.push(renamedFile);

      // Preview image
      previewUrls.push(
        URL.createObjectURL(renamedFile)
      );
    });

    // TAMBAHKAN gambar baru TANPA menghapus gambar sebelumnya
    setFormData((prev) => ({
      ...prev,
      gambar: [...prev.gambar, ...validFiles],
    }));

    // TAMBAHKAN preview baru TANPA menghapus preview sebelumnya
    setPreviewImages((prev) => [
      ...prev,
      ...previewUrls
    ]);
  };

  const handleRemoveImage = (index: number) => {

    const updatedFiles = [...formData.gambar];
    updatedFiles.splice(index, 1);

    const updatedPreviews = [...previewImages];
    updatedPreviews.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      gambar: updatedFiles,
    }));

    setPreviewImages(updatedPreviews);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Mohon periksa kembali isian form.');
      return;
    }

    const loadingToast = toast.loading(
      editMode ? 'Mengupdate...' : 'Menambahkan...'
    );

    const data = new FormData();

    Object.entries(formData).forEach(([key, val]: any) => {

      if (key === 'gambar') {

        val.forEach((file: File) => {
          data.append('gambar[]', file);
        });

      } else {

        data.append(key, val);
      }
    });

    if (editMode) {
      data.append('_method', 'PUT');
    }

    try {

      if (editMode) {
        await BengkelService.update(selectedId, data);
      } else {
        await BengkelService.create(data);
      }

      toast.success(
        editMode
          ? 'Bengkel berhasil diperbarui'
          : 'Bengkel berhasil ditambahkan',
        { id: loadingToast }
      );

      handleCloseModal();

      fetchData();

    } catch (error: any) {

      toast.error(
        error.message || 'Terjadi kesalahan',
        { id: loadingToast }
      );
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const loadingToast = toast.loading('Menghapus bengkel...');
    try {
      await BengkelService.delete(deletingId);
      toast.success('Bengkel berhasil dihapus', { id: loadingToast });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus bengkel', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
      setDeletingId(0);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(0);
  };

  const FieldError = ({ field }: { field: string }) =>
    formErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">⚠ {formErrors[field]}</p>
    ) : null;

  return (
    <DashboardLayout title="Bengkel">

      {/* Header */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Informasi Bengkel</h2>
          <p className="text-gray-600 mt-1">Kelola informasi bengkel</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari judul atau status..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus size={18} /> Tambah Bengkel
          </button>

        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <img src="/asset/load.png" alt="Loading" className="w-44 h-28 animate-pulse" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full border border-gray-300 border-collapse">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Nama
                  </th>

                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Alamat
                  </th>

                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Gambar
                  </th>

                  {/* <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Status
                  </th>

                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b border-gray-300">
                    Urutan
                  </th> */}

                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500 border-b border-gray-300"
                    >
                      <Store size={48} className="mx-auto mb-2 text-gray-300" />
                      {searchQuery
                        ? `Tidak ada hasil untuk "${searchQuery}"`
                        : 'Belum ada data bengkel'}
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">

                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate border-r border-b border-gray-300">
                        {b.nama}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 max-w-xs truncate border-r border-b border-gray-300">
                        {b.alamat}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap border-r border-b border-gray-300">
                        {b.gambar_url ? (
                          <div className="flex gap-2 flex-wrap">
                            {(Array.isArray(b.gambar_url)
                              ? b.gambar_url
                              : [b.gambar_url]
                            ).map((url: string, i: number) => (
                              <img
                                key={i}
                                src={url}
                                alt={`${b.nama} ${i + 1}`}
                                className="h-32 w-48 object-cover border-4 border-white rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/480x320?text=Gambar+Gagal+Dimuat';
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="h-32 w-48 bg-gray-300 rounded-xl flex items-center justify-center text-gray-600 font-medium text-sm">
                            Tidak ada gambar
                          </div>
                        )}
                      </td>


                      {/* <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm border-r border-b border-gray-300">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${b.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r border-b border-gray-300">
                        {b.urutan}
                      </td> */}

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium border-b border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(b)}
                            className="text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded transition-colors"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedList.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                <Store size={48} className="mx-auto mb-2 text-gray-300" />
                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data bengkel'}
              </div>
            ) : (
              paginatedList.map((b) => (
                <div key={b.id} className="bg-white rounded-lg shadow-md p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{b.nama}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{b.alamat}</p>
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      <button onClick={() => handleOpenModal(b)} className="text-primary-600 p-1 hover:bg-primary-50 rounded transition-colors">
                        <Pencil size={17} />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-600 p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  {b.gambar_url && (
                    <img
                      src={
                        Array.isArray(b.gambar_url)
                          ? b.gambar_url[0]
                          : b.gambar_url
                      }
                      alt={b.nama}
                      className="w-full h-48 object-cover rounded-lg mt-2"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image';
                      }}
                    />
                  )}
                  <div className="flex justify-between items-center text-sm mt-3">
                    {/* <span className={`px-2 py-1 text-xs font-semibold rounded-full ${b.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {b.status}
                    </span> */}
                    {/* <span className="text-gray-500">Urutan: {b.urutan}</span> */}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm ${page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editMode ? 'Edit Bengkel' : 'Tambah Bengkel'}
            </h3>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bengkel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => handleFieldChange('nama', e.target.value)}
                  placeholder="Masukkan nama bengkel"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.nama ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldError field="nama" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => handleFieldChange('alamat', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.alamat ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows={2}
                />
                <FieldError field="alamat" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => handleFieldChange('telepon', e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.telepon ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldError field="telepon" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.website ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldError field="website" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <input
                  type="text"
                  value={formData.rating}
                  onChange={(e) => handleFieldChange('rating', e.target.value)}
                  placeholder="Contoh: 4.5"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.rating ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldError field="rating" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
                <input
                  type="text"
                  value={formData.jam_operasional}
                  onChange={(e) => handleFieldChange('jam_operasional', e.target.value)}
                  placeholder="Contoh: 08.00 - 17.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Maps</label>
                <input
                  type="text"
                  value={formData.maps_link}
                  onChange={(e) => handleFieldChange('maps_link', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.maps_link ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldError field="maps_link" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => handleFieldChange('deskripsi', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={4}
                />
              </div>

              {/* Upload Gambar */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gambar
                </label>

                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">

                  <div className="space-y-1 text-center">

                    <Upload className="mx-auto h-12 w-12 text-gray-400" />

                    <div className="flex text-sm text-gray-600 justify-center">

                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                      >

                        <span>Unggah file</span>

                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                        />

                      </label>

                      <p className="pl-1">atau sentuh atau tarik</p>

                    </div>

                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP hingga 2MB
                    </p>

                  </div>
                </div>

                {/* Preview gambar baru */}
                {previewImages.length > 0 && (

                  <div className="grid grid-cols-2 gap-3 mt-4">

                    {previewImages.map((img, index) => (

                      <div
                        key={index}
                        className="relative"
                      >

                        <img
                          src={img}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <X size={14} />
                        </button>

                      </div>
                    ))}

                  </div>
                )}

                {/* Gambar lama */}
                {currentImages.length > 0 && (

                  <div className="grid grid-cols-2 gap-3 mt-4">

                    {currentImages.map((img: string, index: number) => (

                      <img
                        key={index}
                        src={img}
                        alt={`Current ${index}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}

                  </div>
                )}

              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => handleFieldChange('urutan', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.urutan ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    min="0"
                  />
                  <FieldError field="urutan" />
                </div> */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${formErrors.status ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError field="status" />
                </div> */}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  {editMode ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Bengkel Ini?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus bengkel ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}