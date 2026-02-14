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
        $request->validate([
            'jenis_motor' => 'required|string',
            'gejala_terpilih' => 'required|array|min:1',
        ]);

        $jenisMotor = $request->jenis_motor;
        $gejalaTerpilih = $request->gejala_terpilih;

        // Ambil aturan sesuai jenis motor
        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotor) {
                $q->where('jenis_motor', $jenisMotor);
            })
            ->get();

        $hasilDiagnosis = [];

        foreach ($aturanList as $aturan) {

            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();

            $matching = array_intersect($gejalaTerpilih, $gejalaAturan);

            $persentaseMatch = count($gejalaAturan) > 0
                ? (count($matching) / count($gejalaAturan)) * 100
                : 0;

            if ($persentaseMatch >= 70 && $aturan->kerusakan) {

                $kerusakan = $aturan->kerusakan;

                $hasilDiagnosis[] = [
                    'kode_kerusakan' => $kerusakan->kode_kerusakan,
                    'nama_kerusakan' => $kerusakan->nama_kerusakan,
                    'solusi' => $kerusakan->solusi, // ambil langsung dari tabel kerusakan
                    'persentase_kecocokan' => round($persentaseMatch, 2),
                    'gejala_cocok' => count($matching),
                    'total_gejala_aturan' => count($gejalaAturan),
                    'gejala_detail' => array_values($matching),
                ];
            }
        }

        // Urutkan berdasarkan persentase tertinggi
        usort($hasilDiagnosis, function ($a, $b) {
            return $b['persentase_kecocokan'] <=> $a['persentase_kecocokan'];
        });

        return response()->json([
            'success' => true,
            'jenis_motor' => $jenisMotor,
            'gejala_dipilih' => count($gejalaTerpilih),
            'hasil_diagnosis' => $hasilDiagnosis,
            'total_kerusakan_ditemukan' => count($hasilDiagnosis)
        ]);
    }


    public function getDetailKerusakan($kode)
    {
        $kerusakan = Kerusakan::where('kode_kerusakan', $kode)->first();

        if (!$kerusakan) {
            return response()->json([
                'success' => false,
                'message' => 'Kerusakan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'kerusakan' => $kerusakan
        ]);
    }


    public function getVespaSmartData(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');

        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan'
            ], 400);
        }

        $gejala = Gejala::where('jenis_motor', $jenisMotor)
            ->orderBy('kode_gejala')
            ->get()
            ->groupBy('kategori');

        $aturan = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotor) {
                $q->where('jenis_motor', $jenisMotor);
            })
            ->get();

        return response()->json([
            'success' => true,
            'jenis_motor' => $jenisMotor,
            'gejala_by_kategori' => $gejala,
            'total_aturan' => $aturan->count()
        ]);
    }
}
