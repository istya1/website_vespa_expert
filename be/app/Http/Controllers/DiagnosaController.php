<?php

namespace App\Http\Controllers;

use App\Models\Diagnosa;
use App\Models\DiagnosaGejala;
use App\Models\Aturan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DiagnosaController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | 1️⃣ GET ALL DIAGNOSA (ADMIN)
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        return response()->json(
            Diagnosa::with(['kerusakan', 'gejala'])
                ->orderBy('id_diagnosa', 'desc')
                ->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 2️⃣ PROSES DIAGNOSA (CREATE)
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'gejala' => 'required|array'
        ]);

        $selectedGejala = $request->gejala;
        $aturanList = Aturan::with('gejala')->get();

        $hasilTerbaik = null;
        $persentaseTertinggi = 0;

        foreach ($aturanList as $aturan) {

            $totalGejalaAturan = $aturan->gejala->count();

            if ($totalGejalaAturan == 0) continue;

            $jumlahCocok = $aturan->gejala
                ->whereIn('kode_gejala', $selectedGejala)
                ->count();

            $persentase = ($jumlahCocok / $totalGejalaAturan) * 100;

            if ($persentase >= $aturan->threshold && $persentase > $persentaseTertinggi) {
                $persentaseTertinggi = $persentase;
                $hasilTerbaik = $aturan;
            }
        }

        if (!$hasilTerbaik) {
            return response()->json([
                'message' => 'Tidak ditemukan diagnosa yang sesuai'
            ], 404);
        }

        DB::beginTransaction();

        $diagnosa = Diagnosa::create([
            'user_id' => $request->user_id,
            'kode_kerusakan' => $hasilTerbaik->kode_kerusakan,
            'persentase' => $persentaseTertinggi,
            'tanggal' => Carbon::now()
        ]);

        foreach ($selectedGejala as $kodeGejala) {
            DiagnosaGejala::create([
                'id_diagnosa' => $diagnosa->id_diagnosa,
                'kode_gejala' => $kodeGejala
            ]);
        }

        DB::commit();

        return response()->json([
            'message' => 'Diagnosa berhasil',
            'data' => $diagnosa->load(['kerusakan', 'gejala'])
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | 3️⃣ SHOW DETAIL DIAGNOSA
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        $diagnosa = Diagnosa::with(['kerusakan', 'gejala'])
            ->findOrFail($id);

        return response()->json($diagnosa);
    }

    /*
    |--------------------------------------------------------------------------
    | 4️⃣ UPDATE DIAGNOSA (ADMIN EDIT)
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, $id)
    {
        $diagnosa = Diagnosa::findOrFail($id);

        $request->validate([
            'kode_kerusakan' => 'required',
            'persentase' => 'required|numeric'
        ]);

        DB::beginTransaction();

        $diagnosa->update([
            'kode_kerusakan' => $request->kode_kerusakan,
            'persentase' => $request->persentase
        ]);

        DB::commit();

        return response()->json([
            'message' => 'Diagnosa berhasil diupdate',
            'data' => $diagnosa->load(['kerusakan', 'gejala'])
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 5️⃣ DELETE DIAGNOSA
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        DB::beginTransaction();

        DiagnosaGejala::where('id_diagnosa', $id)->delete();
        Diagnosa::where('id_diagnosa', $id)->delete();

        DB::commit();

        return response()->json([
            'message' => 'Diagnosa berhasil dihapus'
        ]);
    }
}
