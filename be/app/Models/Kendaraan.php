<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Kendaraan extends Model
{
    protected $table = 'kendaraan';
    
    protected $fillable = [
        'user_id',
        'nama_kendaraan',
        'nomor_plat',
        'tahun_kendaraan',
    ];

    // Relasi ke user — eksplisit semua parameter
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }

    // Relasi ke catatan servis — eksplisit foreign key
    public function catatanServis()
    {
        return $this->hasMany(CatatanServis::class, 'kendaraan_id', 'id');
    }

    // Servis aktif
    public function servisAktif()
    {
        return $this->hasOne(CatatanServis::class, 'kendaraan_id', 'id')
            ->where('sudah_ganti_oli', 0)
            ->latest('waktu_input');
    }
}