<?php

namespace App\Http\Controllers;

use App\Models\VespaPedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VespaPediaController extends Controller
{
    /**
     * Sanitize nama file untuk menghindari masalah keamanan dan kerapian
     * Menghapus spasi, karakter spesial, dan mengubah ke lowercase
     */
    private function sanitizeFilename(string $filename)
    {
        // Pisahkan nama file dan ekstensi
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $name      = pathinfo($filename, PATHINFO_FILENAME);

        // Hapus semua karakter selain huruf, angka, underscore, dan strip
        $name = preg_replace('/[^A-Za-z0-9_\-]/', '_', $name);
        
        // Ganti multiple underscore menjadi satu
        $name = preg_replace('/_+/', '_', $name);
        
        // Ubah ke huruf kecil
        $name = strtolower($name);

        return $name . '.' . $extension;
    }

    /**
     * Menampilkan daftar konten Vespa Pedia (untuk user / frontend)
     * Hanya menampilkan konten dengan status 'published'
     */
    public function index(Request $request)
    {
        try {
            $query = VespaPedia::query();

            // Filter hanya konten yang sudah dipublikasikan
            $query->where('status', 'published');

            // Filter berdasarkan jenis motor (opsional)
            if ($request->has('jenis_motor')) {
                $query->where('jenis_motor', $request->jenis_motor);
            }

            // Filter berdasarkan kategori (opsional)
            if ($request->has('kategori')) {
                $query->where('kategori', $request->kategori);
            }

            // Ambil data dengan urutan yang ditentukan
            $pedia = $query->orderBy('urutan')
                           ->orderBy('created_at', 'desc')
                           ->get();

            // Tambahkan full URL gambar untuk setiap item
            $pedia = $pedia->map(function ($item) {
                if ($item->gambar) {
                    $item->gambar_url = config('app.url') . '/uploads/vespa-pedia/' . $item->gambar;
                } else {
                    $item->gambar_url = null;
                }
                return $item;
            });

            return response()->json($pedia);

        } catch (\Exception $e) {
            Log::error('Error in VespaPedia index: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengambil data vespa pedia',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menyimpan konten Vespa Pedia baru (Create)
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'judul'       => 'required|max:255',
                'jenis_motor' => 'required|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
                'kategori'    => 'required|in:Pengenalan,Keunggulan,Spesifikasi,Tips',
                'konten'      => 'required',
                'gambar'      => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // max 2MB
                'urutan'      => 'nullable|integer|min:0',
                'status'      => 'nullable|in:draft,published',
            ]);

            $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);

            // Set nilai default
            $data['urutan'] = $data['urutan'] ?? 0;
            $data['status'] = $data['status'] ?? 'published';

            // Proses upload gambar jika ada
            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');

                // Sanitize nama file
                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename     = time() . '_' . $originalName;

                // Simpan file ke folder public/uploads/vespa-pedia
                $file->move(public_path('uploads/vespa-pedia'), $filename);

                $data['gambar'] = $filename;
            }

            $pedia = VespaPedia::create($data);

            // Tambahkan gambar_url jika ada gambar
            if ($pedia->gambar) {
                $pedia->gambar_url = url('uploads/vespa-pedia/' . $pedia->gambar);
            }

            return response()->json([
                'message' => 'Konten berhasil ditambahkan',
                'data'    => $pedia
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error in VespaPedia store: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal menambahkan konten',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menampilkan detail satu konten Vespa Pedia
     */
    public function show(int $id)
    {
        try {
            $pedia = VespaPedia::find($id);

            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }

            // Tambahkan full URL gambar
            if ($pedia->gambar) {
                $pedia->gambar_url = url('uploads/vespa-pedia/' . $pedia->gambar);
            }

            return response()->json($pedia);

        } catch (\Exception $e) {
            Log::error('Error in VespaPedia show: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengambil detail konten',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mengupdate konten Vespa Pedia
     */
    public function update(Request $request, int $id)
    {
        try {
            $pedia = VespaPedia::findOrFail($id);

            $request->validate([
                'judul'       => 'nullable|max:255',
                'jenis_motor' => 'nullable|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
                'kategori'    => 'nullable|in:Pengenalan,Keunggulan,Spesifikasi,Tips',
                'konten'      => 'nullable', // tambahkan jika ingin mewajibkan
                'gambar'      => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan'      => 'nullable|integer|min:0',
                'status'      => 'nullable|in:draft,published',
            ]);

            $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);

            // Proses upload gambar baru jika ada
            if ($request->hasFile('gambar')) {
                // Hapus gambar lama jika ada
                if ($pedia->gambar) {
                    Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
                }

                $file = $request->file('gambar');

                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename     = time() . '_' . $originalName;

                $file->move(public_path('uploads/vespa-pedia'), $filename);

                $data['gambar'] = $filename;
            }

            $pedia->update($data);

            // Tambahkan gambar_url setelah update
            if ($pedia->gambar) {
                $pedia->gambar_url = url('uploads/vespa-pedia/' . $pedia->gambar);
            }

            return response()->json([
                'message' => 'Konten berhasil diupdate',
                'data'    => $pedia
            ]);

        } catch (\Exception $e) {
            Log::error('Error in VespaPedia update: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengupdate konten',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menghapus konten Vespa Pedia beserta gambarnya
     */
    public function destroy(int $id)
    {
        try {
            $pedia = VespaPedia::find($id);

            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }

            // Hapus file gambar dari storage jika ada
            if ($pedia->gambar) {
                Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
            }

            $pedia->delete();

            return response()->json(['message' => 'Konten berhasil dihapus']);

        } catch (\Exception $e) {
            Log::error('Error in VespaPedia destroy: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal menghapus konten',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}