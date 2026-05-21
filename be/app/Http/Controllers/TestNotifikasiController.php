<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TestNotifikasiController extends Controller
{
    public function kirim(Request $request)
    {
        $token = $request->user()->expo_push_token;

        if (empty($token)) {
            return response()->json(['pesan' => 'Token kosong'], 400);
        }

        $response = Http::withHeaders([
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ])->post('https://exp.host/--/api/v2/push/send', [
            'to'    => $token,
            'title' => '🔧 Test Notifikasi',
            'body'  => 'Notifikasi berhasil diterima!',
            'sound' => 'default',
            'badge' => 1,
            'data'  => ['tipe' => 'test'],
        ]);

        return response()->json([
            'berhasil' => true,
            'expo_response' => $response->json(),
        ]);
    }
}