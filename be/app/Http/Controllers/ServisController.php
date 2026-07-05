<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CatatanServis;
use App\Models\Kendaraan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ServisController extends Controller
{
    /**
     * Urutan tingkat keparahan status.
     * Dipakai oleh statusNaikLevel() untuk membandingkan status lama vs baru.
     * aman=0 (paling ringan), segera=1, kritis=2 (paling parah)
     */
    private const URUTAN_STATUS = [
        'aman'   => 0,
        'segera' => 1,
        'kritis' => 2,
    ];

    /**
     * Menentukan status kondisi oli berdasarkan sisa KM.
     * Dipanggil oleh store() setelah data servis disimpan.
     * Hasilnya disimpan ke kolom status_terakhir di tabel catatan_servis.
     */
    private function tentukanStatus(int $sisaKm): string
    {
        if ($sisaKm <= 150) {
            return 'kritis'; // → warna merah di aplikasi
        } elseif ($sisaKm <= 450) {
            return 'segera'; // → warna kuning di aplikasi
        }
        return 'aman'; // → warna biru di aplikasi
    }

    /**
     * Mengecek apakah status naik ke level lebih parah.
     * Dipakai untuk menentukan field notifikasi_terkirim di response store().
     * 
     * Contoh: status_terakhir di DB = 'aman', status baru = 'kritis' → true (naik level)
     * Contoh: status_terakhir di DB = 'kritis', status baru = 'kritis' → false (tidak naik)
     * 
     * Jika status_terakhir belum ada (null = pertama kali input),
     * dianggap naik level hanya jika status baru bukan 'aman'.
     */
    private function statusNaikLevel(?string $statusLama, string $statusBaru): bool
    {
        if ($statusLama === null) {
            return $statusBaru !== 'aman';
        }

        // Ambil angka level dari konstanta URUTAN_STATUS
        $levelLama = self::URUTAN_STATUS[$statusLama] ?? 0;
        $levelBaru = self::URUTAN_STATUS[$statusBaru] ?? 0;

        // True jika level baru lebih tinggi (lebih parah) dari level lama
        return $levelBaru > $levelLama;
    }

    /**
     * Membuat teks judul dan pesan notifikasi sesuai status.
     * Dipanggil saat akan mengirim notifikasi (meski sekarang
     * pengiriman notifikasi dilakukan di sisi frontend).
     */
    private function pesanStatus(string $status, int $sisaKm, int $kmTarget): array
    {
        $kmTargetFmt = number_format($kmTarget, 0, ',', '.');
        $sisaKmFmt   = number_format($sisaKm, 0, ',', '.');

        return match ($status) {
            'kritis' => [
                'judul' => '🔴 Ganti Oli Sekarang!',
                'pesan' => "Sisa {$sisaKmFmt} km lagi sebelum target {$kmTargetFmt} km. Segera ganti oli!",
            ],
            'segera' => [
                'judul' => '⚠️ Oli Hampir Habis',
                'pesan' => "Sisa {$sisaKmFmt} km lagi sebelum target {$kmTargetFmt} km. Mulai rencanakan ganti oli.",
            ],
            default => [
                'judul' => '✅ Motor Kamu Aman',
                'pesan' => "Sisa {$sisaKmFmt} km lagi sebelum target ganti oli di {$kmTargetFmt} km.",
            ],
        };
    }

    /**
     * GET /servis/{kendaraan_id}
     * Dipanggil frontend saat halaman Vespa Care dibuka atau di-refresh.
     * Mengambil data servis terbaru yang belum ganti oli.
     * Data yang dikembalikan dipakai untuk menampilkan kartu status di halaman Vespa Care.
     */
    public function show(Request $request, int $kendaraanId)
    {
        $userId = $request->user()->id_user;

        // Pastikan kendaraan ini milik user yang sedang login
        Kendaraan::where('id', $kendaraanId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Ambil data servis terbaru yang belum ganti oli
        // dari tabel catatan_servis
        $servis = CatatanServis::where('kendaraan_id', $kendaraanId)
            ->where('sudah_ganti_oli', 0)
            ->latest('waktu_input')
            ->first();

        if (!$servis) {
            return response()->json([
                'berhasil' => false,
                'pesan'    => 'Belum ada data servis',
            ], 404);
        }

        // Kembalikan data ke frontend
        // estimasi_km_sekarang, sisa_km, sisa_hari, status_kondisi
        // dihitung otomatis oleh Model CatatanServis (computed attribute)
        return response()->json([
            'berhasil' => true,
            'data'     => [
                'id'                        => $servis->id,
                'km_sekarang'           => $servis->km_sekarang,
                'rata_rata_km_per_hari' => $servis->rata_rata_km_per_hari,
                'estimasi_km_sekarang'      => $servis->estimasi_km_sekarang, // ← dari accessor Model
                'km_target_oli'             => $servis->km_target_oli,
                'sisa_km'                   => $servis->sisa_km,              // ← dari accessor Model
                'sisa_hari'                 => $servis->sisa_hari,            // ← dari accessor Model
                'estimasi_tanggal_deadline' => $servis->estimasi_tanggal_deadline->format('d M Y'),
                'status_kondisi'            => $servis->status_kondisi,       // ← dari accessor Model
                'sudah_ganti_oli'           => $servis->sudah_ganti_oli,
            ],
        ]);
    }

    /**
     * POST /servis
     * Dipanggil frontend saat pengguna menekan tombol "Simpan & Hitung Otomatis".
     * Menyimpan data KM baru, menghitung target dan deadline,
     * lalu menentukan status kondisi oli saat ini.
     */
    public function store(Request $request)
    {
        // Validasi input dari frontend
        $validated = $request->validate([
            'kendaraan_id'          => 'required|integer',
            'km_sekarang'           => 'required|integer|min:0',
            'rata_rata_km_per_hari' => 'required|integer|min:1',
            'interval_ganti_oli'    => 'nullable|integer|min:1',
            'expo_push_token'       => 'nullable|string',
        ]);

        $userId = $request->user()->id_user;

        // Pastikan kendaraan milik user yang login
        $kendaraan = Kendaraan::where('id', $validated['kendaraan_id'])
            ->where('user_id', $userId)
            ->firstOrFail();

        // Simpan expo_push_token ke tabel users
        // Token ini dipakai untuk push notification di masa mendatang
        if (!empty($validated['expo_push_token'])) {
            $request->user()->update(['expo_push_token' => $validated['expo_push_token']]);
        }

        // Hitung target KM dan estimasi deadline
        $interval     = $validated['interval_ganti_oli'] ?? 3000; // default 3000 km
        $kmTarget     = $validated['km_sekarang'] + $interval;    // target KM harus ganti oli
        $hariDeadline = (int) ceil($interval / $validated['rata_rata_km_per_hari']); // estimasi hari
        $deadline     = Carbon::now()->addDays($hariDeadline);    // estimasi tanggal deadline
        $mulaiNotif   = $deadline->copy()->subDays(7);            // mulai notif H-7 sebelum deadline

        // Ambil status_terakhir dari data servis sebelumnya
        // untuk dibandingkan dengan status baru (apakah naik level atau tidak)
        $servisSebelumnya = CatatanServis::where('kendaraan_id', $kendaraan->id)
            ->where('sudah_ganti_oli', 0)
            ->latest('waktu_input')
            ->first();

        $statusLama = $servisSebelumnya?->status_terakhir; // null jika belum ada data sebelumnya

        // Simpan data servis baru ke tabel catatan_servis
        $servis = CatatanServis::create([
            'kendaraan_id'              => $kendaraan->id,
            'user_id'                   => $userId,
            'km_sekarang'               => $validated['km_sekarang'],
            'rata_rata_km_per_hari'     => $validated['rata_rata_km_per_hari'],
            'interval_ganti_oli'        => $interval,
            'waktu_input'               => Carbon::now(),
            'km_target_oli'             => $kmTarget,
            'estimasi_tanggal_deadline' => $deadline,
            'tanggal_mulai_notif'       => $mulaiNotif,
        ]);

        // Hitung status baru dari sisa_km (diambil dari accessor Model)
        $sisaKm     = $servis->sisa_km;
        $statusBaru = $this->tentukanStatus($sisaKm);

        // Cek apakah status naik level (untuk info ke frontend)
        $naikLevel  = $this->statusNaikLevel($statusLama, $statusBaru);

        // Simpan status_terakhir ke tabel catatan_servis
        // Dipakai sebagai pembanding saat input KM berikutnya
        $servis->update(['status_terakhir' => $statusBaru]);

        // Kembalikan response ke frontend
        // Frontend akan menjadwalkan local notification berdasarkan status_kondisi ini
        return response()->json([
            'berhasil' => true,
            'pesan'    => 'Data servis berhasil disimpan',
            'data'     => [
                'status_kondisi'      => $statusBaru,
                'sisa_km'             => $sisaKm,
                'notifikasi_terkirim' => $naikLevel, // true jika status naik level
            ],
        ]);
    }

    /**
     * PATCH /servis/{id}/konfirmasi
     * Dipanggil frontend saat pengguna menekan tombol "Tandai Sudah Ganti Oli".
     * Mengupdate status ganti oli dan mereset status_terakhir ke 'aman'
     * agar siklus monitoring berikutnya dimulai dari awal.
     */
    public function konfirmasiGantiOli(Request $request, int $id)
    {
        $userId = $request->user()->id_user;

        // Ambil data servis milik user dari tabel catatan_servis
        $servis = CatatanServis::where('user_id', $userId)
            ->findOrFail($id);

        // Update kolom di tabel catatan_servis:
        // sudah_ganti_oli → 1 (selesai)
        // tanggal_ganti_oli → tanggal hari ini
        // status_terakhir → reset ke 'aman' untuk siklus berikutnya
        $servis->update([
            'sudah_ganti_oli'   => 1,
            'tanggal_ganti_oli' => Carbon::today(),
            'status_terakhir'   => 'aman',
        ]);

        return response()->json([
            'berhasil' => true,
            'pesan'    => 'Konfirmasi ganti oli berhasil dicatat!',
        ]);
    }

    /**
     * GET /servis/{kendaraan_id}/riwayat
     * Dipanggil frontend untuk menampilkan riwayat ganti oli.
     * Mengambil semua data servis kendaraan (sudah maupun belum ganti oli)
     * dari tabel catatan_servis, diurutkan dari yang terbaru.
     */
    public function riwayat(Request $request, int $kendaraanId)
    {
        $userId = $request->user()->id_user;

        // Pastikan kendaraan milik user yang login
        Kendaraan::where('id', $kendaraanId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Ambil semua riwayat servis dari tabel catatan_servis
        // lalu format datanya untuk dikirim ke frontend
        $riwayat = CatatanServis::where('kendaraan_id', $kendaraanId)
            ->latest('waktu_input')
            ->get()
            ->map(fn($s) => [
                'id'                => $s->id,
                'km_sekarang'       => $s->km_sekarang,
                'km_target_oli'     => $s->km_target_oli,
                'tanggal_input'     => $s->waktu_input->format('d M Y'),
                'tanggal_deadline'  => $s->estimasi_tanggal_deadline->format('d M Y'),
                'tanggal_ganti_oli' => $s->tanggal_ganti_oli?->format('d M Y'), // null jika belum ganti
                'sudah_ganti_oli'   => $s->sudah_ganti_oli,
            ]);

        return response()->json(['berhasil' => true, 'data' => $riwayat]);
    }

    /**
     * GET /admin/servis
     * Hanya bisa diakses oleh role admin atau superadmin.
     * Mengembalikan semua data servis seluruh pengguna
     * beserta relasi data user dan kendaraan, dengan pagination.
     */
    public function adminIndex(Request $request)
    {
        // Cek role — tolak akses jika bukan admin/superadmin
        if (!in_array($request->user()->role, ['admin', 'superadmin'])) {
            return response()->json([
                'berhasil' => false,
                'pesan'    => 'Akses ditolak'
            ], 403);
        }

        $perPage = $request->get('per_page', 50);

        // Ambil semua data dari tabel catatan_servis
        // beserta relasi ke tabel users dan kendaraan
        $data = CatatanServis::with(['user', 'kendaraan'])
            ->latest()
            ->paginate($perPage);

        return response()->json(['berhasil' => true, 'data' => $data]);
    }
}
