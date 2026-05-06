<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    // GET ALL
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Kategori::all()
        ]);
    }

    // STORE
    public function store(Request $request)
    {
        $request->validate([
            'nama_kategori' => 'required|string|max:100',
            'bobot_default' => 'required|integer|in:1,2,3'
        ]);

        $kategori = Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'bobot_default' => $request->bobot_default
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $kategori
        ]);
    }

    // SHOW
    public function show(int $id)
    {
        $kategori = Kategori::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $kategori
        ]);
    }

    // UPDATE
    public function update(Request $request, int $id)
    {
        $kategori = Kategori::findOrFail($id);

        $request->validate([
            'nama_kategori' => 'required|string|max:100',
            'bobot_default' => 'required|integer|in:1,2,3'
        ]);

        $kategori->update([
            'nama_kategori' => $request->nama_kategori,
            'bobot_default' => $request->bobot_default
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diupdate',
            'data' => $kategori
        ]);
    }

    // DELETE
    public function destroy(int $id)
    {
        $kategori = Kategori::findOrFail($id);
        $kategori->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus'
        ]);
    }
}