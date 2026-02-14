<?php

namespace App\Http\Controllers;

use App\Models\Diagnosa;
use App\Models\DiagnosaGejala;
use App\Models\Aturan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DiagnosaController extends Controller
{

    public function index(Request $request)
    {
        // Jika ada parameter user_id dari mobile, filter berdasarkan user
        $userId = $request->query('user_id');

        $query = Diagnosa::with(['kerusakan', 'user']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $diagnosa = $query->orderBy('id_diagnosa', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $diagnosa
        ]);
    }

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
                'success' => false,
                'message' => 'Tidak ditemukan diagnosa yang sesuai'
            ], 404);
        }

        DB::beginTransaction();

        try {
            $diagnosa = Diagnosa::create([
                'user_id' => $request->user_id,
                'gejala_terpilih' => json_encode($selectedGejala), // Simpan sebagai JSON
                'kode_kerusakan' => $hasilTerbaik->kode_kerusakan,
                'persentase' => $persentaseTertinggi,
                'tanggal' => Carbon::now()
            ]);

            // Jika pakai tabel diagnosa_gejala juga
            if (class_exists(DiagnosaGejala::class)) {
                foreach ($selectedGejala as $kodeGejala) {
                    DiagnosaGejala::create([
                        'id_diagnosa' => $diagnosa->id_diagnosa,
                        'kode_gejala' => $kodeGejala
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Diagnosa berhasil',
                'data' => $diagnosa->load('kerusakan')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan diagnosa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeMobile(Request $request)
    {
        Log::info('USER LOGIN:', ['user' => Auth::user()]);
        Log::info('HEADER AUTH:', ['header' => $request->header('Authorization')]);


        $request->validate([
            'jenis_motor' => 'required|string',
            'gejala_terpilih' => 'required|array',
            'hasil_diagnosis' => 'required|array',
        ]);

        // WAJIB ambil dari login user
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $kerusakanUtama = $request->hasil_diagnosis[0] ?? null;

        if (!$kerusakanUtama) {
            return response()->json([
                'success' => false,
                'message' => 'Hasil diagnosis kosong'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $diagnosa = Diagnosa::create([
               'user_id' => $user->id_user,

                'gejala_terpilih' => json_encode($request->gejala_terpilih),
                'kode_kerusakan' => $kerusakanUtama['kode_kerusakan'],
                'persentase' => $kerusakanUtama['persentase_kecocokan'],
                'tanggal' => Carbon::now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Riwayat diagnosa berhasil disimpan',
                'data' => $diagnosa->load('kerusakan')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan riwayat',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function show($id)
    {
        $diagnosa = Diagnosa::with(['kerusakan', 'user'])
            ->find($id);

        if (!$diagnosa) {
            return response()->json([
                'success' => false,
                'message' => 'Diagnosa tidak ditemukan'
            ], 404);
        }

        // Decode gejala_terpilih jika berbentuk JSON string
        if (is_string($diagnosa->gejala_terpilih)) {
            $diagnosa->gejala_terpilih = json_decode($diagnosa->gejala_terpilih);
        }

        return response()->json([
            'success' => true,
            'data' => $diagnosa
        ]);
    }

    public function update(Request $request, $id)
    {
        $diagnosa = Diagnosa::findOrFail($id);

        $request->validate([
            'kode_kerusakan' => 'required',
            'persentase' => 'required|numeric'
        ]);

        DB::beginTransaction();

        try {
            $diagnosa->update([
                'kode_kerusakan' => $request->kode_kerusakan,
                'persentase' => $request->persentase
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Diagnosa berhasil diupdate',
                'data' => $diagnosa->load('kerusakan')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal update diagnosa',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            // Hapus dari diagnosa_gejala jika ada
            if (class_exists(DiagnosaGejala::class)) {
                DiagnosaGejala::where('id_diagnosa', $id)->delete();
            }

            // Hapus diagnosa
            Diagnosa::where('id_diagnosa', $id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Diagnosa berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal hapus diagnosa',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
