<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'kategori';

    protected $fillable = ['nama_kategori', 'bobot_default'];

    public function gejala()
    {
        return $this->hasMany(Gejala::class);
    }
}