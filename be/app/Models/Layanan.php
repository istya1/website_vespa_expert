<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    protected $table = 'layanan';

    protected $fillable = [
        'bengkel_id',
        'nama_layanan',
        'icon'
    ];

    public function bengkel()
    {
        return $this->belongsTo(Bengkel::class, 'bengkel_id');
    }
}