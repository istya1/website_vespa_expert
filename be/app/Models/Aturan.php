<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aturan extends Model
{
    // Nama tabel
    protected $table = 'aturan';

    // PK auto-increment normal (beda dari Gejala/Kerusakan yang pakai string custom)
    protected $primaryKey = 'id_aturan';

    public $timestamps = false;

    // Hanya kode_kerusakan yang bisa diisi mass-assignment
    // (gejala-gejala rule ini diisi lewat tabel terpisah, bukan kolom di sini)
    protected $fillable = [
        'kode_kerusakan'
    ];

    /**
     * Satu Aturan punya BANYAK baris AturanGejala
     * (daftar gejala yang termasuk dalam rule ini).
     * Ini hasMany, BUKAN belongsToMany — karena AturanGejala
     * sudah jadi model pivot tersendiri yang kita akses lewat relasi biasa.
     */
    public function gejala()
    {
        return $this->hasMany(AturanGejala::class, 'id_aturan', 'id_aturan');
    }

    /**
     * Satu Aturan mengarah ke SATU kerusakan.
     */
    public function kerusakan()
    {
        return $this->belongsTo(Kerusakan::class, 'kode_kerusakan', 'kode_kerusakan');
    }
}