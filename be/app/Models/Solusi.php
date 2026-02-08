<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Solusi extends Model
{
    protected $table = 'solusi';

   protected $fillable = [
    'kode_solusi',
    'nama_solusi',
    'jenis_motor',
];

    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}
