<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use App\Models\JenisMotor;
use Illuminate\Http\Request;
use App\Models\Kategori;

class GejalaController extends Controller
{
    /**
     * GET /gejala
     * Menampilkan semua data gejala, bisa difilter berdasarkan jenis motor.
     * Dipakai oleh: halaman admin (CRUD) dan mobile (ambil daftar gejala untuk diagnosis).
     */
    public function index(Request $request)
    {
        // Ambil parameter query string ?jenis_motor_id=... dari request (opsional)
        $jenisMotorId = $request->query('jenis_motor_id');

        // Siapkan query dasar: ambil gejala beserta relasi kategori & jenisMotor
        // (eager loading -> menghindari N+1 query saat data ditampilkan dengan nama kategori/motor)
        $query = Gejala::with(['kategori', 'jenisMotor']);

        // Jika ada filter jenis_motor_id dikirim, batasi query hanya untuk motor tersebut
        if ($jenisMotorId) {
            $query->where('jenis_motor_id', $jenisMotorId);
        }

        // Urutkan berdasarkan kode_gejala (alfabetis/numerik sesuai format kode)
        // lalu eksekusi query, ambil semua hasil sebagai Collection
        $gejala = $query->orderBy('kode_gejala')->get();

        // Kembalikan sebagai JSON ke client (web/mobile)
        return response()->json($gejala);
    }

    /**
     * POST /gejala
     * Menambahkan gejala baru. Kode gejala di-generate otomatis
     * berdasarkan prefix jenis motor + nomor urut.
     */
    public function store(Request $request)
    {
        // Validasi input wajib:
        // - nama_gejala harus ada, maksimal 100 karakter
        // - jenis_motor_id harus ada dan benar-benar terdaftar di tabel jenis_motor
        // - kategori_id harus ada dan benar-benar terdaftar di tabel kategori
        $request->validate([
            'nama_gejala'    => 'required|max:100',
            'jenis_motor_id' => 'required|exists:jenis_motor,id_jenis_motor',
            'kategori_id'    => 'required|exists:kategori,id',
        ]);

        // Ambil data jenis motor berdasarkan ID yang dikirim
        // findOrFail -> otomatis lempar error 404 kalau ID tidak ditemukan
        $jenisMotor = JenisMotor::findOrFail($request->jenis_motor_id);

        // Tentukan prefix kode gejala berdasarkan nama motor
        // match -> seperti switch-case tapi lebih ringkas (PHP 8+)
        // Kalau nama motor tidak ada di daftar, fallback ke 'G' + id motor
        $codePrefix = match ($jenisMotor->nama_motor) {
            'Sprint 150'      => 'GS150',
            'Sprint S 150'    => 'GSS150',
            'LX 125'          => 'GL125',
            'Primavera 150'   => 'GP150',
            'Primavera S 150' => 'GPS150',
            default => 'G' . $request->jenis_motor_id,
        };

        // Cari gejala terakhir dengan prefix yang sama (contoh: GS150-05)
        // LIKE 'GS150-%' -> cocokkan semua kode yang diawali prefix tersebut
        // orderBy desc -> ambil kode dengan nomor urut paling besar
        $lastGejala = Gejala::where('kode_gejala', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_gejala', 'desc')
            ->first();

        // Tentukan nomor urut baru:
        // - kalau ada gejala terakhir, ambil angka setelah tanda '-', lalu +1
        // - kalau belum ada sama sekali (motor baru), mulai dari 1
        $newNumber = $lastGejala
            ? (int) substr($lastGejala->kode_gejala, strpos($lastGejala->kode_gejala, '-') + 1) + 1
            : 1;

        // Susun kode baru, nomor di-pad 2 digit dengan leading zero (01, 02, ..., 10)
        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        // Pengaman tambahan: cek ulang apakah kode ini sudah dipakai
        // (misal terjadi race condition saat dua request bersamaan)
        // kalau sudah ada, naikkan nomor terus sampai ketemu kode yang benar-benar kosong
        while (Gejala::where('kode_gejala', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        // Simpan gejala baru ke database dengan kode yang sudah di-generate
        $gejala = Gejala::create([
            'kode_gejala'    => $newCode,
            'nama_gejala'    => $request->nama_gejala,
            'jenis_motor_id' => $request->jenis_motor_id,
            'kategori_id'    => $request->kategori_id,
        ]);

        // Kembalikan response sukses (HTTP 201 Created)
        // load() -> ambil ulang relasi kategori & jenisMotor supaya ikut ditampilkan di response
        return response()->json([
            'message' => 'Gejala berhasil ditambahkan',
            'data'    => $gejala->load(['kategori', 'jenisMotor'])
        ], 201);
    }

    /**
     * GET /gejala/{kode}
     * Menampilkan detail satu gejala berdasarkan kode_gejala (primary key string).
     */
    public function show(string $kode)
    {
        // find() di sini mencari berdasarkan primary key (kode_gejala),
        // bukan 'id', karena model sudah didefinisikan primaryKey-nya custom
        $gejala = Gejala::with(['kategori', 'jenisMotor'])->find($kode);

        // Kalau tidak ditemukan, kembalikan 404 dengan pesan yang jelas
        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        return response()->json($gejala);
    }

    /**
     * PUT/PATCH /gejala/{kode}
     * Mengupdate data gejala yang sudah ada. Kode gejala TIDAK diubah
     * (sesuai aturan di frontend: kode otomatis & tidak bisa diedit).
     */
    public function update(Request $request, string $kode)
    {
        // Cari gejala yang mau diupdate
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        // Validasi lebih ringan dibanding store():
        // tidak pakai 'required' karena update bisa parsial (hanya update sebagian field)
        $request->validate([
            'nama_gejala'    => 'max:100',
            'jenis_motor_id' => 'exists:jenis_motor,id_jenis_motor',
            'kategori_id'    => 'exists:kategori,id',
        ]);

        // Update data: kalau field tidak dikirim di request (null),
        // pertahankan nilai lama pakai operator '??' (null coalescing)
        $gejala->update([
            'nama_gejala'    => $request->nama_gejala    ?? $gejala->nama_gejala,
            'jenis_motor_id' => $request->jenis_motor_id ?? $gejala->jenis_motor_id,
            'kategori_id'    => $request->kategori_id    ?? $gejala->kategori_id,
        ]);

        return response()->json([
            'message' => 'Gejala berhasil diupdate',
            'data'    => $gejala->load(['kategori', 'jenisMotor'])
        ]);
    }

    /**
     * DELETE /gejala/{kode}
     * Menghapus gejala berdasarkan kode_gejala.
     */
    public function destroy(string $kode)
    {
        $gejala = Gejala::find($kode);

        if (!$gejala) {
            return response()->json(['message' => 'Gejala tidak ditemukan'], 404);
        }

        // Hapus baris dari database
        // Catatan: kalau gejala ini masih terhubung di tabel pivot 'aturan',
        // perlu dicek apakah ada constraint foreign key yang akan menolak delete,
        // atau cascade delete yang akan ikut menghapus baris aturan terkait
        $gejala->delete();

        return response()->json(['message' => 'Gejala berhasil dihapus']);
    }
}