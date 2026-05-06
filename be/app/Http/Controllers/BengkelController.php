<?php

namespace App\Http\Controllers;

// Import model Bengkel
use App\Models\Bengkel;
// Import request untuk ambil data dari user
use Illuminate\Http\Request;
// Import storage untuk upload & delete file
use Illuminate\Support\Facades\Storage;

class BengkelController extends Controller
{
    // 🔹 GET semua bengkel
    public function index()
    {
        // Ambil semua data bengkel + relasi layanan
        $data = Bengkel::with('layanan')
            ->orderBy('urutan', 'asc') // urutkan berdasarkan kolom urutan
            ->get()
            ->map(function ($item) {
                // Tambahkan atribut gambar_url (link lengkap ke gambar)
                $item->gambar_url = $item->gambar
                    ? asset('storage/' . $item->gambar)
                    : null;
                return $item;
            });

        // Return response dalam bentuk JSON
        return response()->json($data);
    }

    // 🔹 STORE (tambah bengkel)
    public function store(Request $request)
    {
        // Validasi input dari user
        $request->validate([
            'nama' => 'required|string|max:255', // wajib diisi
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:100',
            'rating' => 'nullable|string|max:10',
            'jam_operasional' => 'nullable|string',
            'maps_link' => 'nullable|string',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:draft,published', // hanya boleh draft/published
            'urutan' => 'nullable|integer',
            'gambar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048' // max 2MB
        ]);

        // Ambil semua data kecuali gambar
        $data = $request->except('gambar');

        // 🔹 Upload gambar jika ada
        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar'); // ambil file
            $path = $file->store('bengkel', 'public'); // simpan ke storage/public/bengkel
            $data['gambar'] = $path; // simpan path ke database
        }

        // Simpan data ke database
        $bengkel = Bengkel::create($data);

        // Return response
        return response()->json([
            'message' => 'Bengkel berhasil ditambahkan',
            'data' => $bengkel
        ]);
    }

    // 🔹 SHOW (detail)
    public function show(int $id)
    {
        // Cari bengkel berdasarkan id + relasi layanan
        $bengkel = Bengkel::with('layanan')->findOrFail($id);

        // Tambahkan URL gambar
        $bengkel->gambar_url = $bengkel->gambar
            ? config('app.url') . '/storage/' . $bengkel->gambar
            : null;

        // Return JSON
        return response()->json($bengkel);
    }

    // 🔹 UPDATE
    public function update(Request $request, int $id)
    {
        // Cari data bengkel
        $bengkel = Bengkel::findOrFail($id);

        // Validasi (semua nullable karena update tidak wajib semua diisi)
        $request->validate([
            'nama' => 'nullable|string|max:255',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:100',
            'rating' => 'nullable|string|max:10',
            'jam_operasional' => 'nullable|string',
            'maps_link' => 'nullable|string',
            'deskripsi' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'urutan' => 'nullable|integer',
            'gambar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048'
        ]);

        // Ambil data selain gambar
        $data = $request->except('gambar');

        // 🔹 Jika upload gambar baru
        if ($request->hasFile('gambar')) {

            // Hapus gambar lama jika ada di storage
            if ($bengkel->gambar && Storage::disk('public')->exists($bengkel->gambar)) {
                Storage::disk('public')->delete($bengkel->gambar);
            }

            // Simpan gambar baru
            $file = $request->file('gambar');
            $path = $file->store('bengkel', 'public');
            $data['gambar'] = $path;
        }

        // Update data di database
        $bengkel->update($data);

        // Return response
        return response()->json([
            'message' => 'Bengkel berhasil diupdate',
            'data' => $bengkel
        ]);
    }

    // 🔹 DELETE
    public function destroy(int $id)
    {
        // Cari data bengkel
        $bengkel = Bengkel::findOrFail($id);

        // Hapus gambar dari storage jika ada
        if ($bengkel->gambar && Storage::disk('public')->exists($bengkel->gambar)) {
            Storage::disk('public')->delete($bengkel->gambar);
        }

        // Hapus data dari database
        $bengkel->delete();

        // Return response
        return response()->json([
            'message' => 'Bengkel berhasil dihapus'
        ]);
    }
}
