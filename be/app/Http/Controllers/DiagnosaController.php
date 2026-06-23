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
            'hasilDiagnosis.kerusakan'
        ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $diagnosa = $query->orderBy('id_diagnosa', 'desc')->get();

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
            // Status kerusakan utama selalu 'final' karena hasil_diagnosis
            // hanya diisi kalau status_diagnosis = 'selesai' dengan full match
            $diagnosa = Diagnosa::create([
                'user_id' => $request->user_id,
                'jenis_motor' => $request->jenis_motor,
                'gejala_terpilih' => json_encode($request->gejala_terpilih),
                'kode_kerusakan' => $kerusakanUtama['kode_kerusakan'],
                'persentase' => $kerusakanUtama['persentase_kecocokan'],
                'status_kecocokan' => $kerusakanUtama['status'] ?? 'final',
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
                        'persentase_kecocokan' => $hasil['persentase_kecocokan'],
                        'status_kecocokan' => $hasil['status'] ?? 'final',
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
            $statusKecocokan  = 'final';

            if (!empty($hasilDiagnosis) && isset($hasilDiagnosis[0])) {
                // Ada diagnosis final (full match) -> dipakai sebagai hasil utama
                $utama = $hasilDiagnosis[0];
                $kodeKerusakan   = $utama['kode_kerusakan'] ?? null;
                $persentase      = $utama['persentase_kecocokan'] ?? 0;
                $statusKecocokan = 'final';
            } elseif (!empty($kemungkinanKerusakan)) {
                // Tidak ada full match -> ambil kemungkinan kerusakan
                // dengan persentase kecocokan tertinggi sebagai hasil utama
                usort($kemungkinanKerusakan, function ($a, $b) {
                    $pA = $a['kecocokan']['persentase'] ?? 0;
                    $pB = $b['kecocokan']['persentase'] ?? 0;
                    return $pB <=> $pA;
                });
                $utama = $kemungkinanKerusakan[0];
                $kodeKerusakan   = $utama['kode_kerusakan'] ?? null;
                $persentase      = $utama['kecocokan']['persentase'] ?? 0;
                $statusKecocokan = 'kemungkinan';
            } else {
                Log::warning('Tidak ada data hasil_diagnosis ATAU kemungkinan_kerusakan yang valid');
            }

            // CEK DUPLIKAT dalam 5 detik terakhir
            $duplikat = Diagnosa::where('user_id', $user->id_user)
                ->where('jenis_motor', $request->jenis_motor)
                ->where('kode_kerusakan', $kodeKerusakan)
                ->where('created_at', '>=', Carbon::now()->subSeconds(5))
                ->exists();

            if ($duplikat) {
                DB::rollBack();
                Log::info('Duplikat terdeteksi, simpan dibatalkan', [
                    'user_id' => $user->id_user,
                    'kode_kerusakan' => $kodeKerusakan,
                ]);
                return response()->json([
                    'success' => true,
                    'message' => 'Diagnosa sudah tersimpan sebelumnya',
                ], 200);
            }

            // Buat diagnosa utama
            $diagnosa = Diagnosa::create([
                'user_id'          => $user->id_user,
                'jenis_motor'      => $request->jenis_motor,
                'gejala_terpilih'  => json_encode($request->gejala_terpilih),
                'kode_kerusakan'   => $kodeKerusakan,
                'persentase'       => $persentase,
                'status_kecocokan' => $statusKecocokan,
                'tanggal'          => Carbon::now()
            ]);

            Log::info('Diagnosa utama dibuat', [
                'id' => $diagnosa->id_diagnosa,
                'kode_kerusakan' => $kodeKerusakan,
                'persentase' => $persentase
            ]);

            // Simpan gejala terpilih
            foreach ($request->gejala_terpilih as $kodeGejala) {
                DiagnosaGejala::create([
                    'id_diagnosa' => $diagnosa->id_diagnosa,
                    'kode_gejala' => $kodeGejala
                ]);
            }

            // Gabungkan hasil_diagnosis (final) & kemungkinan_kerusakan (partial)
            // ke dalam satu format yang konsisten untuk disimpan ke diagnosa_hasil
            $allHasil = array_merge(
                array_map(function ($h) {
                    return [
                        'kode_kerusakan'       => $h['kode_kerusakan'] ?? null,
                        'persentase_kecocokan' => $h['persentase_kecocokan'] ?? 0,
                        'status_kecocokan'     => 'final',
                        'gejala_cocok'         => json_encode($h['gejala_cocok'] ?? []),
                        'total_gejala_aturan'  => $h['total_gejala_aturan'] ?? ($h['jumlah_gejala'] ?? 0),
                    ];
                }, $hasilDiagnosis),
                array_map(function ($k) {
                    return [
                        'kode_kerusakan'       => $k['kode_kerusakan'] ?? null,
                        'persentase_kecocokan' => $k['kecocokan']['persentase'] ?? 0,
                        'status_kecocokan'     => 'kemungkinan',
                        'gejala_cocok'         => json_encode($k['gejala']['sudah_dipilih'] ?? []),
                        'total_gejala_aturan'  => $k['kecocokan']['total_rule'] ?? 0,
                    ];
                }, $kemungkinanKerusakan)
            );

            foreach ($allHasil as $hasil) {
                DiagnosaHasil::create([
                    'id_diagnosa'          => $diagnosa->id_diagnosa,
                    'kode_kerusakan'       => $hasil['kode_kerusakan'],
                    'persentase_kecocokan' => $hasil['persentase_kecocokan'],
                    'status_kecocokan'     => $hasil['status_kecocokan'],
                    'gejala_cocok'         => $hasil['gejala_cocok'],
                    'total_gejala_aturan'  => $hasil['total_gejala_aturan'],
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

    public function show(int $id)
    {
        $diagnosa = Diagnosa::with(['kerusakan', 'user', 'hasilDiagnosis.kerusakan'])
            ->find($id);

        if (!$diagnosa) {
            return response()->json([
                'success' => false,
                'message' => 'Diagnosa tidak ditemukan'
            ], 404);
        }

        if (is_string($diagnosa->gejala_terpilih)) {
            $diagnosa->gejala_terpilih = json_decode($diagnosa->gejala_terpilih);
        }

        return response()->json([
            'success' => true,
            'data' => $diagnosa
        ]);
    }

    public function update(Request $request, int $id)
    {
        $diagnosa = Diagnosa::findOrFail($id);

        $request->validate([
            'kode_kerusakan' => 'required',
            'persentase' => 'required|numeric'
        ]);

        DB::beginTransaction();

        try {
            $diagnosa->update(
                $request->only(['kode_kerusakan', 'persentase', 'status_kecocokan'])
            );

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

    public function destroy(int $id)
    {
        DB::beginTransaction();

        try {
            if (class_exists(DiagnosaGejala::class)) {
                DiagnosaGejala::where('id_diagnosa', $id)->delete();
            }

            if (class_exists(DiagnosaHasil::class)) {
                DiagnosaHasil::where('id_diagnosa', $id)->delete();
            }

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
                'gejala',
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

    public function statistik()
    {
        $kerusakan = DB::table('diagnosa')
            ->select('kode_kerusakan')
            ->selectRaw('count(*) as total')
            ->groupBy('kode_kerusakan')
            ->orderByDesc('total')
            ->get();

        $gejala = DB::table('diagnosa_gejala')
            ->select('kode_gejala')
            ->selectRaw('count(*) as total')
            ->groupBy('kode_gejala')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'success' => true,
            'kerusakan' => $kerusakan,
            'gejala' => $gejala
        ]);
    }
}