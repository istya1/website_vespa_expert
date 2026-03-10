<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Montor extends Model
{
    protected $fillable = [
        'nama_motor',
        'service_km'
    ];
}