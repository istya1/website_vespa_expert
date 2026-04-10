<?php

namespace App\Http\Controllers;

use App\Models\Layanan;
use Illuminate\Http\Request;

class LayananController extends Controller
{
    public function index()
    {
        return response()->json(Layanan::all());
    }

    public function show($id)
    {
        $data = Layanan::find($id);

        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $data = Layanan::create($request->all());

        return response()->json([
            'message' => 'Layanan berhasil ditambahkan',
            'data' => $data
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = Layanan::find($id);

        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        $data->update($request->all());

        return response()->json([
            'message' => 'Layanan berhasil diupdate',
            'data' => $data
        ]);
    }

    public function destroy($id)
    {
        $data = Layanan::find($id);

        if (!$data) {
            return response()->json(['message' => 'Layanan tidak ditemukan'], 404);
        }

        $data->delete();

        return response()->json(['message' => 'Layanan berhasil dihapus']);
    }
}