<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bengkel extends Model
{
    protected $table = 'bengkel';

    protected $fillable = [
        'nama',
        'alamat',
        'telepon',
        'website',
        'rating',
        'jam_operasional',
        'maps_link',
        'deskripsi',
        'gambar',
        'status',
        'urutan'
    ];

    public function layanan()
    {
        return $this->hasMany(Layanan::class, 'bengkel_id');
    }
}