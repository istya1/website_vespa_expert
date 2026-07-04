<?php

namespace App\Http\Controllers;

use App\Models\Gejala;
use App\Models\Aturan;
use App\Models\Kerusakan;
use Illuminate\Http\Request;

class KerusakanDiagnosisController extends Controller
{
    /**
     * POST /diagnosis
     * Endpoint utama: terima gejala yang dipilih user, cocokkan ke semua
     * rule (aturan) yang ada, lalu kembalikan diagnosis final (full match)
     * dan/atau kemungkinan kerusakan (partial match) yang masih perlu
     * dikonfirmasi lebih lanjut.
     */
    public function prosesDiagnosis(Request $request)
    {
        // Ambil gejala terpilih dari request. Ada 2 nama field yang dicoba
        // (gejala_terpilih ATAU gejala) — kemungkinan untuk kompatibilitas
        // kalau frontend pernah ganti nama field, atau ada 2 versi client berbeda
        $gejalaTerpilih = $request->gejala_terpilih ?? $request->gejala ?? []; //Metode Forward chaining
        $jenisMotor     = $request->jenis_motor;

        // Logging untuk debug — supaya developer bisa cek di log
        // apa saja yang benar-benar dikirim dari mobile
        \Log::info('DEBUG:', [
            'jenis_motor' => $jenisMotor,
            'gejala'      => $gejalaTerpilih,
        ]);

        $diagnosisFinal       = []; // tempat hasil yang SUDAH PASTI (100% match)
        $kemungkinanKerusakan = []; // tempat hasil yang MASIH MUNGKIN (partial match)

        // Cari ID jenis motor dari namanya (mobile kirim nama string, bukan ID)
        $jenisMotorModel = \App\Models\JenisMotor::where('nama_motor', $jenisMotor)->first();

        if (!$jenisMotorModel) {
            return response()->json(['success' => false, 'message' => 'Jenis motor tidak ditemukan.'], 404);
        }

        // Ambil SEMUA rule (aturan) yang kerusakannya termasuk jenis motor ini.
        // whereHas -> filter Aturan berdasarkan kondisi di tabel relasi (kerusakan),
        // tanpa whereHas, tidak bisa filter berdasarkan kolom yang ada di tabel lain
        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', function ($q) use ($jenisMotorModel) {
                $q->where('jenis_motor_id', $jenisMotorModel->id_jenis_motor);
            })
            ->get();

        $kodeKerusakanFinal = [];

        // ============================================================
        // PASS 1: Cari semua aturan yang FULL MATCH terlebih dahulu,
        // untuk tahu gejala mana yang sudah "terpakai" oleh diagnosis final.
        // ============================================================
        $gejalaSudahDipakaiFinal = [];

        foreach ($aturanList as $aturan) {
            // Ambil semua kode_gejala yang termasuk rule ini
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();
            $totalGejala  = count($gejalaAturan);
            if ($totalGejala === 0) continue; // skip rule kosong (data tidak valid)

            // array_intersect -> cari gejala yang ADA di kedua array
            // (gejala yang dipilih user, DAN termasuk dalam rule ini)
            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);
            $jumlahMatch = count($gejalaMatch);

            // FULL MATCH = semua gejala dalam rule ini sudah dipilih user
            if ($jumlahMatch === $totalGejala) {
                // Catat semua gejala rule ini sebagai "sudah terpakai"
                $gejalaSudahDipakaiFinal = array_merge($gejalaSudahDipakaiFinal, $gejalaAturan);
                $kodeKerusakanFinal[]    = $aturan->kerusakan->kode_kerusakan;
            }
        }
        // Hilangkan duplikat (kalau gejala yang sama ikut di beberapa rule final)
        $gejalaSudahDipakaiFinal = array_unique($gejalaSudahDipakaiFinal);

        // ============================================================
        // PASS 2: Susun hasil akhir (Full & Partial) dengan filter
        // supaya tidak ada duplikasi/tumpang tindih dari PASS 1.
        // ============================================================
        foreach ($aturanList as $aturan) {
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')->toArray();
            $totalGejala  = count($gejalaAturan);
            if ($totalGejala === 0) continue;

            $gejalaMatch = array_intersect($gejalaTerpilih, $gejalaAturan);
            $jumlahMatch = count($gejalaMatch);

            // Kalau tidak ada gejala yang cocok sama sekali, rule ini
            // tidak relevan untuk user ini -> skip total
            if ($jumlahMatch === 0) continue;

            $persentase    = ($jumlahMatch / $totalGejala) * 100;
            // array_diff -> gejala yang ADA di rule tapi BELUM dipilih user
            // (ini yang nanti jadi 'perlu_dikonfirmasi')
            $gejalaBelum   = array_diff($gejalaAturan, $gejalaTerpilih);
            $kodeKerusakan = $aturan->kerusakan->kode_kerusakan;

            // ========================
            // CASE A: FULL MATCH
            // ========================
            if ($jumlahMatch === $totalGejala) {

                // Cek apakah rule ini cuma "versi kecil" dari rule lain yang
                // juga full match dan mencakup semua gejala rule ini PLUS lebih
                // -> kalau iya, jangan tampilkan rule kecil ini, karena
                // rule yang lebih besar/spesifik sudah cukup mewakilinya
                $isSubsetDariAturanLain = $this->isSubsetDariAturanLain(
                    $gejalaAturan,
                    $aturanList,
                    $gejalaTerpilih,
                    $aturan->id_aturan
                );

                if ($isSubsetDariAturanLain) {
                    continue; // skip, jangan dobel laporkan
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
                ];

            // ========================
            // CASE B: PARTIAL MATCH
            // ========================
            } else {

                // Kalau kerusakan ini SUDAH dipastikan lewat rule lain
                // (full match), tidak perlu tampilkan lagi versi "kemungkinan"-nya
                // -> mencegah satu kerusakan muncul dua kali (sudah final + masih ragu)
                if (in_array($kodeKerusakan, $kodeKerusakanFinal)) continue;

                // Cek: apakah SEMUA gejala yang match di sini
                // sebenarnya sudah "dipakai" oleh diagnosis final lain?
                // Kalau iya, berarti partial match ini tidak menambah info baru
                // (gejalanya sudah "terjawab" oleh kerusakan yang sudah pasti),
                // jadi tidak perlu ditampilkan sebagai opsi terpisah
                $gejalaMatchArray  = array_values($gejalaMatch);
                $semuaSudahDipakai = count(array_diff($gejalaMatchArray, $gejalaSudahDipakaiFinal)) === 0;
                if ($semuaSudahDipakai) continue;

                $kemungkinanKerusakan[] = [
                    'id_aturan'      => $aturan->id_aturan,
                    'kode_kerusakan' => $kodeKerusakan,
                    'nama_kerusakan' => $aturan->kerusakan->nama_kerusakan,
                    'solusi'         => $aturan->kerusakan->solusi,
                    'label'          => 'Kemungkinan Kerusakan',
                    'kecocokan'      => [
                        'persentase'      => round($persentase, 2),
                        'sudah_cocok'     => $jumlahMatch,
                        'total_rule'      => $totalGejala,
                        'sisa_konfirmasi' => count($gejalaBelum),
                    ],
                    'gejala' => [
                        // Detail lengkap (nama, kategori) gejala yang SUDAH dipilih user
                        'sudah_dipilih'      => $this->getDetailGejala(array_values($gejalaMatch)),
                        // Detail lengkap gejala yang MASIH perlu ditanyakan
                        // -> inilah yang dibaca fungsi tentukanLangkahSelanjutnya() di mobile!
                        'perlu_dikonfirmasi' => $this->getDetailGejala(array_values($gejalaBelum)),
                    ],
                    'status' => 'kemungkinan',
                ];
            }
        }

        // Filter pengaman tambahan (jaga-jaga kalau ada yang lolos dari logika di atas)
        $kemungkinanKerusakan = array_values(array_filter(
            $kemungkinanKerusakan,
            fn($k) => !in_array($k['kode_kerusakan'], $kodeKerusakanFinal)
        ));

        // Urutkan dari yang paling besar persentase kecocokannya
        // -> supaya user lihat kemungkinan paling relevan duluan
        usort($kemungkinanKerusakan, fn($a, $b) =>
            $b['kecocokan']['persentase'] <=> $a['kecocokan']['persentase']
        );

        // Status keseluruhan: kalau ada hasil apapun (final atau kemungkinan) -> 'selesai'
        // kalau benar-benar tidak ada satupun rule yang cocok -> 'tidak_ditemukan'
        $statusDiagnosis = (!empty($diagnosisFinal) || !empty($kemungkinanKerusakan))
            ? 'selesai'
            : 'tidak_ditemukan';

        // ada_konfirmasi = true HANYA kalau:
        // - ada kemungkinan kerusakan yang masih perlu konfirmasi gejala
        // - DAN belum ada satupun diagnosis yang sudah pasti (final)
        // Kalau sudah ada yang final, tidak perlu tanya lagi -> langsung tampilkan hasil
        $adaKonfirmasi = count($kemungkinanKerusakan) > 0 && count($diagnosisFinal) === 0;

        return response()->json([
            'success'               => true,
            'status_diagnosis'      => $statusDiagnosis,
            'message'               => $this->generatePesan($statusDiagnosis, count($diagnosisFinal), count($kemungkinanKerusakan)),
            'hasil_diagnosis'       => $diagnosisFinal,
            'kemungkinan_kerusakan' => $kemungkinanKerusakan,
            'ada_konfirmasi'        => $adaKonfirmasi,
        ]);
    }

    /**
     * Cek apakah satu rule ($gejalaAturan) sebenarnya cuma "versi kecil"
     * (subset) dari rule lain yang juga full match dan punya gejala lebih banyak.
     * Tujuannya: kalau rule besar sudah mencakup rule kecil, jangan tampilkan
     * dua-duanya — cukup rule yang lebih besar/spesifik saja.
     */
    private function isSubsetDariAturanLain(
        array $gejalaAturan,           // gejala dari rule yang sedang dicek
        \Illuminate\Support\Collection $aturanList,
        array $gejalaTerpilih,
        int $excludeId                 // id rule yang sedang dicek (jangan bandingkan ke dirinya sendiri)
    ): bool {
        foreach ($aturanList as $aturanLain) {
            if ($aturanLain->id_aturan === $excludeId) continue; // skip diri sendiri

            $gejalaAturanLain = $aturanLain->gejala->pluck('kode_gejala')->toArray();
            $matchLain = array_intersect($gejalaTerpilih, $gejalaAturanLain);

            // Rule lain ini juga harus FULL MATCH (semua gejalanya dipilih user)
            if (count($matchLain) !== count($gejalaAturanLain)) continue;

            // Rule lain ini harus punya LEBIH BANYAK gejala dari rule yang dicek
            // (kalau sama atau lebih kecil, bukan "superset", jadi tidak relevan)
            if (count($gejalaAturanLain) <= count($gejalaAturan)) continue;

            // Cek: apakah SEMUA gejala rule yang dicek ($gejalaAturan)
            // sebenarnya juga ada di rule lain ($gejalaAturanLain)?
            // Kalau $sisaGejala kosong, berarti $gejalaAturan adalah SUBSET dari $gejalaAturanLain
            $sisaGejala = array_diff($gejalaAturan, $gejalaAturanLain);
            if (count($sisaGejala) === 0) {
                return true; // ya, ini subset -> sebaiknya jangan ditampilkan
            }
        }
        return false;
    }

    /**
     * Bikin pesan ringkasan hasil diagnosis dalam bentuk kalimat manusiawi.
     */
    private function generatePesan(string $status, int $jumlahFinal, int $jumlahKemungkinan): string
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

        // Gabungkan jadi kalimat, misal: "Ditemukan 1 diagnosis final dan 2 kemungkinan kerusakan."
        return 'Ditemukan ' . implode(' dan ', $parts) . '.';
    }

    /**
     * Ambil detail lengkap (nama, kategori) dari sekumpulan kode gejala.
     * Dipakai untuk mengisi 'sudah_dipilih' dan 'perlu_dikonfirmasi'
     * supaya frontend tidak cuma terima kode, tapi juga nama & kategorinya.
     */
    private function getDetailGejala(array $kodeGejalaArray): array
    {
        // Kalau array kosong, langsung return kosong (hindari query sia-sia)
        if (empty($kodeGejalaArray)) return [];

        // whereIn -> ambil semua baris yang kode_gejala-nya ada di dalam array ini,
        // dalam SATU query saja (bukan query satu-satu per kode)
        return Gejala::with('kategori')
            ->whereIn('kode_gejala', $kodeGejalaArray)
            ->get()
            ->map(fn($g) => [
                'kode_gejala' => $g->kode_gejala,
                'nama_gejala' => $g->nama_gejala,
                'kategori'    => $g->kategori,
            ])
            ->toArray();
    }

    /**
     * GET /pertanyaan-awal?jenis_motor=...
     * Dipanggil SEBELUM proses diagnosis dimulai — untuk menyusun daftar
     * gejala awal yang ditampilkan ke user di layar pemilihan gejala.
     * Bukan menampilkan SEMUA gejala, tapi satu gejala "wakil" per rule,
     * supaya pertanyaan awal tidak terlalu banyak/membingungkan.
     */
    public function getPertanyaanAwal(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');

        if (!$jenisMotor) {
            return response()->json(['success' => false, 'message' => 'Parameter jenis_motor diperlukan.'], 400);
        }

        $jenisMotorModel = \App\Models\JenisMotor::where('nama_motor', $jenisMotor)->first();

        if (!$jenisMotorModel) {
            return response()->json(['success' => false, 'message' => 'Jenis motor tidak ditemukan.'], 404);
        }

        // Ambil semua rule untuk jenis motor ini, beserta gejala & kerusakannya
        $aturanList = Aturan::with(['gejala', 'kerusakan'])
            ->whereHas('kerusakan', fn($q) => $q->where('jenis_motor_id', $jenisMotorModel->id_jenis_motor))
            ->get();

        // Kumpulkan SEMUA kode gejala unik dari semua rule (untuk efisiensi query nanti)
        $semuaKodeGejala = $aturanList
            ->flatMap(fn($a) => $a->gejala->pluck('kode_gejala'))
            ->unique()
            ->values();

        // Ambil detail semua gejala itu sekali saja (1 query),
        // lalu keyBy supaya bisa diakses cepat lewat $gejalaLengkapMap->get($kode)
        // -> menghindari N+1 query (kalau di-query satu-satu di dalam loop di bawah)
        $gejalaLengkapMap = Gejala::with('kategori')
            ->whereIn('kode_gejala', $semuaKodeGejala)
            ->get()
            ->keyBy('kode_gejala');

        $pertanyaanAwal = [];

        foreach ($aturanList as $aturan) {
            // Ambil semua gejala rule ini, lalu cocokkan ke data lengkapnya
            $gejalaAturan = $aturan->gejala->pluck('kode_gejala')
                ->map(fn($kode) => $gejalaLengkapMap->get($kode))
                ->filter(); // buang null kalau ada kode tidak ditemukan

            if ($gejalaAturan->isEmpty()) continue;

            // KUNCI dari fungsi ini: daripada tampilkan SEMUA gejala dari rule ini
            // sebagai pertanyaan awal (bisa puluhan gejala, terlalu banyak!),
            // cukup pilih SATU gejala sebagai "wakil"/representatif dari rule ini.
            // Dipilih berdasarkan urutan alfabetis kode gejala (sortBy + first)
            // -> catatan: ini agak arbitrary, karena tidak ada bobot/prioritas pakar
            $wakil = $gejalaAturan->sortBy(fn($g) => $g->kode_gejala)->first();

            $pertanyaanAwal[] = [
                'id_aturan'      => $aturan->id_aturan,
                'kode_kerusakan' => $aturan->kerusakan->kode_kerusakan,
                'kode_gejala'    => $wakil->kode_gejala,
                'nama_gejala'    => $wakil->nama_gejala,
                'kategori_id'    => $wakil->kategori_id,
            ];
        }

        $totalRepresentatif = count($pertanyaanAwal);

        // Kelompokkan gejala wakil ini berdasarkan kategori_id
        // -> INILAH yang menjadi gejala_by_kategori yang diterima PilihGejalaScreen di mobile!
        $gejalaByKategori = collect($pertanyaanAwal)
            ->groupBy(fn($item) => $item['kategori_id'] ?? 'lainnya')
            ->map(fn($items) => $items->map(fn($item) => [
                'id_aturan'   => $item['id_aturan'],
                'kode_gejala' => $item['kode_gejala'],
                'nama_gejala' => $item['nama_gejala'],
            ])->values());

        return response()->json([
            'success'              => true,
            'jenis_motor'          => $jenisMotor,
            'gejala_by_kategori'   => $gejalaByKategori,
            'total_representatif'  => $totalRepresentatif,
            'total_aturan'         => $aturanList->count(),
        ]);
    }
}