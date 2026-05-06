<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogNotifikasi extends Model
{
    protected $table = 'log_notifikasi';
    public $timestamps = false;

    protected $fillable = [
        'catatan_servis_id', 'user_id',
        'judul', 'pesan', 'hari_sebelum_deadline',
    ];
}