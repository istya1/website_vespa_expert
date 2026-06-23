<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VespaPedia extends Model
{
    protected $table = 'vespa_pedia';

    protected $fillable = [
        'judul',
        'deskripsi',
        'jenis_motor_id',
        'gambar',
        'spesifikasi',
        'keunggulan',
        'tips',
        'urutan',
        'status',
    ];

    // Relasi ke Jenis Motor
    public function jenisMotor()
    {
        return $this->belongsTo(JenisMotor::class, 'jenis_motor_id', 'id_jenis_motor');
    }
}
