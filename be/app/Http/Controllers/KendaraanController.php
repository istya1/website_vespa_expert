<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Kendaraan;
use Illuminate\Http\Request;

class KendaraanController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id_user;
        $kendaraan = Kendaraan::where('user_id', $userId)->get(); // tanpa with dulu

        return response()->json([
            'berhasil' => true,
            'data'     => $kendaraan,
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kendaraan'  => 'required|string|max:100',
            'nomor_plat'      => 'required|string|max:20',
            'tahun_kendaraan' => 'nullable|integer|min:1990|max:' . date('Y'),
        ]);

        $validated['user_id'] = $request->user()->id_user; // ← pakai id_user

        $kendaraan = Kendaraan::create($validated);

        return response()->json([
            'berhasil' => true,
            'pesan'    => 'Kendaraan berhasil ditambahkan',
            'data'     => $kendaraan,
        ], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $userId = $request->user()->id_user; // ← pakai id_user
        $kendaraan = Kendaraan::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();
        $kendaraan->delete();

        return response()->json(['berhasil' => true, 'pesan' => 'Kendaraan dihapus']);
    }
}
