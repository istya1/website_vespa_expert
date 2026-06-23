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
        $name = pathinfo($filename, PATHINFO_FILENAME);

        $name = preg_replace('/[^A-Za-z0-9_\-]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);
        $name = strtolower($name);

        return $name . '.' . $extension;
    }

    /**
     * Upload multiple gambar
     */
    private function uploadImages(array $files): array
    {
        $uploadedFiles = [];

        $uploadPath = public_path('uploads/vespa-pedia');

        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        foreach ($files as $file) {

            $originalName = $this->sanitizeFilename(
                $file->getClientOriginalName()
            );

            $filename = time() . '_' . uniqid() . '_' . $originalName;

            $file->move($uploadPath, $filename);

            $uploadedFiles[] = $filename;
        }

        return $uploadedFiles;
    }

    /**
     * GET ALL DATA
     */
    public function index(Request $request)
    {
        try {

            $query = VespaPedia::query();

            if ($request->has('jenis_motor_id')) {
                $query->where('jenis_motor_id', $request->jenis_motor_id);
            }

            $pedia = $query
                ->with('jenisMotor')
                ->orderBy('urutan')
                ->orderBy('created_at', 'desc')
                ->get();

            $pedia = $pedia->map(function ($item) {
                $item->gambar_url = $this->buildGambarUrl($item);
                return $item;
            });

            return response()->json($pedia);
        } catch (\Exception $e) {

            Log::error('Error index VespaPedia: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengambil data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * STORE
     */
    public function store(Request $request)
    {
        try {

            $request->validate([
                'judul' => 'required|max:255',
                'deskripsi' => 'nullable|string',
                'jenis_motor_id' => 'required|integer',
                'spesifikasi' => 'nullable|string',
                'keunggulan' => 'nullable|string',
                'tips' => 'nullable|string',

                'gambar.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',

                'urutan' => 'nullable|integer|min:0',
                'status' => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul',
                'deskripsi',
                'jenis_motor_id',
                'spesifikasi',
                'keunggulan',
                'tips',
                'urutan',
                'status'
            ]);

            $data['urutan'] = $data['urutan'] ?? 0;
            $data['status'] = $data['status'] ?? 'published';

            $data['konten'] = json_encode([
                'deskripsi' => $request->deskripsi,
                'spesifikasi' => $request->spesifikasi,
                'keunggulan' => $request->keunggulan,
                'tips' => $request->tips,
            ]);

            /**
             * MULTIPLE UPLOAD
             */
            if ($request->hasFile('gambar')) {

                $uploadedFiles = $this->uploadImages(
                    $request->file('gambar')
                );

                $data['gambar'] = json_encode($uploadedFiles);
            }

            $pedia = VespaPedia::create($data);

            $pedia->gambar_url = $this->buildGambarUrl($pedia);

            return response()->json([
                'message' => 'Konten berhasil ditambahkan',
                'data' => $pedia
            ], 201);
        } catch (\Exception $e) {

            Log::error('Error store VespaPedia: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal menambahkan data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Build gambar_url array dari JSON string gambar
     */
private function buildGambarUrl(VespaPedia $model): array
{
    $gambar = json_decode($model->gambar, true);
    if (!$gambar || !is_array($gambar)) return [];

    // Ambil base URL dari request yang masuk, bukan dari config
    $baseUrl = request()->getSchemeAndHttpHost();

    return array_map(function($img) use ($baseUrl) {
        return $baseUrl . '/uploads/vespa-pedia/' . $img;
    }, $gambar);
}

    /**
     * UPDATE
     */
    public function update(Request $request, int $id)
    {
        try {

            $pedia = VespaPedia::findOrFail($id);

            $request->validate([
                'judul' => 'nullable|max:255',
                'deskripsi' => 'nullable|string',
                'jenis_motor_id' => 'nullable|integer',
                'spesifikasi' => 'nullable|string',
                'keunggulan' => 'nullable|string',
                'tips' => 'nullable|string',

                'gambar.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',

                'urutan' => 'nullable|integer|min:0',
                'status' => 'nullable|in:draft,published',
            ]);

            $data = $request->only([
                'judul',
                'deskripsi',
                'jenis_motor_id',
                'spesifikasi',
                'keunggulan',
                'tips',
                'urutan',
                'status'
            ]);

            $data['konten'] = json_encode([
                'deskripsi' => $request->deskripsi,
                'spesifikasi' => $request->spesifikasi,
                'keunggulan' => $request->keunggulan,
                'tips' => $request->tips,
            ]);

            /**
             * UPDATE GAMBAR
             */
            if ($request->hasFile('gambar')) {

                // hapus gambar lama
                $oldImages = json_decode($pedia->gambar, true);

                if ($oldImages && is_array($oldImages)) {

                    foreach ($oldImages as $img) {

                        $oldPath = public_path(
                            'uploads/vespa-pedia/' . $img
                        );

                        if (file_exists($oldPath)) {
                            unlink($oldPath);
                        }
                    }
                }

                $uploadedFiles = $this->uploadImages(
                    $request->file('gambar')
                );

                $data['gambar'] = json_encode($uploadedFiles);
            }

            $pedia->update($data);

            $pedia->refresh(); // pastikan data terbaru
            $pedia->gambar_url = $this->buildGambarUrl($pedia);

            return response()->json([
                'message' => 'Konten berhasil diupdate',
                'data' => $pedia
            ]);
        } catch (\Exception $e) {

            Log::error('Error update VespaPedia: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal update data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $pedia = VespaPedia::with('jenisMotor')->findOrFail($id);
            $pedia->gambar_url = $this->buildGambarUrl($pedia);
            return response()->json($pedia);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }
    }
    /**
     * DELETE
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

            $images = json_decode($pedia->gambar, true);

            if ($images && is_array($images)) {

                foreach ($images as $img) {

                    $imagePath = public_path(
                        'uploads/vespa-pedia/' . $img
                    );

                    if (file_exists($imagePath)) {
                        unlink($imagePath);
                    }
                }
            }

            $pedia->delete();

            return response()->json([
                'message' => 'Konten berhasil dihapus'
            ]);
        } catch (\Exception $e) {

            Log::error('Error delete VespaPedia: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal menghapus data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
