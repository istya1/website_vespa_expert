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
        // 'km_terakhir',
        // 'tanggal_service_terakhir',
        // 'km_service_berikutnya',
        // 'sudah_dinotifikasi',
        // 'fcm_token',

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

    // Casting tipe data supaya Laravel paham
//     protected $casts = [
//         'sudah_dinotifikasi' => 'boolean',
//         'km_terakhir' => 'integer',
//         'km_service_berikutnya' => 'integer?',
//         'tanggal_service_terakhir' => 'date',
//     ];

//     // Fungsi helper untuk dapatkan interval service berdasarkan jenis motor
//     public function getIntervalServiceAttribute()
//     {
//         $intervals = [
//             'Primavera 150'    => 10000,
//             'Primavera S 150'  => 10000,
//             'Sprint 150'       => 10000,
//             'Sprint S 150'     => 10000,
//             'LX 125'           => 8000,
//         ];

//         return $intervals[$this->jenis_motor] ?? 10000;
//     }

//     // Fungsi untuk cek apakah sudah waktunya service (bisa dipakai di controller atau cron)
//     public function perluService($toleransiKm = 500)
//     {
//         if (!$this->km_service_berikutnya) {
//             return false;
//         }

//         return $this->km_terakhir >= ($this->km_service_berikutnya - $toleransiKm);
//     }
 }
