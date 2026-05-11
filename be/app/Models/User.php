<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'id_user';
    public $incrementing = true;
    protected $keyType = 'int';


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
        'email_verified_at',
        'expo_push_token',
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

    // app/Models/User.php — tambahkan relasi ini ke model User yang sudah ada
    public function kendaraan()
    {
        return $this->hasMany(Kendaraan::class);
    }

    public function catatanServis()
    {
        return $this->hasMany(CatatanServis::class);
    }

}
