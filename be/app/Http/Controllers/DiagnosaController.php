<?php

namespace App\Http\Controllers;

use App\Models\Diagnosa;
use App\Models\DiagnosaGejala;
use App\Models\DiagnosaHasil;
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
        $userId = $request->query('user_id');
        $query = Diagnosa::with([
            'kerusakan',
            'user',
            'gejala',
            'hasilDiagnosis.kerusakan'  // PASTIKAN INI ADA
        ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $diagnosa = $query->orderBy('id_diagnosa', 'desc')->get();

        // Log untuk debug
        Log::info('Diagnosa loaded for admin', [
            'count' => $diagnosa->count(),
            'first_id' => $diagnosa->first()?->id_diagnosa,
            'first_has_relasi' => $diagnosa->first() ? $diagnosa->first()->hasilDiagnosis->pluck('kode_kerusakan')->toArray() : 'Kosong',
            'first_has_kerusakan' => $diagnosa->first() && $diagnosa->first()->hasilDiagnosis->first() ? $diagnosa->first()->hasilDiagnosis->first()->kerusakan?->nama_kerusakan : 'Tidak ada nama kerusakan'
        ]);

        return response()->json([
            'success' => true,
            'data' => $diagnosa
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'jenis_motor' => 'required|string',
            'gejala_terpilih' => 'required|array',
            'hasil_diagnosis' => 'required|array|min:1', // Hasil dari KerusakanDiagnosisController
        ]);

        $hasilDiagnosis = $request->hasil_diagnosis;
        $kerusakanUtama = $hasilDiagnosis[0] ?? null;

        if (!$kerusakanUtama) {
            return response()->json([
                'success' => false,
                'message' => 'Hasil diagnosis kosong'
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Simpan data diagnosa utama
            $diagnosa = Diagnosa::create([
                'user_id' => $request->user_id,
                'jenis_motor' => $request->jenis_motor,
                'gejala_terpilih' => json_encode($request->gejala_terpilih),
                'kode_kerusakan' => $kerusakanUtama['kode_kerusakan'],
                'persentase' => $kerusakanUtama['persentase_kecocokan'],
                'tingkat_kepastian' => $kerusakanUtama['tingkat_kepastian'] ?? 'Sedang',
                'tanggal' => Carbon::now()
            ]);

            // Simpan gejala yang dipilih ke tabel diagnosa_gejala
            if (class_exists(DiagnosaGejala::class)) {
                foreach ($request->gejala_terpilih as $kodeGejala) {
                    DiagnosaGejala::create([
                        'id_diagnosa' => $diagnosa->id_diagnosa,
                        'kode_gejala' => $kodeGejala
                    ]);
                }
            }

            // Simpan SEMUA hasil diagnosis (termasuk alternatif) ke tabel diagnosa_hasil
            if (class_exists(DiagnosaHasil::class)) {
                foreach ($hasilDiagnosis as $hasil) {
                    DiagnosaHasil::create([
                        'id_diagnosa' => $diagnosa->id_diagnosa,
                        'kode_kerusakan' => $hasil['kode_kerusakan'],
                        'prioritas' => $hasil['prioritas'] ?? 1,
                        'persentase_kecocokan' => $hasil['persentase_kecocokan'],
                        'tingkat_kepastian' => $hasil['tingkat_kepastian'] ?? 'Sedang',
                        'gejala_cocok' => json_encode($hasil['gejala_cocok'] ?? []),
                        'total_gejala_aturan' => $hasil['total_gejala_aturan'] ?? 0,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Diagnosa berhasil disimpan',
                'data' => $diagnosa->load(['kerusakan', 'hasilDiagnosis.kerusakan'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving diagnosa: ' . $e->getMessage());

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
        Log::info('REQUEST DATA:', $request->all());

        $request->validate([
            'jenis_motor'           => 'required|string',
            'gejala_terpilih'       => 'required|array',
            'hasil_diagnosis'       => 'nullable|array',
            'kemungkinan_kerusakan' => 'nullable|array',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.'
            ], 401);
        }

        DB::beginTransaction();
        try {
            $hasilDiagnosis       = $request->hasil_diagnosis ?? [];
            $kemungkinanKerusakan = $request->kemungkinan_kerusakan ?? [];

            Log::info('Jumlah hasil_diagnosis:', ['count' => count($hasilDiagnosis)]);
            Log::info('Jumlah kemungkinan_kerusakan:', ['count' => count($kemungkinanKerusakan)]);

            $kodeKerusakan    = null;
            $persentase       = 0;
            $tingkatKepastian = 'Sedang';

            // STEP 1: Coba ambil dari hasil_diagnosis (final 100%)
            if (!empty($hasilDiagnosis) && isset($hasilDiagnosis[0])) {
                $utama = $hasilDiagnosis[0];
                $kodeKerusakan     = $utama['kode_kerusakan'] ?? null;
                $persentase        = $utama['persentase_kecocokan'] ?? 0;
                $tingkatKepastian  = $utama['tingkat_kepastian'] ?? 'Sedang';
                Log::info('Mengambil dari HASIL DIAGNOSIS (final)', [
                    'kode' => $kodeKerusakan,
                    'persen' => $persentase
                ]);
            }
            // STEP 2: Kalau kosong, ambil dari kemungkinan (sort tertinggi)
            elseif (!empty($kemungkinanKerusakan)) {
                // Sort descending berdasarkan persentase
                usort($kemungkinanKerusakan, function ($a, $b) {
                    $pA = $a['kecocokan']['persentase'] ?? 0;
                    $pB = $b['kecocokan']['persentase'] ?? 0;
                    return $pB <=> $pA;
                });

                $utama = $kemungkinanKerusakan[0];
                $kodeKerusakan     = $utama['kode_kerusakan'] ?? null;
                $persentase        = $utama['kecocokan']['persentase'] ?? 0;
                $tingkatKepastian  = $utama['tingkat_kepastian'] ?? 'Sedang';
                Log::info('Mengambil dari KEMUNGKINAN tertinggi', [
                    'kode' => $kodeKerusakan,
                    'persen' => $persentase
                ]);
            } else {
                Log::warning('Tidak ada data hasil_diagnosis ATAU kemungkinan_kerusakan yang valid');
            }

            // Buat diagnosa utama
            $diagnosa = Diagnosa::create([
                'user_id'           => $user->id_user,
                'jenis_motor'       => $request->jenis_motor,
                'gejala_terpilih'   => json_encode($request->gejala_terpilih),
                'kode_kerusakan'    => $kodeKerusakan,
                'persentase'        => $persentase,
                'tingkat_kepastian' => $tingkatKepastian,
                'tanggal'           => Carbon::now()
            ]);

            Log::info('Diagnosa utama dibuat', [
                'id' => $diagnosa->id_diagnosa,
                'kode_kerusakan' => $kodeKerusakan,
                'persentase' => $persentase
            ]);

            // Simpan gejala terpilih
            foreach ($request->gejala_terpilih as $kodeGejala) {
                DiagnosaGejala::create([
                    'id_diagnosa'  => $diagnosa->id_diagnosa,
                    'kode_gejala'  => $kodeGejala
                ]);
            }

            // Simpan semua ke diagnosa_hasil
            $allHasil = array_merge(
                $hasilDiagnosis,
                array_map(function ($k) {
                    return [
                        'kode_kerusakan'       => $k['kode_kerusakan'] ?? null,
                        'persentase_kecocokan' => $k['kecocokan']['persentase'] ?? 0,
                        'tingkat_kepastian'    => $k['tingkat_kepastian'] ?? 'Sedang',
                        'prioritas'            => $k['prioritas'] ?? 2,
                        'gejala_cocok'         => json_encode($k['gejala']['sudah_dipilih'] ?? []),
                        'total_gejala_aturan'  => $k['kecocokan']['total_rule'] ?? 0,
                    ];
                }, $kemungkinanKerusakan)
            );

            foreach ($allHasil as $index => $hasil) {
                DiagnosaHasil::create([
                    'id_diagnosa'          => $diagnosa->id_diagnosa,
                    'kode_kerusakan'       => $hasil['kode_kerusakan'] ?? null,
                    'prioritas' => $this->mapPrioritas($hasil['prioritas'] ?? null, $index),
                    'persentase_kecocokan' => $hasil['persentase_kecocokan'] ?? 0,
                    'tingkat_kepastian'    => $hasil['tingkat_kepastian'] ?? 'Sedang',
                    'gejala_cocok'         => $hasil['gejala_cocok'] ?? '[]',
                    'total_gejala_aturan'  => $hasil['total_gejala_aturan'] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Riwayat diagnosa berhasil disimpan',
                'data'    => $diagnosa->load(['kerusakan', 'hasilDiagnosis.kerusakan'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving mobile diagnosa: ' . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan riwayat',
                'error'   => $e->getMessage()
            ], 500);
        }
    }


    public function show($id)
    {
        $diagnosa = Diagnosa::with(['kerusakan', 'user', 'hasilDiagnosis.kerusakan'])
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
                'persentase' => $request->persentase,
                'tingkat_kepastian' => $request->tingkat_kepastian ?? $diagnosa->tingkat_kepastian,
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
            // Hapus dari diagnosa_gejala
            if (class_exists(DiagnosaGejala::class)) {
                DiagnosaGejala::where('id_diagnosa', $id)->delete();
            }

            // Hapus dari diagnosa_hasil (multiple hasil)
            if (class_exists(DiagnosaHasil::class)) {
                DiagnosaHasil::where('id_diagnosa', $id)->delete();
            }

            // Hapus diagnosa utama
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

    public function indexMobile()
    {
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => Diagnosa::with([
                'kerusakan',
                'gejala', // 🔥 TAMBAHKAN
                'hasilDiagnosis.kerusakan'
            ])
                ->where('user_id', $user->id_user)
                ->orderByDesc('id_diagnosa')
                ->get()
        ]);
    }

    public function indexAdmin()
{
    $data = Diagnosa::with(['user', 'gejala', 'hasilDiagnosis.kerusakan'])
        ->orderByDesc('id_diagnosa')
        ->get();

    // Debug
    Log::info('ADMIN DIAGNOSA TOTAL: ' . $data->count());

    foreach ($data as $diagnosa) {
        Log::info("Diagnosa ID {$diagnosa->id_diagnosa}", [
            'hasilDiagnosis_count' => $diagnosa->hasilDiagnosis->count(),
            'first_hasil' => $diagnosa->hasilDiagnosis->first() ? $diagnosa->hasilDiagnosis->first()->toArray() : 'kosong',
            'first_kerusakan_nama' => $diagnosa->hasilDiagnosis->first()?->kerusakan?->nama_kerusakan ?? 'tidak ada'
        ]);
    }

    return response()->json(['success' => true, 'data' => $data]);
}
private function mapPrioritas($prioritas, $index = 0)
{
    if ($prioritas === 'Tinggi') return 3;
    if ($prioritas === 'Sedang') return 2;
    if ($prioritas === 'Rendah') return 1;

    // fallback kalau null
    return $index + 1;
}
}


