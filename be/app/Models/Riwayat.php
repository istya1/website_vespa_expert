<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diagnosa extends Model
{
    protected $table = 'riwayat_diagnosa';

    protected $fillable = [
        'user_id',
        'jenis_motor',
        'gejala_terpilih',
        'hasil_diagnosis',
    ];

    protected $casts = [
        'gejala_terpilih' => 'array',
        'hasil_diagnosis' => 'array',
    ];
}