<?php

namespace App\Http\Controllers;

// Import model Layanan
use App\Models\Layanan;
// Import Request untuk menangkap data dari client
use Illuminate\Http\Request;

class LayananController extends Controller
{
    // 🔹 GET semua data layanan
    public function index()
    {
        // Mengambil seluruh data layanan dari database
        return response()->json(Layanan::all());
    }

    // 🔹 GET detail layanan berdasarkan ID
    public function show(int $id)
    {
        // Cari data layanan berdasarkan ID
        $data = Layanan::find($id);

        // Jika data tidak ditemukan
        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        // Jika ditemukan, tampilkan data
        return response()->json($data);
    }

    // 🔹 STORE (tambah layanan baru)
    public function store(Request $request)
    {
        // Simpan data langsung dari request ke database
        // (pastikan di model sudah ada fillable)
        $data = Layanan::create($request->all());

        // Return response berhasil
        return response()->json([
            'message' => 'Layanan berhasil ditambahkan',
            'data' => $data
        ]);
    }

    // 🔹 UPDATE data layanan
    public function update(Request $request, int $id)
    {
        // Cari data layanan berdasarkan ID
        $data = Layanan::find($id);

        // Jika tidak ditemukan
        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        // Update data dengan input dari request
        $data->update($request->all());

        // Return response berhasil
        return response()->json([
            'message' => 'Layanan berhasil diupdate',
            'data' => $data
        ]);
    }

    // 🔹 DELETE data layanan
    public function destroy(int $id)
    {
        // Cari data layanan
        $data = Layanan::find($id);

        // Jika tidak ditemukan
        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        // Hapus data dari database
        $data->delete();

        // Return response berhasil
        return response()->json(['message' => 'Layanan berhasil dihapus']);
    }
}