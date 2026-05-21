<?php

namespace App\Http\Controllers;

use App\Models\VespaPedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class VespaPediaController extends Controller
{
    /**
     * Sanitize nama file
     */
    private function sanitizeFilename(string $filename)
    {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $name      = pathinfo($filename, PATHINFO_FILENAME);
        $name = preg_replace('/[^A-Za-z0-9_\-]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);
        $name = strtolower($name);
        return $name . '.' . $extension;
    }

    /**
     * Menampilkan daftar konten Vespa Pedia (Frontend)
     */
    public function index(Request $request)
    {
        try {
            $query = VespaPedia::query();

            $query->where('status', 'published');

            // Filter berdasarkan jenis_motor_id
            if ($request->has('jenis_motor_id')) {
                $query->where('jenis_motor_id', $request->jenis_motor_id);
            }

            $pedia = $query->with('jenisMotor') // eager load jika ada relasi
                          ->orderBy('urutan')
                          ->orderBy('created_at', 'desc')
                          ->get();

            // Tambahkan gambar_url
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
     * Menyimpan konten baru (Create)
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'judul'          => 'required|max:255',
                'jenis_motor_id' => 'required|integer|exists:jenis_motors,id_jenis_motor', // sesuaikan nama tabel jenis motor
                'spesifikasi'    => 'nullable|string',
                'keunggulan'     => 'nullable|string',
                'tips'           => 'nullable|string',
                'gambar'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan'         => 'nullable|integer|min:0',
                'status'         => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul', 'jenis_motor_id', 'spesifikasi', 
                'keunggulan', 'tips', 'urutan', 'status'
            ]);

            // Default values
            $data['urutan'] = $data['urutan'] ?? 0;
            $data['status'] = $data['status'] ?? 'published';

            // Upload gambar
            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');
                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename = time() . '_' . $originalName;

                $file->move(public_path('uploads/vespa-pedia'), $filename);
                $data['gambar'] = $filename;
            }

            $pedia = VespaPedia::create($data);

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
     * Menampilkan detail satu konten
     */
    public function show(int $id)
    {
        try {
            $pedia = VespaPedia::with('jenisMotor')->find($id);
            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }

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
     * Update konten
     */
    public function update(Request $request, int $id)
    {
        try {
            $pedia = VespaPedia::findOrFail($id);

            $request->validate([
                'judul'          => 'nullable|max:255',
                'jenis_motor_id' => 'nullable|integer|exists:jenis_motors,id_jenis_motor',
                'spesifikasi'    => 'nullable|string',
                'keunggulan'     => 'nullable|string',
                'tips'           => 'nullable|string',
                'gambar'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan'         => 'nullable|integer|min:0',
                'status'         => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul', 'jenis_motor_id', 'spesifikasi', 
                'keunggulan', 'tips', 'urutan', 'status'
            ]);

            // Upload gambar baru
            if ($request->hasFile('gambar')) {
                // Hapus gambar lama
                if ($pedia->gambar) {
                    Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
                }

                $file = $request->file('gambar');
                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename = time() . '_' . $originalName;

                $file->move(public_path('uploads/vespa-pedia'), $filename);
                $data['gambar'] = $filename;
            }

            $pedia->update($data);

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
     * Hapus konten
     */
    public function destroy(int $id)
    {
        try {
            $pedia = VespaPedia::find($id);
            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }

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