<?php

namespace App\Http\Controllers;

use App\Models\Diagnosa;
use Illuminate\Http\Request;

class DiagnosaController extends Controller
{
    public function index()
    {
        $diagnosa = Diagnosa::with(['user', 'kerusakan'])
                    ->orderBy('tanggal', 'desc')
                    ->get();
        
        return response()->json($diagnosa);
    }

    public function show($id)
    {
        $diagnosa = Diagnosa::with(['user', 'kerusakan'])->find($id);
        
        if (!$diagnosa) {
            return response()->json(['message' => 'Diagnosa tidak ditemukan'], 404);
        }
        
        return response()->json($diagnosa);
    }

    public function destroy($id)
    {
        $diagnosa = Diagnosa::find($id);
        
        if (!$diagnosa) {
            return response()->json(['message' => 'Diagnosa tidak ditemukan'], 404);
        }

        $diagnosa->delete();
        return response()->json(['message' => 'Diagnosa berhasil dihapus']);
    }
}