<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use App\Models\PasswordReset;
use App\Models\User;

class ResetPasswordRequest
{
    public function resetPassword(Request $request)
{
    $request->validate([
        'token' => 'required',
        'password' => 'required|min:6|confirmed'
    ]);

    $reset = PasswordReset::where('token', $request->token)
        ->where('expires_at', '>', now())
        ->first();

    if (!$reset) {
        return response()->json([
            'message' => 'Token tidak valid atau kadaluarsa'
        ], 400);
    }

    $user = User::where('email', $reset->email)->first();

    $user->password = Hash::make($request->password);
    $user->save();

    PasswordReset::where('email', $reset->email)->delete();

    return response()->json([
        'message' => 'Password berhasil direset'
    ]);
    }
}

