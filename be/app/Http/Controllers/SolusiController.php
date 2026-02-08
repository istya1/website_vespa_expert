<?php

namespace App\Http\Controllers;

use App\Models\Solusi;
use Illuminate\Http\Request;

class SolusiController extends Controller
{
    public function index()
    {
        return response()->json(
            Solusi::orderBy('kode_solusi')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_solusi' => 'required|string',
            'jenis_motor' => 'required|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150',
        ]);

        // Prefix kode berdasarkan jenis motor
        $prefix = match ($request->jenis_motor) {
            'Sprint 150'        => 'SS150',
            'Sprint S 150'      => 'SSS150',
            'LX 125'            => 'SL125',
            'Primavera 150'     => 'SP150',
            'Primavera S 150'   => 'SPS150',
        };

        // Ambil kode terakhir sesuai prefix
        $last = Solusi::where('kode_solusi', 'like', $prefix . '-%')
            ->orderBy('kode_solusi', 'desc')
            ->first();

        $number = $last
            ? ((int) substr($last->kode_solusi, -2)) + 1
            : 1;

        $kodeSolusi = $prefix . '-' . str_pad($number, 2, '0', STR_PAD_LEFT);

        $solusi = Solusi::create([
            'kode_solusi' => $kodeSolusi,
            'nama_solusi' => $request->nama_solusi,
            'jenis_motor' => $request->jenis_motor,
        ]);

        return response()->json([
            'message' => 'Solusi berhasil ditambahkan',
            'data' => $solusi
        ], 201);
    }

    public function update(Request $request, $kode)
    {
        $solusi = Solusi::where('kode_solusi', $kode)->firstOrFail();

        $request->validate([
            'nama_solusi' => 'required|string',
        ]);

        $solusi->update([
            'nama_solusi' => $request->nama_solusi,
        ]);

        return response()->json([
            'message' => 'Solusi berhasil diperbarui',
            'data' => $solusi
        ]);
    }

    public function destroy($kode)
    {
        Solusi::where('kode_solusi', $kode)->delete();

        return response()->json([
            'message' => 'Solusi berhasil dihapus'
        ]);
    }
}
