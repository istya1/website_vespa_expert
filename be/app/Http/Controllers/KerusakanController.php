<?php
namespace App\Http\Controllers;

use App\Models\Kerusakan;
use App\Models\JenisMotor;
use Illuminate\Http\Request;

class KerusakanController extends Controller
{
    public function index(Request $request)
    {
        $query = Kerusakan::with('jenisMotor');

        if ($request->query('jenis_motor_id')) {
            $query->where('jenis_motor_id', $request->query('jenis_motor_id'));
        }

        return response()->json($query->orderBy('kode_kerusakan')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kerusakan' => 'required|max:100',
            'kategori'       => 'required|max:50',
            'solusi'         => 'nullable|string',
            'jenis_motor_id' => 'required|exists:jenis_motor,id_jenis_motor',
        ]);

        $jenisMotor = JenisMotor::findOrFail($request->jenis_motor_id);

        $codePrefix = match ($jenisMotor->nama_motor) {
            'Sprint 150'      => 'KS150',
            'Sprint S 150'    => 'KSS150',
            'LX 125'          => 'KL125',
            'Primavera 150'   => 'KP150',
            'Primavera S 150' => 'KPS150',
            default => 'K' . $request->jenis_motor_id,
        };

        $lastKerusakan = Kerusakan::where('kode_kerusakan', 'LIKE', $codePrefix . '-%')
            ->orderBy('kode_kerusakan', 'desc')
            ->first();

        $newNumber = $lastKerusakan
            ? (int) substr($lastKerusakan->kode_kerusakan, strpos($lastKerusakan->kode_kerusakan, '-') + 1) + 1
            : 1;

        $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);

        while (Kerusakan::where('kode_kerusakan', $newCode)->exists()) {
            $newNumber++;
            $newCode = $codePrefix . '-' . str_pad($newNumber, 2, '0', STR_PAD_LEFT);
        }

        $kerusakan = Kerusakan::create([
            'kode_kerusakan' => $newCode,
            'nama_kerusakan' => $request->nama_kerusakan,
            'kategori'       => $request->kategori,
            'solusi'         => $request->solusi,
            'jenis_motor_id' => $request->jenis_motor_id,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil ditambahkan',
            'data'    => $kerusakan->load('jenisMotor'),
        ], 201);
    }

    public function show(string $kode)
    {
        $kerusakan = Kerusakan::with('jenisMotor')->find($kode);
        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }
        return response()->json($kerusakan);
    }

    public function update(Request $request, string $kode)
    {
        $kerusakan = Kerusakan::find($kode);
        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }

        $request->validate([
            'nama_kerusakan' => 'max:100',
            'kategori'       => 'max:50',
            'solusi'         => 'nullable|string',
            'jenis_motor_id' => 'exists:jenis_motor,id_jenis_motor',
        ]);

        $kerusakan->update([
            'nama_kerusakan' => $request->nama_kerusakan ?? $kerusakan->nama_kerusakan,
            'kategori'       => $request->kategori       ?? $kerusakan->kategori,
            'solusi'         => $request->solusi         ?? $kerusakan->solusi,
            'jenis_motor_id' => $request->jenis_motor_id ?? $kerusakan->jenis_motor_id,
        ]);

        return response()->json([
            'message' => 'Kerusakan berhasil diupdate',
            'data'    => $kerusakan->load('jenisMotor'),
        ]);
    }

    public function destroy(string $kode)
    {
        $kerusakan = Kerusakan::find($kode);
        if (!$kerusakan) {
            return response()->json(['message' => 'Kerusakan tidak ditemukan'], 404);
        }
        $kerusakan->delete();
        return response()->json(['message' => 'Kerusakan berhasil dihapus']);
    }
}