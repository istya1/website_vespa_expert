<?php

namespace App\Http\Controllers;

use App\Models\Diagnosa;
use App\Models\DiagnosaGejala;
use App\Models\DiagnosaHasil; // Model baru untuk menyimpan multiple hasil
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
        $query = Diagnosa::with(['kerusakan', 'user', 'hasilDiagnosis.kerusakan']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $diagnosa = $query->orderBy('id_diagnosa', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $diagnosa
        ]);
    }

    /**
     * STORE - Untuk Web/Admin (UPDATED)
     * Sekarang support multiple hasil diagnosis dengan prioritas
     */
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
                        'prioritas' => $hasil['prioritas'],
                        'persentase_kecocokan' => $hasil['persentase_kecocokan'],
                        'tingkat_kepastian' => $hasil['tingkat_kepastian'] ?? 'Sedang',
                        'gejala_cocok' => $hasil['gejala_cocok'],
                        'total_gejala_aturan' => $hasil['total_gejala_aturan'],
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

    /**
     * STORE MOBILE - Untuk Mobile App (UPDATED)
     * Dengan autentikasi user dan support multiple hasil
     */
    public function storeMobile(Request $request)
    {
        Log::info('USER LOGIN:', ['user' => Auth::user()]);
        Log::info('REQUEST DATA:', $request->all());

        $request->validate([
            'jenis_motor' => 'required|string',
            'gejala_terpilih' => 'required|array',
            'hasil_diagnosis' => 'required|array|min:1',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.'
            ], 401);
        }

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
                'user_id' => $user->id_user,
                'jenis_motor' => $request->jenis_motor,
                'gejala_terpilih' => json_encode($request->gejala_terpilih),
                'kode_kerusakan' => $kerusakanUtama['kode_kerusakan'],
                'persentase' => $kerusakanUtama['persentase_kecocokan'],
                'tingkat_kepastian' => $kerusakanUtama['tingkat_kepastian'] ?? 'Sedang',
                'tanggal' => Carbon::now()
            ]);

            // Simpan gejala yang dipilih
            if (class_exists(DiagnosaGejala::class)) {
                foreach ($request->gejala_terpilih as $kodeGejala) {
                    DiagnosaGejala::create([
                        'id_diagnosa' => $diagnosa->id_diagnosa,
                        'kode_gejala' => $kodeGejala
                    ]);
                }
            }

            // Simpan SEMUA hasil diagnosis (prioritas 1, 2, 3, dst)
            if (class_exists(DiagnosaHasil::class)) {
                foreach ($hasilDiagnosis as $hasil) {
                    DiagnosaHasil::create([
                        'id_diagnosa' => $diagnosa->id_diagnosa,
                        'kode_kerusakan' => $hasil['kode_kerusakan'],
                        'prioritas' => $hasil['prioritas'],
                        'persentase_kecocokan' => $hasil['persentase_kecocokan'],
                        'tingkat_kepastian' => $hasil['tingkat_kepastian'] ?? 'Sedang',
                        'gejala_cocok' => $hasil['gejala_cocok'],
                        'total_gejala_aturan' => $hasil['total_gejala_aturan'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Riwayat diagnosa berhasil disimpan',
                'data' => $diagnosa->load(['kerusakan', 'hasilDiagnosis.kerusakan'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving mobile diagnosa: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan riwayat',
                'error' => $e->getMessage()
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
}