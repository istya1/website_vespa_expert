<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserServiceReminder extends Model
{
    protected $table = 'user_service_reminders';

    protected $fillable = [
        'id_user',
        'jenis_motor',
        'jenis_service',
        'km_terakhir',
        'tanggal_terakhir',
        'km_berikutnya',
        'tanggal_berikutnya',
        'status',
        'sudah_notif',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}