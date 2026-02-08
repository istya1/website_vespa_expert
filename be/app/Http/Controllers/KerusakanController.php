<?php

namespace App\Http\Controllers;

use App\Models\Kerusakan;
use Illuminate\Http\Request;

class KerusakanController extends Controller
{
    public function index(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');

        $query = Kerusakan::query();

        if ($jenisMotor) {
            $query->where('jenis_motor', $jenisMotor);
        }

        return response()->json(
            $query->orderBy('kode_kerusakan')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kerusakan' => 'required|max:100',
            'jenis_motor' => 'required|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150',
        ]);

        $jenisMotor = $request->jenis_motor;

        $prefix = match ($jenisMotor) {
            'Sprint 150'        => 'KS150',
            'Sprint S 150'      => 'KSS150',
            'LX 125'            => 'KL125',
            'Primavera 150'     => 'KP150',
            'Primavera S 150'   => 'KPS150',
        };

        $last = Kerusakan::where('kode_kerusakan', 'like', $prefix . '-%')
            ->orderBy('kode_kerusakan', 'desc')
            ->first();

        $number = $last
            ? ((int) substr($last->kode_kerusakan, -2)) + 1
            : 1;

        $kode = $prefix . '-' . str_pad($number, 2, '0', STR_PAD_LEFT);

        $kerusakan = Kerusakan::create([
            'kode_kerusakan' => $kode,
            'nama_kerusakan' => $request->nama_kerusakan,
            'jenis_motor' => $jenisMotor,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil ditambahkan',
            'data' => $kerusakan
        ], 201);
    }

    public function update(Request $request, $kode)
    {
        $kerusakan = Kerusakan::findOrFail($kode);

        $request->validate([
            'nama_kerusakan' => 'required|max:100',
        ]);

        $kerusakan->update([
            'nama_kerusakan' => $request->nama_kerusakan,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil diupdate',
            'data' => $kerusakan
        ]);
    }

    public function destroy($kode)
    {
        Kerusakan::findOrFail($kode)->delete();

        return response()->json([
            'message' => 'Kerusakan berhasil dihapus'
        ]);
    }
}
