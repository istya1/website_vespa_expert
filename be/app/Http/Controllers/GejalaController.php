<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use Illuminate\Http\Request;

class GejalaController extends Controller
{
    public function index(Request $request)
    {
        $jenisMotor = urldecode($request->query('jenis_motor'));

        $query = Gejala::query();

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
            'kategori' => 'required|max:50',
            'bobot' => 'required|integer|in:1,2,3', 
        ]);

        $jenisMotor = $request->jenis_motor;

        // Prefix untuk Gejala = G + model
        $codePrefix = match ($jenisMotor) {
            'Sprint 150'        => 'GS150',
            'Sprint S 150'      => 'GSS150',
            'LX 125'            => 'GL125',
            'Primavera 150'     => 'GP150',
            'Primavera S 150'   => 'GPS150',
            default => throw new \Exception('Invalid jenis_motor'),
        };


        // Cari kode terakhir dengan prefix ini, urutkan desc
        $lastGejala = Gejala::where('kode_gejala', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_gejala', 'desc')
            ->first();

        if ($lastGejala) {
            // Ambil angka setelah '-', tambah 1
            $lastNumber = (int) substr($lastGejala->kode_gejala, strpos($lastGejala->kode_gejala, '-') + 1);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format: GS150-01, GS150-02, dst. (nol di depan untuk 2 digit)
        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        // Cek unique (aman, jarang conflict)
        while (Gejala::where('kode_gejala', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        $gejala = Gejala::create([
            'kode_gejala' => $newCode,
            'nama_gejala' => $request->nama_gejala,
            'jenis_motor' => $jenisMotor,
            'kategori' => $request->kategori,
            'bobot' => $request->bobot,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil ditambahkan',
            'data' => $gejala
        ], 201);
    }

    public function show($kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        return response()->json($gejala);
    }

    public function update(Request $request, $kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        $request->validate([
            'nama_gejala' => 'max:100',
            'jenis_motor' => 'in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
            'kategori' => 'max:50',
             'bobot' => 'integer|in:1,2,3',
        ]);

        $gejala->update(
            $request->only(['nama_gejala', 'jenis_motor', 'kategori', 'bobot'])
        );


        return response()->json([
            'message' => 'Gejala berhasil diupdate',
            'data' => $gejala
        ]);
    }

    public function destroy($kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        $gejala->delete();
        return response()->json(['message' => 'Gejala berhasil dihapus']);
    }
}
