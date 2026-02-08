<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aturan extends Model
{
    protected $table = 'aturan';
    protected $primaryKey = 'id_aturan';
    public $timestamps = false;

    protected $fillable = [
        'kode_kerusakan',
        'threshold'
    ];

    public function gejala()
    {
        return $this->hasMany(AturanGejala::class, 'id_aturan', 'id_aturan');
    }

    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}
