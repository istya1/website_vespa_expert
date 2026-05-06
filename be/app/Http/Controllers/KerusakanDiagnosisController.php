<?php

namespace App\Http\Controllers;

use App\Models\Gejala;   // model untuk mengambil data gejala + bobot
use App\Models\Aturan;   // model aturan (basis pengetahuan)
use App\Models\Kerusakan; // model kerusakan (hasil diagnosa)
use Illuminate\Http\Request;

class KerusakanDiagnosisController extends Controller
{
    public function prosesDiagnosis(Request $request)
    {

        // Tambah ini di baris paling atas
        \Log::info('DEBUG:', [
            'jenis_motor' => $request->jenis_motor,
            'gejala' => $request->gejala,
        ]);

        $diagnosisFinal       = [];
        $kemungkinanKerusakan = [];

        $gejalaTerpilih = $request->gejala ?? [];
        $jenisMotor     = $request->jenis_motor;

        if (!$jenisMotor) {
            return response()->json(['success' => false, 'message' => 'Parameter jenis_motor diperlukan.'], 400);
        }
        if (empty($gejalaTerpilih)) {
            return response()->json(['success' => false, 'message' => 'Gejala belum dipilih.'], 400);
        }

        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotor) {
                $q->where('jenis_motor', $jenisMotor);
            })
            ->get();

        $kodeKerusakanFinal = [];

        // ✅ PASS 1: Kumpulkan semua gejala yang sudah "terpakai" oleh full match
        $gejalaSudahDipakaiFinal = [];

        foreach ($aturanList as $aturan) {
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();
            $totalGejala  = count($gejalaAturan);
            if ($totalGejala === 0) continue;

            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);
            $jumlahMatch = count($gejalaMatch);

            if ($jumlahMatch === $totalGejala) {
                // Full match → catat semua gejala aturan ini sebagai "terpakai"
                $gejalaSudahDipakaiFinal = array_merge($gejalaSudahDipakaiFinal, $gejalaAturan);
                $kodeKerusakanFinal[]    = $aturan->kerusakan->kode_kerusakan;
            }
        }
        $gejalaSudahDipakaiFinal = array_unique($gejalaSudahDipakaiFinal);

        // ✅ PASS 2: Proses final + partial dengan filter ketat
        foreach ($aturanList as $aturan) {
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();
            $totalGejala  = count($gejalaAturan);
            if ($totalGejala === 0) continue;

            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);
            $jumlahMatch = count($gejalaMatch);

            if ($jumlahMatch === 0) continue;

            $totalBobot = Gejala::whereIn('kode_gejala', $gejalaMatch)
                ->get()
                ->sum(fn($g) => $g->bobot);

            $prioritas  = $totalBobot >= 5 ? 'Tinggi' : ($totalBobot >= 3 ? 'Sedang' : 'Rendah');
            $persentase = ($jumlahMatch / $totalGejala) * 100;
            $gejalaBelum = array_diff($gejalaAturan, $gejalaTerpilih);
            $kodeKerusakan = $aturan->kerusakan->kode_kerusakan;

            // ========================
            // CASE A: FULL MATCH
            // ========================
            if ($jumlahMatch === $totalGejala) {

                // ✅ CEK SUBSET: skip jika semua gejala aturan ini
                // sudah tercakup oleh aturan full match LAIN yang lebih besar
                $isSubsetDariAturanLain = $this->isSubsetDariAturanLain(
                    $gejalaAturan,
                    $aturanList,
                    $gejalaTerpilih,
                    $aturan->id_aturan // exclude diri sendiri
                );

                if ($isSubsetDariAturanLain) {
                    // Ini aturan kecil yang tercakup aturan besar → skip ke kemungkinan
                    // atau skip total, terserah kebutuhan bisnis
                    // Rekomendasi: skip total supaya tidak membingungkan
                    continue;
                }

                $diagnosisFinal[] = [
                    'id_aturan'            => $aturan->id_aturan,
                    'kode_kerusakan'       => $kodeKerusakan,
                    'nama_kerusakan'       => $aturan->kerusakan->nama_kerusakan,
                    'solusi'               => $aturan->kerusakan->solusi,
                    'persentase_kecocokan' => 100,
                    'jumlah_gejala'        => $totalGejala,
                    'label'                => 'Diagnosis Final',
                    'status'               => 'final',
                    'prioritas'            => $prioritas,
                    'total_bobot'          => $totalBobot,
                ];

                // ========================
                // CASE B: PARTIAL MATCH
                // ========================
            } else {

                // ✅ Skip jika kerusakan sudah ada di final
                if (in_array($kodeKerusakan, $kodeKerusakanFinal)) continue;

                // ✅ Skip jika SEMUA gejala yang cocok sudah dipakai oleh final match lain
                // (artinya tidak ada informasi baru dari partial ini)
                $gejalaMatchArray  = array_values($gejalaMatch);
                $semuaSudahDipakai = count(array_diff($gejalaMatchArray, $gejalaSudahDipakaiFinal)) === 0;
                if ($semuaSudahDipakai) continue;

                // ✅ Threshold minimal 75% untuk bisa masuk kemungkinan
                if ($persentase < 60) continue;

                $kemungkinanKerusakan[] = [
                    'id_aturan'      => $aturan->id_aturan,
                    'kode_kerusakan' => $kodeKerusakan,
                    'nama_kerusakan' => $aturan->kerusakan->nama_kerusakan,
                    'solusi'         => $aturan->kerusakan->solusi,
                    'label'          => 'Kemungkinan Kerusakan',
                    'prioritas'      => $prioritas,
                    'total_bobot'    => $totalBobot,
                    'kecocokan'      => [
                        'persentase'      => round($persentase, 2),
                        'sudah_cocok'     => $jumlahMatch,
                        'total_rule'      => $totalGejala,
                        'sisa_konfirmasi' => count($gejalaBelum),
                    ],
                    'gejala'         => [
                        'sudah_dipilih'      => $this->getDetailGejala(array_values($gejalaMatch)),
                        'perlu_dikonfirmasi' => $this->getDetailGejala(array_values($gejalaBelum)),
                    ],
                    'status'         => 'kemungkinan',
                ];
            }
        }

        // ✅ Safety filter post-loop
        $kemungkinanKerusakan = array_values(array_filter(
            $kemungkinanKerusakan,
            fn($k) => !in_array($k['kode_kerusakan'], $kodeKerusakanFinal)
        ));

        $statusDiagnosis = (!empty($diagnosisFinal) || !empty($kemungkinanKerusakan))
            ? 'selesai'
            : 'tidak_ditemukan';

        return response()->json([
            'success'               => true,
            'status_diagnosis'      => $statusDiagnosis,
            'message'               => $this->generatePesan($statusDiagnosis, count($diagnosisFinal), count($kemungkinanKerusakan)),
            'hasil_diagnosis'       => $diagnosisFinal,
            'kemungkinan_kerusakan' => $kemungkinanKerusakan,
        ]);
    }

    // ✅ Helper: cek apakah gejala aturan ini adalah subset dari aturan full match lain
    // isSubsetDariAturanLain - tambah type hint di $gejalaTerpilih
    private function isSubsetDariAturanLain(
        array $gejalaAturan,
        \Illuminate\Support\Collection $aturanList,
        array $gejalaTerpilih,
        int $excludeId
    ): bool {
        foreach ($aturanList as $aturanLain) {
            // Skip diri sendiri
            if ($aturanLain->id_aturan === $excludeId) continue;

            $gejalaAturanLain = $aturanLain->gejala->pluck('kode_gejala')->toArray();
            $matchLain        = count(array_intersect($gejalaTerpilih, $gejalaAturanLain));

            // Aturan lain harus full match
            if ($matchLain !== count($gejalaAturanLain)) continue;

            // Cek apakah semua gejala aturan ini ada di dalam aturan lain
            $sisaGejala = array_diff($gejalaAturan, $gejalaAturanLain);
            if (count($sisaGejala) === 0) {
                return true; // ✅ ini adalah subset
            }
        }
        return false;
    }

    // =========================
    // FUNCTION: GENERATE PESAN
    // =========================
    private function generatePesan(string $status, int $jumlahFinal, int $jumlahKemungkinan): string

    {
        // Jika tidak ditemukan hasil
        if ($status === 'tidak_ditemukan') {
            return 'Tidak ada kerusakan yang cocok. Coba pilih gejala lain.';
        }

        // Susun pesan dinamis
        $parts = [];

        if ($jumlahFinal > 0) {
            $parts[] = "{$jumlahFinal} diagnosis final";
        }

        if ($jumlahKemungkinan > 0) {
            $parts[] = "{$jumlahKemungkinan} kemungkinan kerusakan";
        }

        // Gabungkan pesan
        return 'Ditemukan ' . implode(' dan ', $parts) . '.';
    }

    // =========================
    // FUNCTION: DETAIL GEJALA
    // =========================
    private function getDetailGejala(array $kodeGejalaArray): array
    {
        // Jika kosong, return array kosong
        if (empty($kodeGejalaArray)) return [];

        // Ambil detail gejala dari database
        return Gejala::with('kategori')
            ->whereIn('kode_gejala', $kodeGejalaArray)
            ->get()
            ->map(fn($g) => [
                'kode_gejala' => $g->kode_gejala,
                'nama_gejala' => $g->nama_gejala,
                'kategori'    => $g->kategori,
                'bobot'       => $g->bobot, // 🔥 penting
            ])
            ->toArray();
    }

    // =========================
    // FUNCTION: DATA SMART UI
    // =========================
    public function getVespaSmartData(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');

        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan.'
            ], 400);
        }

        // ❌ HAPUS with('kategori')
        $gejala = Gejala::where('jenis_motor', $jenisMotor)
            ->get()
            ->groupBy(function ($g) {
                return $g->kategori_id; // ← pakai ini
            });
            
        $aturan = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', fn($q) => $q->where('jenis_motor', $jenisMotor))
            ->get();

        return response()->json([
            'success'            => true,
            'jenis_motor'        => $jenisMotor,
            'gejala_by_kategori' => $gejala,
            'total_aturan'       => $aturan->count()
        ]);
    }
}
