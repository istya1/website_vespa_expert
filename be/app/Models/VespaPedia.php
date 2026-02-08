<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VespaPedia extends Model
{
    protected $table = 'vespa_pedia';
    
    protected $fillable = [
        'judul',
        'jenis_motor',
        'kategori',
        'gambar',
        'konten',
        'urutan',
        'status',
    ];
}
