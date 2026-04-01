<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use App\Models\Aturan;
use App\Models\Kerusakan;
use Illuminate\Http\Request;

class KerusakanDiagnosisController extends Controller
{
    public function prosesDiagnosis(Request $request)
    {
        $diagnosisFinal = [];
        $kemungkinanKerusakan = [];

        $gejalaTerpilih = $request->gejala ?? [];
        $jenisMotor     = $request->jenis_motor;

        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan.'
            ], 400);
        }

        if (empty($gejalaTerpilih)) {
            return response()->json([
                'success' => false,
                'message' => 'Gejala belum dipilih.'
            ], 400);
        }

        // 🔥 Ambil aturan sesuai jenis motor
        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotor) {
                $q->where('jenis_motor', $jenisMotor);
            })
            ->get();

        foreach ($aturanList as $aturan) {

            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();
            $totalGejala  = count($gejalaAturan);

            if ($totalGejala === 0) continue;

            // ✅ Ambil gejala yang cocok
            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);
            $jumlahMatch = count($gejalaMatch);

            if ($jumlahMatch === 0) continue;

            // ✅ Hitung bobot
            $totalBobot = Gejala::whereIn('kode_gejala', $gejalaMatch)->sum('bobot');

            // ✅ Tentukan prioritas
            if ($totalBobot >= 5) {
                $prioritas = 'Tinggi';
            } elseif ($totalBobot >= 3) {
                $prioritas = 'Sedang';
            } else {
                $prioritas = 'Rendah';
            }

            // ✅ Lanjut perhitungan
            $gejalaBelum = array_diff($gejalaAturan, $gejalaTerpilih);
            $persentase  = ($jumlahMatch / $totalGejala) * 100;

            // ── CASE A: FULL MATCH
            if ($jumlahMatch === $totalGejala) {

                $diagnosisFinal[] = [
                    'id_aturan'            => $aturan->id_aturan,
                    'kode_kerusakan'       => $aturan->kerusakan->kode_kerusakan,
                    'nama_kerusakan'       => $aturan->kerusakan->nama_kerusakan,
                    'solusi'               => $aturan->kerusakan->solusi,
                    'persentase_kecocokan' => 100,
                    'jumlah_gejala'        => $totalGejala,
                    'label'                => 'Diagnosis Final',
                    'status'               => 'final',

                    // 🔥 PRIORITAS
                    'prioritas'            => $prioritas,
                    'total_bobot'          => $totalBobot,
                ];

            } else {

                // ── CASE B: KEMUNGKINAN
                $kemungkinanKerusakan[] = [
                    'id_aturan'      => $aturan->id_aturan,
                    'kode_kerusakan' => $aturan->kerusakan->kode_kerusakan,
                    'nama_kerusakan' => $aturan->kerusakan->nama_kerusakan,
                    'solusi'         => $aturan->kerusakan->solusi,
                    'label'          => 'Kemungkinan Kerusakan',

                    // 🔥 PRIORITAS
                    'prioritas'      => $prioritas,
                    'total_bobot'    => $totalBobot,

                    'kecocokan' => [
                        'persentase'      => round($persentase, 2),
                        'sudah_cocok'     => $jumlahMatch,
                        'total_rule'      => $totalGejala,
                        'sisa_konfirmasi' => count($gejalaBelum),
                    ],

                    'gejala' => [
                        'sudah_dipilih'      => $this->getDetailGejala(array_values($gejalaMatch)),
                        'perlu_dikonfirmasi' => $this->getDetailGejala(array_values($gejalaBelum)),
                    ],

                    'status' => 'kemungkinan',
                ];
            }
        }

        // 🔥 Status akhir
        if (!empty($diagnosisFinal) || !empty($kemungkinanKerusakan)) {
            $statusDiagnosis = 'selesai';
        } else {
            $statusDiagnosis = 'tidak_ditemukan';
        }

        return response()->json([
            'success'               => true,
            'status_diagnosis'      => $statusDiagnosis,
            'message'               => $this->generatePesan(
                $statusDiagnosis,
                count($diagnosisFinal),
                count($kemungkinanKerusakan)
            ),
            'hasil_diagnosis'       => $diagnosisFinal,
            'kemungkinan_kerusakan' => $kemungkinanKerusakan,
        ]);
    }

    private function generatePesan($status, $jumlahFinal, $jumlahKemungkinan)
    {
        if ($status === 'tidak_ditemukan') {
            return 'Tidak ada kerusakan yang cocok. Coba pilih gejala lain.';
        }

        $parts = [];
        if ($jumlahFinal > 0) {
            $parts[] = "{$jumlahFinal} diagnosis final";
        }
        if ($jumlahKemungkinan > 0) {
            $parts[] = "{$jumlahKemungkinan} kemungkinan kerusakan";
        }

        return 'Ditemukan ' . implode(' dan ', $parts) . '.';
    }

    private function getDetailGejala(array $kodeGejalaArray): array
    {
        if (empty($kodeGejalaArray)) return [];

        return Gejala::whereIn('kode_gejala', $kodeGejalaArray)
            ->get()
            ->map(fn($g) => [
                'kode_gejala' => $g->kode_gejala,
                'nama_gejala' => $g->nama_gejala,
                'kategori'    => $g->kategori,
                'deskripsi'   => $g->deskripsi,
            ])
            ->toArray();
    }


    public function getVespaSmartData(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');

        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan.'
            ], 400);
        }

        $gejala = Gejala::where('jenis_motor', $jenisMotor)
            ->orderBy('kode_gejala')
            ->get()
            ->groupBy('kategori');

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
