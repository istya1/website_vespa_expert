<?php

namespace App\Http\Controllers;

use App\Models\Aturan;
use App\Models\AturanGejala;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AturanController extends Controller
{
    public function index()
    {
        return response()->json(
            Aturan::with('gejala')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_kerusakan' => 'required',
            'threshold' => 'required|integer',
            'gejala' => 'required|array'
        ]);

        DB::transaction(function () use ($request) {
            $aturan = Aturan::create([
                'kode_kerusakan' => $request->kode_kerusakan,
                'threshold' => $request->threshold
            ]);

            foreach ($request->gejala as $kodeGejala) {
                AturanGejala::create([
                    'id_aturan' => $aturan->id_aturan,
                    'kode_gejala' => $kodeGejala
                ]);
            }
        });

        return response()->json(['message' => 'Aturan berhasil disimpan'], 201);
    }

    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            AturanGejala::where('id_aturan', $id)->delete();
            Aturan::where('id_aturan', $id)->delete();
        });

        return response()->json(['message' => 'Aturan berhasil dihapus']);
    }
}
