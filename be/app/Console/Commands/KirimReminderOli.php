<?php

namespace App\Console\Commands;

use App\Models\CatatanServis;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class KirimReminderOli extends Command
{
    protected $signature   = 'reminder:kirim-oli';
    protected $description = 'Kirim notifikasi reminder ganti oli ke user';

    public function handle()
    {
        $hari_ini = Carbon::today();

        $daftarServis = CatatanServis::with('user')
            ->where('sudah_ganti_oli', 0)
            ->where('tanggal_mulai_notif', '<=', $hari_ini)
            ->where('estimasi_tanggal_deadline', '>=', $hari_ini)
            ->get();
        $this->info("Jumlah servis ditemukan: " . $daftarServis->count());

        foreach ($daftarServis as $servis) {
            $user     = $servis->user;
            $sisaHari = (int) $hari_ini->diffInDays($servis->estimasi_tanggal_deadline);
            $estKm    = $servis->estimasi_km_sekarang;

            $this->info("Servis ID: {$servis->id}, Sisa hari: {$sisaHari}, Token: {$user->expo_push_token}");

            // Hanya kirim di H-7, H-3, H-1
            // if (!in_array($sisaHari, [7, 3, 1])) {
            //     $this->warn("Skip - sisa hari {$sisaHari} tidak masuk H-7, H-3, H-1");
            //     continue;
            // }

            // ✅ Cek token dulu sebelum lanjut
            if (empty($user->expo_push_token)) {
                $this->warn("Skip - token kosong untuk user: {$user->email}");
                continue;
            }

            // Cek sudah pernah kirim hari ini belum
            $sudahKirim = DB::table('log_notifikasi')
                ->where('catatan_servis_id', $servis->id)
                ->where('hari_sebelum_deadline', $sisaHari)
                ->exists();

            if ($sudahKirim) {
                $this->warn("Skip - sudah pernah kirim H-{$sisaHari} untuk servis ID: {$servis->id}");
                continue;
            }

            $judul = 'Pengingat Ganti Oli';
            $pesan = "Estimasi KM kamu {$estKm} km. Ganti oli {$sisaHari} hari lagi!";

            // 1. Kirim push notification ke HP
            $berhasil = $this->kirimExpoNotifikasi(
                $user->expo_push_token,
                $judul,
                $pesan,
                [
                    'tipe'        => 'reminder_oli',
                    'servis_id'   => (string) $servis->id,
                    'sisa_hari'   => (string) $sisaHari,
                    'estimasi_km' => (string) $estKm,
                ]
            );

            if ($berhasil) {
                // 2. Simpan ke log_notifikasi
                DB::table('log_notifikasi')->insert([
                    'catatan_servis_id'     => $servis->id,
                    'user_id'               => $user->id_user,
                    'judul'                 => $judul,
                    'pesan'                 => $pesan,
                    'hari_sebelum_deadline' => $sisaHari,
                    'terkirim_at'           => now(),
                ]);

                // 3. Simpan ke notifikasi_user
                DB::table('notifikasi_user')->insert([
                    'user_id'    => $user->id_user,
                    'judul'      => $judul,
                    'pesan'      => $pesan,
                    'tipe'       => 'reminder_oli',
                    'created_at' => now(),
                ]);

                $this->info("Terkirim ke: {$user->email} (H-{$sisaHari})");
            }
        }

        $this->info('Selesai.');
    }

    private function kirimExpoNotifikasi(
        string $token,
        string $judul,
        string $pesan,
        array $data = []
    ): bool {
        if (!str_starts_with($token, 'ExponentPushToken[')) {
            $this->warn("Token tidak valid: {$token}");
            return false;
        }

        $response = Http::withHeaders([
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ])->post('https://exp.host/--/api/v2/push/send', [
            'to'    => $token,
            'title' => $judul,
            'body'  => $pesan,
            'data'  => $data,
            'sound' => 'default',
            'badge' => 1,
        ]);

        if ($response->failed()) {
            $this->error("Gagal kirim: " . $response->body());
            return false;
        }

        return true;
    }
}