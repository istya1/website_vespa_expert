<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use Illuminate\Http\Request;
use App\Models\Kategori;

class GejalaController extends Controller
{
    public function index(Request $request)
    {
        $jenisMotor = urldecode($request->query('jenis_motor'));

        $query = Gejala::with('kategori'); // ✅ ambil relasi kategori

        if ($jenisMotor) {
            $query->where('jenis_motor', $jenisMotor);
        }

        $gejala = $query->orderBy('kode_gejala')->get();

        return response()->json($gejala);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_gejala' => 'required|max:100',
            'jenis_motor' => 'required|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori_id' => 'required|exists:kategori,id', // ✅ pakai relasi
            'bobot' => 'nullable|integer|in:1,2,3',
        ]);

        $jenisMotor = $request->jenis_motor;

        // Prefix kode
        $codePrefix = match ($jenisMotor) {
            'Sprint 150'        => 'GS150',
            'Sprint S 150'      => 'GSS150',
            'LX 125'            => 'GL125',
            'Primavera 150'     => 'GP150',
            'Primavera S 150'   => 'GPS150',
            default => throw new \Exception('Invalid jenis_motor'),
        };

        // Ambil kode terakhir
        $lastGejala = Gejala::where('kode_gejala', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_gejala', 'desc')
            ->first();

        if ($lastGejala) {
            $lastNumber = (int) substr($lastGejala->kode_gejala, strpos($lastGejala->kode_gejala, '-') + 1);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        while (Gejala::where('kode_gejala', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }
        $kategori = Kategori::find($request->kategori_id);

        $bobot = $request->bobot ?? $kategori->bobot_default;

        $gejala = Gejala::create([
            'kode_gejala' => $newCode,
            'nama_gejala' => $request->nama_gejala,
            'jenis_motor' => $jenisMotor,
            'kategori_id' => $request->kategori_id, // ✅ FIX
            'bobot' => $bobot,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil ditambahkan',
            'data' => $gejala->load('kategori') // biar langsung ada nama kategori
        ], 201);
    }

    public function show(string $kode)
    {
        $gejala = Gejala::with('kategori')->find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        return response()->json($gejala);
    }

   public function update(Request $request, string $kode)
{
    $gejala = Gejala::find($kode);

    if (!$gejala) {
        return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
    }

    $request->validate([
        'nama_gejala' => 'max:100',
        'jenis_motor' => 'in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
        'kategori_id' => 'exists:kategori,id',
        'bobot' => 'nullable|integer|in:1,2,3',
    ]);

    // ambil kategori jika diubah
    $kategoriId = $request->kategori_id ?? $gejala->kategori_id;
    $kategori = Kategori::find($kategoriId);

    // logic bobot dinamis
    $bobot = $request->bobot ?? $kategori->bobot_default;

    $gejala->update([
        'nama_gejala' => $request->nama_gejala ?? $gejala->nama_gejala,
        'jenis_motor' => $request->jenis_motor ?? $gejala->jenis_motor,
        'kategori_id' => $kategoriId,
        'bobot' => $bobot,
    ]);

    return response()->json([
        'message' => 'Gejala berhasil diupdate',
        'data' => $gejala->load('kategori')
    ]);
}
    public function destroy(string $kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        $gejala->delete();

        return response()->json([
            'message' => 'Gejala berhasil dihapus'
        ]);
    }
}
