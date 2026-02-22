<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiagnosaHasil extends Model
{
    protected $table = 'diagnosa_hasil';
    protected $primaryKey = 'id_diagnosa_hasil';
    
    public $timestamps = true;

    protected $fillable = [
        'id_diagnosa',
        'kode_kerusakan',  
        'prioritas',
        'persentase_kecocokan',
        'tingkat_kepastian',
        'gejala_cocok',
        'total_gejala_aturan',
    ];

    protected $casts = [
        'persentase_kecocokan' => 'float',
        'prioritas' => 'integer',
        'gejala_cocok' => 'integer',
        'total_gejala_aturan' => 'integer',
    ];

    public function diagnosa()
    {
        return $this->belongsTo(Diagnosa::class, 'id_diagnosa', 'id_diagnosa');
    }

    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}