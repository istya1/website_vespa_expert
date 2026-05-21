<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gejala extends Model
{
    protected $table = 'gejala';
    protected $primaryKey = 'kode_gejala';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'kode_gejala',
        'nama_gejala',
        'jenis_motor_id',
        'kategori_id',
        'bobot',
    ];

    // Relasi ke kerusakan melalui aturan
    public function kerusakan()
    {
        return $this->belongsToMany(
            Kerusakan::class,
            'aturan',
            'kode_gejala',
            'kode_kerusakan',
            'kode_gejala',
            'kode_kerusakan'
        );
    }
    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    public function jenisMotor()
    {
        return $this->belongsTo(JenisMotor::class, 'jenis_motor_id', 'id_jenis_motor');
    }
}
