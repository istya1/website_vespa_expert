<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diagnosa extends Model
{
    protected $table = 'diagnosa';
    protected $primaryKey = 'id_diagnosa';
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'gejala_terpilih',
        'kode_kerusakan',
        'persentase',
        'tanggal',
    ];

    // Relasi ke user
    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    // Relasi ke kerusakan
    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}