<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VespaCare extends Model
{
    protected $table = 'vespa_care';
    
    protected $fillable = [
        'jenis_motor',
        'jenis_service',
        'interval_km',
        'interval_hari',
        'deskripsi',
        'biaya_estimasi',
    ];
    
    public $timestamps = false;
}
