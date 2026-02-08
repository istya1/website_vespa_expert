<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTemplate extends Model
{
    protected $table = 'service_templates';
    
    protected $fillable = [
        'jenis_motor',
        'jenis_service',
        'interval_km',
        'interval_hari',
        'deskripsi',
        'biaya_estimasi'
    ];
}