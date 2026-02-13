<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiagnosaGejala extends Model
{
    protected $table = 'diagnosa_gejala';
    public $timestamps = false;

    protected $fillable = [
        'id_diagnosa',
        'kode_gejala'
    ];

    public function diagnosa()
    {
        return $this->belongsTo(Diagnosa::class, 'id_diagnosa', 'id_diagnosa');
    }

    public function gejala()
    {
        return $this->belongsTo(Gejala::class, 'kode_gejala', 'kode_gejala');
    }
}
