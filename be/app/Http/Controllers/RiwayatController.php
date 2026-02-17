<?php
namespace App\Http\Controllers;

use App\Models\Diagnosa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RiwayatDiagnosisController extends Controller
{
    /**
     * GET /api/mobile/diagnosa
     * Ambil semua riwayat milik user yang login
     */
    public function index(Request $request)
    {
        $diagnosa = Diagnosa::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $diagnosa
        ]);
    }

    /**
     * POST /api/mobile/diagnosa
     * Simpan riwayat diagnosis baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'jenis_motor'     => 'required|string',
            'gejala_terpilih' => 'required|array',
            'hasil_diagnosis' => 'required|array',
        ]);

        $diagnosa = Diagnosa::create([
            'user_id'         => Auth::id(),
            'jenis_motor'     => $request->jenis_motor,
            'gejala_terpilih' => json_encode($request->gejala_terpilih),
            'hasil_diagnosis' => json_encode($request->hasil_diagnosis),
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'Riwayat berhasil disimpan.',
            'diagnosa' => $diagnosa
        ], 201);
    }

    /**
     * GET /api/mobile/diagnosa/{id}
     * Detail satu riwayat
     */
    public function show($id)
    {
        $diagnosa = Diagnosa::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$diagnosa) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success'  => true,
            'diagnosa' => $diagnosa
        ]);
    }

    /**
     * DELETE /api/mobile/diagnosa/{id}
     * Hapus riwayat
     */
    public function destroy($id)
    {
        $diagnosa = Diagnosa::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$diagnosa) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan.'
            ], 404);
        }

        $diagnosa->delete();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat berhasil dihapus.'
        ]);
    }
}