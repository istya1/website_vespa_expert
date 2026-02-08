<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AturanGejala extends Model
{
    protected $table = 'aturan_gejala';
    public $timestamps = false;

    protected $fillable = [
        'id_aturan',
        'kode_gejala'
    ];

    public function aturan()
    {
        return $this->belongsTo(Aturan::class, 'id_aturan', 'id_aturan');
    }

    public function gejala()
    {
        return $this->belongsTo(Gejala::class, 'kode_gejala', 'kode_gejala');
    }
}
