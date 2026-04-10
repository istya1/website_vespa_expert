<?php

namespace App\Http\Controllers;

use App\Models\Bengkel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BengkelController extends Controller
{
    // 🔹 GET semua bengkel
    public function index()
    {
        $data = Bengkel::with('layanan')
            ->orderBy('urutan', 'asc')
            ->get()
            ->map(function ($item) {
                $item->gambar_url = $item->gambar
                    ? asset('storage/' . $item->gambar)
                    : null;
                return $item;
            });

        return response()->json($data);
    }

    // 🔹 STORE (tambah bengkel)
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'telepon' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:100',
            'rating' => 'nullable|string|max:10',
            'jam_operasional' => 'nullable|string',
            'maps_link' => 'nullable|string',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:draft,published',
            'urutan' => 'nullable|integer',
            'gambar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048'
        ]);

        $data = $request->except('gambar');

        // upload gambar
        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $path = $file->store('bengkel', 'public');
            $data['gambar'] = $path;
        }

        $bengkel = Bengkel::create($data);

        return response()->json([
            'message' => 'Bengkel berhasil ditambahkan',
            'data' => $bengkel
        ]);
    }

    // 🔹 SHOW (detail)
    public function show($id)
    {
        $bengkel = Bengkel::with('layanan')->findOrFail($id);

        $bengkel->gambar_url = $bengkel->gambar
            ? asset('storage/' . $bengkel->gambar)
            : null;

        return response()->json($bengkel);
    }

    // 🔹 UPDATE
    public function update(Request $request, $id)
    {
        $bengkel = Bengkel::findOrFail($id);

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

        $data = $request->except('gambar');

        // jika upload gambar baru
        if ($request->hasFile('gambar')) {

            // hapus gambar lama
            if ($bengkel->gambar && Storage::disk('public')->exists($bengkel->gambar)) {
                Storage::disk('public')->delete($bengkel->gambar);
            }

            $file = $request->file('gambar');
            $path = $file->store('bengkel', 'public');
            $data['gambar'] = $path;
        }

        $bengkel->update($data);

        return response()->json([
            'message' => 'Bengkel berhasil diupdate',
            'data' => $bengkel
        ]);
    }

    // 🔹 DELETE
    public function destroy($id)
    {
        $bengkel = Bengkel::findOrFail($id);

        // hapus gambar dari storage
        if ($bengkel->gambar && Storage::disk('public')->exists($bengkel->gambar)) {
            Storage::disk('public')->delete($bengkel->gambar);
        }

        $bengkel->delete();

        return response()->json([
            'message' => 'Bengkel berhasil dihapus'
        ]);
    }
}