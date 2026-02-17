<?php

namespace App\Http\Controllers;

use App\Models\Aturan;
use App\Models\AturanGejala;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AturanController extends Controller
{
    // GET semua aturan + gejala
    public function index()
    {
        return response()->json(
         Aturan::with(['kerusakan', 'gejala.gejala'])->get()

        );
    }

    // POST tambah aturan
    public function store(Request $request)
    {
        $request->validate([
            'kode_kerusakan' => 'required',
            'gejala' => 'required|array|min:1'
        ]);

        DB::transaction(function () use ($request) {

            $aturan = Aturan::create([
                'kode_kerusakan' => $request->kode_kerusakan
            ]);

            foreach ($request->gejala as $kodeGejala) {
                AturanGejala::create([
                    'id_aturan' => $aturan->id_aturan,
                    'kode_gejala' => $kodeGejala
                ]);
            }
        });

        return response()->json([
            'message' => 'Aturan berhasil disimpan'
        ], 201);
    }

    //UPDATE
    public function update(Request $request, $id)
{
    $aturan = Aturan::findOrFail($id);

    $request->validate([
        'kode_kerusakan' => 'required',
        'gejala' => 'required|array|min:1'
    ]);

    DB::transaction(function () use ($request, $aturan) {

        $aturan->update([
            'kode_kerusakan' => $request->kode_kerusakan,
        ]);

        AturanGejala::where('id_aturan', $aturan->id_aturan)->delete();

        foreach ($request->gejala as $kodeGejala) {
            AturanGejala::create([
                'id_aturan' => $aturan->id_aturan,
                'kode_gejala' => $kodeGejala
            ]);
        }
    });

    $aturan->load(['kerusakan', 'gejala.gejala']);

    return response()->json($aturan);
}


    // DELETE aturan
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            AturanGejala::where('id_aturan', $id)->delete();
            Aturan::where('id_aturan', $id)->delete();
        });

        return response()->json([
            'message' => 'Aturan berhasil dihapus'
        ]);
    }
}
