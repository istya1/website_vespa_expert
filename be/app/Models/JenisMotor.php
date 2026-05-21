<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisMotor extends Model
{
    protected $table = 'jenis_motor';

    protected $primaryKey = 'id_jenis_motor';

    protected $fillable = [
        'nama_motor'
    ];

    public $timestamps = false;
}