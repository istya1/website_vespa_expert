<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kerusakan extends Model
{
    // Nama tabel di database
    protected $table = 'kerusakan';

    // Primary key custom (bukan 'id' bawaan Laravel)
    protected $primaryKey = 'kode_kerusakan';

    // PK bukan angka auto-increment, tapi string yang di-generate manual
    public $incrementing = false;
    protected $keyType = 'string';

    // Tabel ini tidak punya kolom created_at/updated_at,
    // jadi matikan timestamp otomatis Laravel
    public $timestamps = false;

    // Kolom yang boleh diisi lewat create()/update() massal (mass assignment)
    protected $fillable = [
        'kode_kerusakan',
        'nama_kerusakan',
        'solusi',
        'jenis_motor_id',
    ];

    /**
     * Relasi many-to-many ke Gejala lewat tabel pivot 'aturan'.
     * Ini KEBALIKAN dari relasi kerusakan() yang ada di model Gejala.
     * Satu kerusakan bisa dipicu banyak gejala, dan satu gejala
     * bisa jadi indikasi banyak kerusakan.
     */
    public function gejala()
    {
        return $this->belongsToMany(
            Gejala::class,        // 1. model tujuan
            'aturan',             // 2. tabel pivot
            'kode_kerusakan',     // 3. FK pivot yang menunjuk balik ke Kerusakan (tabel ini)
            'kode_gejala',        // 4. FK pivot yang menunjuk ke Gejala (tabel tujuan)
            'kode_kerusakan',     // 5. PK di tabel Kerusakan
            'kode_gejala'         // 6. PK di tabel Gejala
        );
    }

    /**
     * Relasi many-to-one (belongsTo) ke JenisMotor.
     * Satu kerusakan hanya untuk satu jenis motor.
     */
    public function jenisMotor()
    {
        return $this->belongsTo(JenisMotor::class, 'jenis_motor_id', 'id_jenis_motor');
    }

    /**
     * Relasi one-to-many (hasMany) ke Diagnosa.
     * Satu kerusakan bisa muncul di banyak riwayat diagnosis
     * (history hasil diagnosis user-user sebelumnya yang menyimpulkan kerusakan ini).
     */
    public function diagnosa()
    {
        return $this->hasMany(Diagnosa::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}