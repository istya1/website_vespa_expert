<?php

namespace App\Http\Controllers;

use App\Models\Kerusakan; 
use Illuminate\Http\Request;

class KerusakanController extends Controller
{
    // FUNCTION: GET DATA KERUSAKAN
    public function index(Request $request)
    {
        // Ambil parameter jenis_motor dari query URL (opsional)
        $jenisMotor = $request->query('jenis_motor');

        // Inisialisasi query builder
        $query = Kerusakan::query();

        // Jika ada filter jenis motor, maka tampilkan sesuai jenis tersebut
        if ($jenisMotor) {
            $query->where('jenis_motor', $jenisMotor);
        }

        // Ambil data kerusakan, urutkan berdasarkan kode, lalu kirim dalam bentuk JSON
        return response()->json(
            $query->orderBy('kode_kerusakan')->get()
        );
    }

    // FUNCTION: TAMBAH KERUSAKAN
    public function store(Request $request)
    {
        // Validasi input dari user
        $request->validate([
            'nama_kerusakan' => 'required|max:100', // nama kerusakan wajib
            'solusi' => 'required', // solusi wajib diisi
            'jenis_motor' => 'required|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150', // jenis motor harus valid
        ]);

        // Ambil jenis motor dari request
        $jenisMotor = $request->jenis_motor;

        // Menentukan prefix kode kerusakan berdasarkan jenis motor
        // contoh: Sprint 150 → KS150
        $prefix = match ($jenisMotor) {
            'Sprint 150'        => 'KS150',
            'Sprint S 150'      => 'KSS150',
            'LX 125'            => 'KL125',
            'Primavera 150'     => 'KP150',
            'Primavera S 150'   => 'KPS150',
        };

        // Ambil data kerusakan terakhir berdasarkan prefix
        $last = Kerusakan::where('kode_kerusakan', 'like', $prefix . '-%')
            ->orderBy('kode_kerusakan', 'desc') // ambil kode terbesar
            ->first();

        // Jika ada data sebelumnya, ambil nomor terakhir lalu tambah 1
        // Jika tidak ada, mulai dari 1
        $number = $last
            ? ((int) substr($last->kode_kerusakan, -2)) + 1
            : 1;

        // Format kode menjadi 2 digit (contoh: KS150-01)
        $kode = $prefix . '-' . str_pad($number, 2, '0', STR_PAD_LEFT);

        // Simpan data kerusakan ke database
        $kerusakan = Kerusakan::create([
            'kode_kerusakan' => $kode, // kode otomatis
            'nama_kerusakan' => $request->nama_kerusakan,
            'solusi' => $request->solusi,
            'jenis_motor' => $jenisMotor,
        ]);

        // Return response sukses
        return response()->json([
            'message' => 'Kerusakan berhasil ditambahkan',
            'data' => $kerusakan
        ], 201); // status 201 = created
    }

    // FUNCTION: UPDATE KERUSAKAN
    public function update(Request $request, $kode)
    {
        // Cari data kerusakan berdasarkan primary key (kode_kerusakan)
        // Jika tidak ditemukan, otomatis error 404
        $kerusakan = Kerusakan::findOrFail($kode);

        // Validasi input
        $request->validate([
            'nama_kerusakan' => 'required|max:100',
            'solusi' => 'required',
        ]);

        // Update data kerusakan
        $kerusakan->update([
            'nama_kerusakan' => $request->nama_kerusakan,
            'solusi' => $request->solusi,
        ]);

        // Return response sukses
        return response()->json([
            'message' => 'Kerusakan berhasil diupdate',
            'data' => $kerusakan
        ]);
    }

    // FUNCTION: HAPUS KERUSAKAN
    public function destroy($kode)
    {
        // Cari data berdasarkan kode, jika tidak ada akan error 404
        Kerusakan::findOrFail($kode)->delete();

        // Return response sukses
        return response()->json([
            'message' => 'Kerusakan berhasil dihapus'
        ]);
    }
}