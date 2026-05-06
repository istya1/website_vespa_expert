<?php

namespace App\Http\Controllers;

// Import model yang digunakan
use App\Models\Aturan;
use App\Models\AturanGejala;

// Import class Laravel
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AturanController extends Controller
{
    // 🔹 GET semua aturan beserta relasi
    public function index()
    {
        return response()->json(
            // Ambil semua aturan + relasi:
            // - kerusakan (1 aturan → 1 kerusakan)
            // - gejala.gejala (pivot → detail gejala)
            Aturan::with(['kerusakan', 'gejala.gejala'])->get()
        );
    }

    // 🔹 POST tambah aturan baru
    public function store(Request $request)
    {
        // Validasi input
        $request->validate([
            'kode_kerusakan' => 'required',   // harus ada kerusakan
            'gejala' => 'required|array|min:1' // minimal 1 gejala
        ]);

        // Gunakan transaksi agar aman
        DB::transaction(function () use ($request) {

            // 🔸 Simpan aturan utama
            $aturan = Aturan::create([
                'kode_kerusakan' => $request->kode_kerusakan
            ]);

            // 🔸 Simpan relasi ke gejala (pivot)
            foreach ($request->gejala as $kodeGejala) {
                AturanGejala::create([
                    'id_aturan' => $aturan->id_aturan, // FK ke aturan
                    'kode_gejala' => $kodeGejala       // FK ke gejala
                ]);
            }
        });

        // Response sukses
        return response()->json([
            'message' => 'Aturan berhasil disimpan'
        ], 201);
    }

    // 🔹 UPDATE aturan
    public function update(Request $request, int $id)
    {
        // Ambil data aturan berdasarkan id
        $aturan = Aturan::findOrFail($id);

        // Validasi input
        $request->validate([
            'kode_kerusakan' => 'required',
            'gejala' => 'required|array|min:1'
        ]);

        // Transaksi update
        DB::transaction(function () use ($request, $aturan) {

            // 🔸 Update kerusakan
            $aturan->update([
                'kode_kerusakan' => $request->kode_kerusakan,
            ]);

            // 🔸 Hapus semua gejala lama (reset relasi)
            AturanGejala::where('id_aturan', $aturan->id_aturan)->delete();

            // 🔸 Simpan ulang gejala baru
            foreach ($request->gejala as $kodeGejala) {
                AturanGejala::create([
                    'id_aturan' => $aturan->id_aturan,
                    'kode_gejala' => $kodeGejala
                ]);
            }
        });

        // Load ulang relasi setelah update
        $aturan->load(['kerusakan', 'gejala.gejala']);

        // Return data terbaru
        return response()->json($aturan);
    }

    // 🔹 DELETE aturan
    public function destroy(int $id)
    {
        DB::transaction(function () use ($id) {

            // 🔸 Hapus relasi gejala dulu (pivot)
            AturanGejala::where('id_aturan', $id)->delete();

            // 🔸 Hapus aturan utama
            Aturan::where('id_aturan', $id)->delete();
        });

        // Response sukses
        return response()->json([
            'message' => 'Aturan berhasil dihapus'
        ]);
    }
}