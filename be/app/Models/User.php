<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'email',
        'nama',
        'password',
        'remember_token',
        'role',
        'foto',
        'no_hp',
        'alamat',
        'jenis_motor',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public $timestamps = true;

    // Relasi ke diagnosa
    public function diagnosa()
    {
        return $this->hasMany(Diagnosa::class, 'id_user', 'id_user');
    }
}