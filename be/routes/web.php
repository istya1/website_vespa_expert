<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

Route::get('/test-log', function() {
    Log::info('Test log dari Windows');
    return 'Cek storage/logs/laravel.log';
});