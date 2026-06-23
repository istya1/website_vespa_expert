<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class CatatanServis extends Model
{
    protected $table = 'catatan_servis';

    protected $fillable = [
        'kendaraan_id',
        'user_id',
        'km_sekarang',
        'rata_rata_km_per_hari',
        'interval_ganti_oli',
        'waktu_input',
        'km_target_oli',
        'estimasi_tanggal_deadline',
        'tanggal_mulai_notif',
        'sudah_ganti_oli',
        'tanggal_ganti_oli',
        'status_terakhir', // ✅ baru: simpan status terakhir (aman/segera/kritis)
    ];

    protected $casts = [
        'estimasi_tanggal_deadline' => 'date',
        'tanggal_mulai_notif'       => 'date',
        'tanggal_ganti_oli'         => 'date',
        'waktu_input'               => 'datetime',
        'sudah_ganti_oli'           => 'boolean',
    ];

    // ── Relasi ──────────────────────────────────────────
    public function kendaraan()
    {
        return $this->belongsTo(Kendaraan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }

    public function logNotifikasi()
    {
        return $this->hasMany(LogNotifikasi::class);
    }

    // ── Computed Attributes (accessor) ──────────────────

    // KM estimasi hari ini (dihitung otomatis, tidak disimpan)
    public function getEstimasiKmSekarangAttribute(): int
    {
        $hariBerlalu = (int) $this->waktu_input->diffInDays(now());
        return $this->km_sekarang + ($this->rata_rata_km_per_hari * $hariBerlalu);
    }

    // Sisa KM menuju ganti oli (basis utama status sekarang)
    public function getSisaKmAttribute(): int
    {
        return max(0, $this->km_target_oli - $this->estimasi_km_sekarang);
    }

    // Sisa hari menuju deadline (tetap dihitung untuk tampilan info saja,
    // TIDAK lagi dipakai untuk menentukan status)
    public function getSisaHariAttribute(): int
    {
        return max(0, (int) now()->diffInDays($this->estimasi_tanggal_deadline, false));
    }

    /**
     * ✅ Status kondisi berbasis SISA KM (bukan tanggal/hari lagi).
     *
     * sisa_km > 30   -> aman
     * 10 < sisa_km <= 30 -> segera
     * sisa_km <= 10  -> kritis
     */
    public function getStatusKondisiAttribute(): string
    {
        if ($this->sudah_ganti_oli) return 'selesai';

        $sisaKm = $this->sisa_km;

        if ($sisaKm <= 10) return 'kritis';
        if ($sisaKm <= 30) return 'segera';
        return 'aman';
    }
}
