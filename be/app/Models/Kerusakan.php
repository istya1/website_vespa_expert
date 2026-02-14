<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kerusakan extends Model
{
    protected $table = 'kerusakan';
    protected $primaryKey = 'kode_kerusakan';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'kode_kerusakan',
        'nama_kerusakan',
        'solusi',
        'jenis_motor',
    ];

    // Relasi ke gejala melalui aturan
    public function gejala()
    {
        return $this->belongsToMany(
            Gejala::class,
            'aturan',
            'kode_kerusakan',
            'kode_gejala',
            'kode_kerusakan',
            'kode_gejala'
        );
    }

    // Relasi ke diagnosa
    public function diagnosa()
    {
        return $this->hasMany(Diagnosa::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}