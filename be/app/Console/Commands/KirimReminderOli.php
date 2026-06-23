<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * ⚠️ DEPRECATED — Command ini sudah TIDAK DIPAKAI LAGI.
 *
 * Sebelumnya command ini dijalankan via cron job setiap hari jam 08.00
 * untuk cek H-7/H-3/H-1 dan mengirim notifikasi.
 *
 * Sekarang notifikasi dikirim langsung saat user input KM baru
 * (lihat ServisController::store()), berbasis perubahan status
 * (aman -> segera -> kritis), tanpa perlu scheduler/cron sama sekali.
 *
 * File ini dibiarkan sebagai no-op agar tidak error kalau masih
 * terdaftar di Kernel.php. Silakan hapus pendaftarannya di Kernel.php
 * dan file ini boleh dihapus kapan saja.
 */
class KirimReminderOli extends Command
{
    protected $signature   = 'reminder:kirim-oli';
    protected $description = '[DEPRECATED] Tidak dipakai lagi - notifikasi kini event-based di ServisController';

    public function handle()
    {
        $this->warn('Command ini sudah tidak dipakai lagi. Hapus pendaftarannya di app/Console/Kernel.php.');
    }
}
