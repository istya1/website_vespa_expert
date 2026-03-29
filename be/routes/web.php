<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;

Route::get('/test-log', function() {
    Log::info('Test log dari Windows');
    return 'Cek storage/logs/laravel.log';
});

Route::get('/reset-password', [AuthController::class, 'showResetForm']);
Route::post('/reset-password', [AuthController::class, 'handleResetPassword']);


Route::get('/reset-success', function () {
    return view('reset-success');
});