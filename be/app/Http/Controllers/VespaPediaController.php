<?php

namespace App\Http\Controllers;

use App\Models\VespaPedia;
use Illuminate\Http\Request;
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
     * GET ALL DATA
     */
    public function index(Request $request)
    {
        try {
            $query = VespaPedia::query();

            // Filter status published
            $query->where('status', 'published');

            // Filter jenis motor
            if ($request->has('jenis_motor_id')) {
                $query->where('jenis_motor_id', $request->jenis_motor_id);
            }

            $pedia = $query
                ->with('jenisMotor')
                ->orderBy('urutan')
                ->orderBy('created_at', 'desc')
                ->get();

            // Tambahkan URL gambar
            $pedia = $pedia->map(function ($item) {

                $item->gambar_url = $item->gambar
                    ? url('uploads/vespa-pedia/' . $item->gambar)
                    : null;

                return $item;
            });

            return response()->json($pedia);

        } catch (\Exception $e) {

            Log::error('Error in VespaPedia index: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengambil data Vespa Pedia',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * STORE DATA
     */
    public function store(Request $request)
    {
        try {

            $request->validate([
                'judul'          => 'required|max:255',
                'jenis_motor_id' => 'required|integer|exists:jenis_motor,id_jenis_motor',
                'spesifikasi'    => 'nullable|string',
                'keunggulan'     => 'nullable|string',
                'tips'           => 'nullable|string',
                'gambar'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan'         => 'nullable|integer|min:0',
                'status'         => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul',
                'jenis_motor_id',
                'spesifikasi',
                'keunggulan',
                'tips',
                'urutan',
                'status'
            ]);

            // DEFAULT VALUE
            $data['urutan'] = $data['urutan'] ?? 0;
            $data['status'] = $data['status'] ?? 'published';

            // KONTEN WAJIB ADA
            $data['konten'] = json_encode([
                'spesifikasi' => $request->spesifikasi,
                'keunggulan'  => $request->keunggulan,
                'tips'        => $request->tips,
            ]);

            /**
             * UPLOAD GAMBAR
             */
            if ($request->hasFile('gambar')) {

                $file = $request->file('gambar');

                $originalName = $this->sanitizeFilename(
                    $file->getClientOriginalName()
                );

                $filename = time() . '_' . $originalName;

                // Buat folder jika belum ada
                $uploadPath = public_path('uploads/vespa-pedia');

                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0777, true);
                }

                $file->move($uploadPath, $filename);

                $data['gambar'] = $filename;
            }

            $pedia = VespaPedia::create($data);

            // Tambahkan URL gambar
            $pedia->gambar_url = $pedia->gambar
                ? url('uploads/vespa-pedia/' . $pedia->gambar)
                : null;

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
     * SHOW DETAIL
     */
    public function show(int $id)
    {
        try {

            $pedia = VespaPedia::with('jenisMotor')->find($id);

            if (!$pedia) {
                return response()->json([
                    'message' => 'Konten tidak ditemukan'
                ], 404);
            }

            // Tambahkan URL gambar
            $pedia->gambar_url = $pedia->gambar
                ? url('uploads/vespa-pedia/' . $pedia->gambar)
                : null;

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
     * UPDATE DATA
     */
    public function update(Request $request, int $id)
    {
        try {

            $pedia = VespaPedia::findOrFail($id);

            $request->validate([
                'judul'          => 'nullable|max:255',
                'jenis_motor_id' => 'nullable|integer|exists:jenis_motor,id_jenis_motor',
                'spesifikasi'    => 'nullable|string',
                'keunggulan'     => 'nullable|string',
                'tips'           => 'nullable|string',
                'gambar'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan'         => 'nullable|integer|min:0',
                'status'         => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul',
                'jenis_motor_id',
                'spesifikasi',
                'keunggulan',
                'tips',
                'urutan',
                'status'
            ]);

            // UPDATE KONTEN JSON
            $data['konten'] = json_encode([
                'spesifikasi' => $request->spesifikasi,
                'keunggulan'  => $request->keunggulan,
                'tips'        => $request->tips,
            ]);

            /**
             * UPDATE GAMBAR
             */
            if ($request->hasFile('gambar')) {

                // Hapus gambar lama
                if ($pedia->gambar) {

                    $oldPath = public_path(
                        'uploads/vespa-pedia/' . $pedia->gambar
                    );

                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }

                $file = $request->file('gambar');

                $originalName = $this->sanitizeFilename(
                    $file->getClientOriginalName()
                );

                $filename = time() . '_' . $originalName;

                // Buat folder jika belum ada
                $uploadPath = public_path('uploads/vespa-pedia');

                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0777, true);
                }

                $file->move($uploadPath, $filename);

                $data['gambar'] = $filename;
            }

            $pedia->update($data);

            // Tambahkan URL gambar
            $pedia->gambar_url = $pedia->gambar
                ? url('uploads/vespa-pedia/' . $pedia->gambar)
                : null;

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
     * DELETE DATA
     */
    public function destroy(int $id)
    {
        try {

            $pedia = VespaPedia::find($id);

            if (!$pedia) {
                return response()->json([
                    'message' => 'Konten tidak ditemukan'
                ], 404);
            }

            // Hapus gambar
            if ($pedia->gambar) {

                $imagePath = public_path(
                    'uploads/vespa-pedia/' . $pedia->gambar
                );

                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
            }

            $pedia->delete();

            return response()->json([
                'message' => 'Konten berhasil dihapus'
            ]);

        } catch (\Exception $e) {

            Log::error('Error in VespaPedia destroy: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal menghapus konten',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}