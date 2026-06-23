<?php

namespace App\Http\Controllers;

use App\Models\Kerusakan;
use App\Models\JenisMotor;
use Illuminate\Http\Request;

class KerusakanController extends Controller
{
    /**
     * GET /kerusakan
     * Ambil semua kerusakan, opsional difilter per jenis motor.
     */
    public function index(Request $request)
    {
        // Eager load relasi jenisMotor saja
        // (tidak load 'gejala' di sini karena halaman admin kerusakan
        // cuma butuh nama motor, bukan daftar gejala terkait)
        $query = Kerusakan::with('jenisMotor');

        if ($request->query('jenis_motor_id')) {
            $query->where('jenis_motor_id', $request->query('jenis_motor_id'));
        }

        return response()->json($query->orderBy('kode_kerusakan')->get());
    }

    /**
     * POST /kerusakan
     * Tambah kerusakan baru, generate kode otomatis.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_kerusakan' => 'required|max:100',
            'solusi'         => 'nullable|string', // solusi boleh kosong, beda dari Gejala yang wajib ada kategori
            'jenis_motor_id' => 'required|exists:jenis_motor,id_jenis_motor',
        ]);

        $jenisMotor = JenisMotor::findOrFail($request->jenis_motor_id);

        // Pola generate kode SAMA seperti Gejala, hanya prefix beda huruf:
        // Gejala pakai 'G...', Kerusakan pakai 'K...'
        $codePrefix = match ($jenisMotor->nama_motor) {
            'Sprint 150'      => 'KS150',
            'Sprint S 150'    => 'KSS150',
            'LX 125'          => 'KL125',
            'Primavera 150'   => 'KP150',
            'Primavera S 150' => 'KPS150',
            default => 'K' . $request->jenis_motor_id,
        };

        // Cari kode terakhir dengan prefix yang sama, untuk lanjutkan nomor urut
        $lastKerusakan = Kerusakan::where('kode_kerusakan', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_kerusakan', 'desc')
            ->first();

        $newNumber = $lastKerusakan
            ? (int) substr($lastKerusakan->kode_kerusakan, strpos($lastKerusakan->kode_kerusakan, '-') + 1) + 1
            : 1;

        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        // Pengaman cek duplikat kode (sama seperti di Gejala)
        while (Kerusakan::where('kode_kerusakan', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        $kerusakan = Kerusakan::create([
            'kode_kerusakan' => $newCode,
            'nama_kerusakan' => $request->nama_kerusakan,
            'solusi'         => $request->solusi,
            'jenis_motor_id' => $request->jenis_motor_id,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil ditambahkan',
            'data'    => $kerusakan->load('jenisMotor'),
        ], 201);
    }

    /**
     * GET /kerusakan/{kode}
     */
    public function show(string $kode)
    {
        $kerusakan = Kerusakan::with('jenisMotor')->find($kode);

        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }

        return response()->json($kerusakan);
    }

    /**
     * PUT/PATCH /kerusakan/{kode}
     */
    public function update(Request $request, string $kode)
    {
        $kerusakan = Kerusakan::find($kode);

        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }

        $request->validate([
            'nama_kerusakan' => 'max:100',
            'solusi'         => 'nullable|string',
            'jenis_motor_id' => 'exists:jenis_motor,id_jenis_motor',
        ]);

        // Update partial: pertahankan nilai lama kalau field tidak dikirim
        $kerusakan->update([
            'nama_kerusakan' => $request->nama_kerusakan ?? $kerusakan->nama_kerusakan,
            'solusi'         => $request->solusi         ?? $kerusakan->solusi,
            'jenis_motor_id' => $request->jenis_motor_id ?? $kerusakan->jenis_motor_id,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil diupdate',
            'data'    => $kerusakan->load('jenisMotor'),
        ]);
    }

    /**
     * DELETE /kerusakan/{kode}
     */
    public function destroy(string $kode)
    {
        $kerusakan = Kerusakan::find($kode);

        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }

        // PERHATIAN: kalau kerusakan ini masih dipakai di tabel 'aturan' (pivot)
        // atau di tabel 'diagnosa' (riwayat), perlu pertimbangkan
        // apakah harus dicegah dihapus atau di-cascade delete
        $kerusakan->delete();

        return response()->json(['message' => 'Kerusakan berhasil dihapus']);
    }
}