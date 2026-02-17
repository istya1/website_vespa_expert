<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diagnosa extends Model
{
    protected $table = 'diagnosa';
    protected $primaryKey = 'id_diagnosa';

    protected $fillable = [
        'user_id',
        'jenis_motor',
        'gejala_terpilih',
        'kode_kerusakan',
        'persentase',
        'tingkat_kepastian', // TAMBAH INI
        'tanggal',
    ];

    protected $casts = [
        'gejala_terpilih' => 'array', // Auto decode JSON
        'tanggal' => 'datetime',
    ];

    // Relasi ke user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }

    // Relasi ke kerusakan utama
    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }

    // Relasi ke gejala yang dipilih
    public function gejala()
    {
        return $this->belongsToMany(
            Gejala::class,
            'diagnosa_gejala',
            'id_diagnosa',
            'kode_gejala',
            'id_diagnosa',
            'kode_gejala'
        );
    }

    // RELASI BARU: Ke semua hasil diagnosis (termasuk alternatif)
    public function hasilDiagnosis()
    {
        return $this->hasMany(DiagnosaHasil::class, 'id_diagnosa', 'id_diagnosa')
            ->orderBy('prioritas', 'asc');
    }
}