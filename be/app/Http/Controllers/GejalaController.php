<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use App\Models\JenisMotor;
use Illuminate\Http\Request;
use App\Models\Kategori;

class GejalaController extends Controller
{
    public function index(Request $request)
    {
        $jenisMotorId = $request->query('jenis_motor_id');

        $query = Gejala::with(['kategori', 'jenisMotor']);

        if ($jenisMotorId) {
            $query->where('jenis_motor_id', $jenisMotorId);
        }

        $gejala = $query->orderBy('kode_gejala')->get();

        return response()->json($gejala);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_gejala'    => 'required|max:100',
            'jenis_motor_id' => 'required|exists:jenis_motor,id_jenis_motor',
            'kategori_id'    => 'required|exists:kategori,id',
            'bobot'          => 'nullable|integer|in:1,2,3',
        ]);

        // Ambil nama motor untuk prefix kode
        $jenisMotor = JenisMotor::findOrFail($request->jenis_motor_id);

        $codePrefix = match ($jenisMotor->nama_motor) {
            'Sprint 150'      => 'GS150',
            'Sprint S 150'    => 'GSS150',
            'LX 125'          => 'GL125',
            'Primavera 150'   => 'GP150',
            'Primavera S 150' => 'GPS150',
            default => 'G' . $request->jenis_motor_id,
        };

        // Generate kode
        $lastGejala = Gejala::where('kode_gejala', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_gejala', 'desc')
            ->first();

        $newNumber = $lastGejala
            ? (int) substr($lastGejala->kode_gejala, strpos($lastGejala->kode_gejala, '-') + 1) + 1
            : 1;

        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        // Hindari duplikat
        while (Gejala::where('kode_gejala', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        $kategori = Kategori::find($request->kategori_id);
        $bobot = $request->bobot ?? $kategori->bobot_default;

        $gejala = Gejala::create([
            'kode_gejala'    => $newCode,
            'nama_gejala'    => $request->nama_gejala,
            'jenis_motor_id' => $request->jenis_motor_id,  // ← ganti
            'kategori_id'    => $request->kategori_id,
            'bobot'          => $bobot,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil ditambahkan',
            'data'    => $gejala->load(['kategori', 'jenisMotor'])
        ], 201);
    }

    public function show(string $kode)
    {
        $gejala = Gejala::with(['kategori', 'jenisMotor'])->find($kode);

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
            'nama_gejala'    => 'max:100',
            'jenis_motor_id' => 'exists:jenis_motor,id_jenis_motor',
            'kategori_id'    => 'exists:kategori,id',
            'bobot'          => 'nullable|integer|in:1,2,3',
        ]);

        $kategoriId = $request->kategori_id ?? $gejala->kategori_id;
        $kategori   = Kategori::find($kategoriId);
        $bobot      = $request->bobot ?? $kategori->bobot_default;

        $gejala->update([
            'nama_gejala'    => $request->nama_gejala    ?? $gejala->nama_gejala,
            'jenis_motor_id' => $request->jenis_motor_id ?? $gejala->jenis_motor_id,  // ← ganti
            'kategori_id'    => $kategoriId,
            'bobot'          => $bobot,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil diupdate',
            'data'    => $gejala->load(['kategori', 'jenisMotor'])
        ]);
    }

    public function destroy(string $kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        $gejala->delete();

        return response()->json(['message' => 'Gejala berhasil dihapus']);
    }
}