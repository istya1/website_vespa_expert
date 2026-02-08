<?php

namespace App\Http\Controllers;

use App\Models\VespaPedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VespaPediaController extends Controller
{
    public function index(Request $request)
    {
        $query = VespaPedia::query();
        
        if ($request->has('jenis_motor')) {
            $query->where('jenis_motor', $request->jenis_motor);
        }
        
        if ($request->has('kategori')) {
            $query->where('kategori', $request->kategori);
        }
        
        $pedia = $query->orderBy('urutan')->orderBy('created_at', 'desc')->get();
        return response()->json($pedia);
    }

   public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|max:255',
            'jenis_motor' => 'required|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori' => 'required|in:Pengenalan,Keunggulan,Spesifikasi,Tips',
            'konten' => 'required',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // max 2MB
            'urutan' => 'integer|min:0',
            'status' => 'in:draft,published',
        ]);

        $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('vespa-pedia', $filename, 'public');
            $data['gambar'] = $filename; // hanya simpan nama file
        }

        $pedia = VespaPedia::create($data);

        return response()->json([
            'message' => 'Konten berhasil ditambahkan',
            'data' => $pedia
        ], 201);
    }

    public function show($id)
    {
        $pedia = VespaPedia::find($id);
        
        if (!$pedia) {
            return response()->json(['message' => 'Konten tidak ditemukan'], 404);
        }
        
        return response()->json($pedia);
    }

    public function update(Request $request, $id)
    {
        $pedia = VespaPedia::findOrFail($id);

        $request->validate([
            'judul' => 'max:255',
            'jenis_motor' => 'in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori' => 'in:Pengenalan,Keunggulan,Spesifikasi,Tips',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'urutan' => 'integer|min:0',
            'status' => 'in:draft,published',
        ]);

        $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama kalau ada
            if ($pedia->gambar) {
                Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
            }

            $file = $request->file('gambar');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('vespa-pedia', $filename, 'public');
            $data['gambar'] = $filename;
        }

        $pedia->update($data);

        return response()->json([
            'message' => 'Konten berhasil diupdate',
            'data' => $pedia
        ]);
    }

    public function destroy($id)
    {
        $pedia = VespaPedia::find($id);
        
        if (!$pedia) {
            return response()->json(['message' => 'Konten tidak ditemukan'], 404);
        }

        $pedia->delete();
        return response()->json(['message' => 'Konten berhasil dihapus']);
    }
}