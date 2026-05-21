<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\JenisMotor;
use Illuminate\Http\Request;

class JenisMotorController extends Controller
{
    // GET ALL
    public function index()
{
    return response()->json(
        JenisMotor::orderBy('nama_motor', 'asc')->get()
    );
}

    // STORE
    public function store(Request $request)
    {
        $request->validate([
            'nama_motor' => 'required|string|max:100|unique:jenis_motor,nama_motor'
        ]);

        $motor = JenisMotor::create([
            'nama_motor' => $request->nama_motor
        ]);

        return response()->json([
            'message' => 'Jenis motor berhasil ditambahkan',
            'data' => $motor
        ], 201);
    }

    // UPDATE
    public function update(Request $request, int $id)
    {
        $request->validate([
            'nama_motor' => 'required|string|max:100|unique:jenis_motor,nama_motor,' . $id . ',id_jenis_motor'
        ]);

        $motor = JenisMotor::findOrFail($id);

        $motor->update([
            'nama_motor' => $request->nama_motor
        ]);

        return response()->json([
            'message' => 'Jenis motor berhasil diupdate',
            'data' => $motor
        ]);
    }

    // DELETE
    public function destroy(int $id)
    {
        $motor = JenisMotor::findOrFail($id);

        $motor->delete();

        return response()->json([
            'message' => 'Jenis motor berhasil dihapus'
        ]);
    }
}