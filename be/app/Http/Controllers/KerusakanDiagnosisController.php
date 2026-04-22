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
        // Array untuk menyimpan hasil diagnosa final (100% cocok)
        $diagnosisFinal = [];

        // Array untuk menyimpan kemungkinan kerusakan (tidak full match)
        $kemungkinanKerusakan = [];

        // 1. ambil input user
        // Ambil gejala yang dipilih user (default array kosong)
        $gejalaTerpilih = $request->gejala ?? [];
        // Ambil jenis motor
        $jenisMotor     = $request->jenis_motor;

        //2. Validasi: jenis motor wajib ada (mencegah diagnosa tanpa data)
        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan.'
            ], 400);
        }
        // Validasi: gejala harus dipilih
        if (empty($gejalaTerpilih)) {
            return response()->json([
                'success' => false,
                'message' => 'Gejala belum dipilih.'
            ], 400);
        }

        //3. mengambil basis pengaturan aturan
        // 🔥 Ambil semua aturan + relasi gejala dan kerusakan sesuai jenis motor
        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotor) {
                // Filter hanya aturan yang kerusakannya sesuai jenis motor
                $q->where('jenis_motor', $jenisMotor);
            })
            ->get();

        // 4. Loop setiap aturan
        foreach ($aturanList as $aturan) {

            // 5. Ambil semua kode gejala dalam aturan ini
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();

            // Hitung total gejala dalam aturan
            $totalGejala  = count($gejalaAturan);

            // Jika aturan tidak punya gejala → skip
            if ($totalGejala === 0) continue;

            // 6. Cocokkan dengan input user Ambil gejala yang cocok antara user dan aturan
            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);

            // 7. Hitung jumlah gejala yang cocok
            $jumlahMatch = count($gejalaMatch);
            // Jika tidak ada yang cocok → skip aturan ini
            if ($jumlahMatch === 0) continue;

            // 8. Hitung total bobot dari gejala yang cocok
            $totalBobot = Gejala::with('kategori')
                ->whereIn('kode_gejala', $gejalaMatch)
                ->get()
                ->sum(function ($g) {
                    return $g->kategori->bobot;
                });

            // 9. Tentukan prioritas berdasarkan total bobot
            if ($totalBobot >= 5) {
                $prioritas = 'Tinggi';
            } elseif ($totalBobot >= 3) {
                $prioritas = 'Sedang';
            } else {
                $prioritas = 'Rendah';
            }

            // Ambil gejala yang belum dipilih user (untuk saran tambahan)
            $gejalaBelum = array_diff($gejalaAturan, $gejalaTerpilih);

            //10. Hitung persentase kecocokan
            $persentase  = ($jumlahMatch / $totalGejala) * 100;

            //11. LOGIKA UTAMA
            // =========================
            // CASE A: FULL MATCH (100%)
            // =========================
            if ($jumlahMatch === $totalGejala) {

                $diagnosisFinal[] = [
                    'id_aturan'            => $aturan->id_aturan, // id aturan
                    'kode_kerusakan'       => $aturan->kerusakan->kode_kerusakan, // kode kerusakan
                    'nama_kerusakan'       => $aturan->kerusakan->nama_kerusakan, // nama kerusakan
                    'solusi'               => $aturan->kerusakan->solusi, // solusi

                    // karena semua gejala cocok → 100%
                    'persentase_kecocokan' => 100,

                    'jumlah_gejala'        => $totalGejala,
                    'label'                => 'Diagnosis Final',
                    'status'               => 'final',

                    // 🔥 tambahan analisis
                    'prioritas'            => $prioritas,
                    'total_bobot'          => $totalBobot,
                ];
            } else {

                // =========================
                // CASE B: PARTIAL MATCH
                // =========================
                $kemungkinanKerusakan[] = [
                    'id_aturan'      => $aturan->id_aturan,
                    'kode_kerusakan' => $aturan->kerusakan->kode_kerusakan,
                    'nama_kerusakan' => $aturan->kerusakan->nama_kerusakan,
                    'solusi'         => $aturan->kerusakan->solusi,
                    'label'          => 'Kemungkinan Kerusakan',

                    // 🔥 prioritas berdasarkan bobot
                    'prioritas'      => $prioritas,
                    'total_bobot'    => $totalBobot,

                    // Detail kecocokan
                    'kecocokan' => [
                        'persentase'      => round($persentase, 2), // persentase kecocokan
                        'sudah_cocok'     => $jumlahMatch, // jumlah gejala cocok
                        'total_rule'      => $totalGejala, // total gejala aturan
                        'sisa_konfirmasi' => count($gejalaBelum), // gejala belum dipilih
                    ],

                    // Detail gejala (sudah & belum dipilih)
                    'gejala' => [
                        'sudah_dipilih'      => $this->getDetailGejala(array_values($gejalaMatch)),
                        'perlu_dikonfirmasi' => $this->getDetailGejala(array_values($gejalaBelum)),
                    ],

                    'status' => 'kemungkinan',
                ];
            }
        }

        // 🔥 Tentukan status akhir diagnosa
        if (!empty($diagnosisFinal) || !empty($kemungkinanKerusakan)) {
            $statusDiagnosis = 'selesai';
        } else {
            $statusDiagnosis = 'tidak_ditemukan';
        }

        // Return hasil diagnosa ke frontend
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

    // =========================
    // FUNCTION: GENERATE PESAN
    // =========================
    private function generatePesan($status, $jumlahFinal, $jumlahKemungkinan)
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
                'kategori'    => $g->kategori->nama,
                'bobot'       => $g->kategori->bobot, // 🔥 penting
            ])
            ->toArray();
    }

    // =========================
    // FUNCTION: DATA SMART UI
    // =========================
    public function getVespaSmartData(Request $request)
    {
        // Ambil jenis motor
        $jenisMotor = $request->query('jenis_motor');

        // Validasi
        if (!$jenisMotor) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter jenis_motor diperlukan.'
            ], 400);
        }

        // Ambil gejala lalu kelompokkan berdasarkan kategori
        $gejala = Gejala::with('kategori')
            ->where('jenis_motor', $jenisMotor)
            ->get()
            ->groupBy(function ($g) {
                return $g->kategori->nama;
            });

        // Ambil jumlah aturan
        $aturan = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', fn($q) => $q->where('jenis_motor', $jenisMotor))
            ->get();

        // Return data ke frontend
        return response()->json([
            'success'            => true,
            'jenis_motor'        => $jenisMotor,
            'gejala_by_kategori' => $gejala,
            'total_aturan'       => $aturan->count()
        ]);
    }
}
