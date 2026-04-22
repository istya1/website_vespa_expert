<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use Illuminate\Http\Request;

class GejalaController extends Controller
{

    // FUNCTION: GET DATA GEJALA
    public function index(Request $request)
    {
        // Ambil parameter jenis_motor dari query URL, lalu decode jika ada encoding
        $jenisMotor = urldecode($request->query('jenis_motor'));

        // Inisialisasi query builder untuk tabel gejala
        $query = Gejala::query();

        // Jika jenis motor diisi, maka filter data berdasarkan jenis motor
        if ($jenisMotor) {
            $query->where('jenis_motor', $jenisMotor);
        }

        // Ambil data gejala dan urutkan berdasarkan kode_gejala
        $gejala = $query->with('kategori')->orderBy('kode_gejala')->get();

        // Return data dalam bentuk JSON ke frontend
        return response()->json(
    $gejala->map(function ($g) {
        return [
            'kode_gejala' => $g->kode_gejala, // ✅ ubah
            'nama_gejala' => $g->nama_gejala, // ✅ ubah
            'jenis_motor' => $g->jenis_motor,
            'kategori_id' => $g->kategori_id, // ✅ penting
            'kategori'    => $g->kategori?->nama ?? '-',
            'bobot'       => $g->kategori?->bobot ?? 0,
        ];
    })
);
    }

    // FUNCTION: TAMBAH GEJALA
    public function store(Request $request)
    {
        // Validasi input dari user
        $request->validate([
            'nama_gejala' => 'required|max:100',
            'jenis_motor' => 'required|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori_id' => 'required|exists:kategori,id',
        ]);

        // Ambil jenis motor dari request
        $jenisMotor = $request->jenis_motor;

        // Menentukan prefix kode gejala berdasarkan jenis motor
        $codePrefix = match ($jenisMotor) {
            'Sprint 150'        => 'GS150',
            'Sprint S 150'      => 'GSS150',
            'LX 125'            => 'GL125',
            'Primavera 150'     => 'GP150',
            'Primavera S 150'   => 'GPS150',
            default => throw new \Exception('Invalid jenis_motor'),
        };

        // Cari kode gejala terakhir berdasarkan prefix
        $lastGejala = Gejala::where('kode_gejala', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_gejala', 'desc')
            ->first();

        // Jika ada data sebelumnya
        if ($lastGejala) {
            $lastNumber = (int) substr($lastGejala->kode_gejala, strpos($lastGejala->kode_gejala, '-') + 1);
            $newNumber  = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format kode gejala menjadi 2 digit
        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        // Loop untuk memastikan kode benar-benar unik
        while (Gejala::where('kode_gejala', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        // Simpan data gejala ke database
        $gejala = Gejala::create([
            'kode_gejala' => $newCode,
            'nama_gejala' => $request->nama_gejala,
            'jenis_motor' => $jenisMotor,
            'kategori_id' => $request->kategori_id,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil ditambahkan',
            'data'    => $gejala
        ], 201);
    }

    // FUNCTION: DETAIL GEJALA
    public function show($kode)
    {
        // Cari gejala berdasarkan primary key (kode_gejala)
        $gejala = Gejala::with('kategori')->find($kode);

        // Jika tidak ditemukan, kirim error 404
        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }
        return response()->json(
            $gejala->map(function ($g) {
                return [
                    'kode_gejala' => $g->kode_gejala, // ✅ ubah
                    'nama_gejala' => $g->nama_gejala, // ✅ ubah
                    'jenis_motor' => $g->jenis_motor,
                    'kategori_id' => $g->kategori_id, // ✅ penting
                    'kategori'    => $g->kategori?->nama ?? '-',
                    'bobot'       => $g->kategori?->bobot ?? 0,
                ];
            })
        );
    }

    // FUNCTION: UPDATE GEJALA
    public function update(Request $request, $kode)
    {
        // Cari data gejala berdasarkan kode
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        // Validasi input (tidak wajib semua diisi)
        $request->validate([
            'nama_gejala' => 'max:100',
            'jenis_motor' => 'in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori_id' => 'exists:kategori,id',
        ]);

        // Update hanya field yang dikirim
        $gejala->update(
            $request->only(['nama_gejala', 'jenis_motor', 'kategori_id'])
        );

        return response()->json([
            'message' => 'Gejala berhasil diupdate',
            'data'    => $gejala
        ]);
    }

    // FUNCTION: HAPUS GEJALA
    public function destroy($kode)
    {
        // Cari gejala berdasarkan kode
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        $gejala->delete();

        return response()->json(['message' => 'Gejala berhasil dihapus']);
    }
}
