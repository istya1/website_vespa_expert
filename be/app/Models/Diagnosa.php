<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diagnosa extends Model
{
    protected $table = 'diagnosa';
    protected $primaryKey = 'id_diagnosa';
    public $timestamps = false;
    
    protected $fillable = [
        'user_id',
        'gejala_terpilih',
        'kode_kerusakan',
        'persentase',
        'tanggal',
    ];

    // Cast gejala_terpilih ke array otomatis
    protected $casts = [
        'gejala_terpilih' => 'array', 
        'tanggal' => 'datetime',
        'persentase' => 'float',
    ];

    // Relasi ke user
   public function user()
{
    return $this->belongsTo(User::class, 'user_id', 'id_user');
}

    // Relasi ke kerusakan
    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}