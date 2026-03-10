<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserMotor extends Model
{
    protected $fillable = [
        'user_id',
        'motor_type_id',
        'km_terakhir'
    ];

    public function motorType()
    {
        return $this->belongsTo(Montor::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}