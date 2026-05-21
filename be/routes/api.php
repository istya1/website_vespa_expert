<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GejalaController;
use App\Http\Controllers\KerusakanController;
use App\Http\Controllers\DiagnosaController;
use App\Http\Controllers\VespaPediaController;
use App\Http\Controllers\ServiceTemplateController;
use App\Http\Controllers\UserServiceReminderController;
use App\Http\Controllers\AturanController;
use App\Http\Controllers\KerusakanDiagnosisController;
use App\Http\Controllers\SuperAdminController;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use App\Http\Controllers\BengkelController;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\KendaraanController;
use App\Http\Controllers\ServisController;
use Illuminate\Http\Request;
use App\Http\Controllers\JenisMotorController;

Route::get('/login', function () {
    return response()->json([
        'message' => 'Silakan login melalui aplikasi mobile Anda.'
    ], 401);
})->name('login'); //fallback

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationEmail']);

Route::get('/motor-types', function () {
    return DB::table('motor_types')->get();
});

Route::get('/diagnosa/statistik', [DiagnosaController::class, 'statistik']);
Route::get('/bengkel', [BengkelController::class, 'index']);
Route::get('/bengkel/{id}', [BengkelController::class, 'show']);
Route::get('/layanan', [LayananController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/bengkel', [BengkelController::class, 'store']);
    Route::put('/bengkel/{id}', [BengkelController::class, 'update']);
    Route::delete('/bengkel/{id}', [BengkelController::class, 'destroy']);

    Route::post('/layanan', [LayananController::class, 'store']);
    Route::put('/layanan/{id}', [LayananController::class, 'update']);
    Route::delete('/layanan/{id}', [LayananController::class, 'destroy']);
});
// Route::post('/save-token', [ServiceController::class, 'saveToken']);
// Route::get('/motor-types', [ServiceController::class, 'motorTypes']);
// Route::post('/save-km', [ServiceController::class, 'saveKm']);


Route::get('/jenis-motor', [JenisMotorController::class, 'index']);
Route::post('/jenis-motor', [JenisMotorController::class, 'store']);
Route::put('/jenis-motor/{id}', [JenisMotorController::class, 'update']);
Route::delete('/jenis-motor/{id}', [JenisMotorController::class, 'destroy']);
/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // AUTH
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);


    // USERS
    Route::get('users/count/{role}', [UserController::class, 'countByRole']);
    Route::post('users/{id_user}/upload-photo', [UserController::class, 'uploadPhoto']);
    Route::put('users/{id_user}/change-password', [UserController::class, 'changePassword']);
    Route::post('users/{id_user}/profile', [UserController::class, 'updateProfile']);
    Route::apiResource('users', UserController::class)->parameters(['users' => 'id_user']);
    Route::post('/users/{id}/change-password', [UserController::class, 'changePassword']);

    // routes/api.php
    Route::post('/test-notifikasi', [TestNotifikasiController::class, 'kirim']);

    // MASTER DATA
    Route::apiResource('gejala', GejalaController::class);
    Route::apiResource('kerusakan', KerusakanController::class);
    // Route::apiResource('solusi', SolusiController::class);

    // ATURAN
    Route::prefix('aturan')->group(function () {
        Route::get('/', [AturanController::class, 'index']);
        Route::post('/', [AturanController::class, 'store']);
        Route::get('{id}', [AturanController::class, 'show']);
        Route::delete('{id}', [AturanController::class, 'destroy']);
        Route::put('{id}', [AturanController::class, 'update']);
    });

    // DIAGNOSA
    Route::prefix('diagnosa')->group(function () {
        Route::get('/', [DiagnosaController::class, 'index']);
        Route::post('/', [DiagnosaController::class, 'store']);
        Route::get('{id}', [DiagnosaController::class, 'show']);
        Route::put('{id}', [DiagnosaController::class, 'update']);
        Route::delete('{id}', [DiagnosaController::class, 'destroy']);
    });

    // VESPAPEDIA
    Route::apiResource('vespa-pedia', VespaPediaController::class);

    // SERVICE TEMPLATE
    Route::apiResource('service-templates', ServiceTemplateController::class);

    // USER REMINDER
    Route::get('user-reminders', [UserServiceReminderController::class, 'index']);
    Route::post('user-reminders/{id}/send-notification', [UserServiceReminderController::class, 'sendNotification']);

    // KERUSAKAN DIAGNOSIS
    Route::prefix('mobile')->middleware('auth:sanctum')->group(function () {

        Route::get('/gejala', [GejalaController::class, 'index']);
        Route::get('/aturan', [AturanController::class, 'index']);
        Route::get('/vespa-smart-data', [KerusakanDiagnosisController::class, 'getVespaSmartData']);
        Route::get('/kerusakan/{kode}', [KerusakanDiagnosisController::class, 'getDetailKerusakan']);
        Route::post('/proses-diagnosis', [KerusakanDiagnosisController::class, 'prosesDiagnosis']);
        // Pastikan mengarah ke method yang benar
        Route::post('/mobile/proses-diagnosis', [KerusakanDiagnosisController::class, 'prosesDiagnosis']);
        Route::get('/bengkel', [BengkelController::class, 'index']);
        Route::get('/bengkel/{id}', [BengkelController::class, 'show']);
        Route::get('/layanan', [LayananController::class, 'index']);
        Route::get('/diagnosa', [DiagnosaController::class, 'indexMobile']);
        Route::post('/diagnosa', [DiagnosaController::class, 'storeMobile']);
        Route::get('/diagnosa/{id}', [DiagnosaController::class, 'show']);
        Route::delete('/diagnosa/{id}', [DiagnosaController::class, 'destroy']);
    });

    Route::apiResource('kategori', KategoriController::class);

    Route::middleware(['auth:sanctum'])->group(function () {

        Route::middleware(['superadmin'])->group(function () {
            Route::get('/admin', [SuperAdminController::class, 'index']);
            Route::post('/admin', [SuperAdminController::class, 'store']);
            Route::put('/admin/{user}', [SuperAdminController::class, 'update']);
            Route::delete('/admin/{user}', [SuperAdminController::class, 'destroy']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {

        // ── Kendaraan ──────────────────────────────────────
        Route::get('/kendaraan',          [KendaraanController::class, 'index']);
        Route::post('/kendaraan',         [KendaraanController::class, 'store']);
        Route::delete('/kendaraan/{id}',  [KendaraanController::class, 'destroy']);

        // ── Servis & Ganti Oli ─────────────────────────────
        Route::post('/servis',                          [ServisController::class, 'store']);
        Route::get('/servis/{kendaraan_id}',            [ServisController::class, 'show']);
        Route::get('/servis/{kendaraan_id}/riwayat',    [ServisController::class, 'riwayat']);
        Route::patch('/servis/{id}/konfirmasi',         [ServisController::class, 'konfirmasiGantiOli']);

        Route::get('/admin/servis', [ServisController::class, 'adminIndex']);
    });

    // Tambahkan di dalam Route::middleware('auth:sanctum')
    // ── Notifikasi ─────────────────────────────────────
    Route::get('/notifikasi', function (Request $request) {
        $notifs = DB::table('notifikasi_user')
            ->where('user_id', $request->user()->id_user)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'berhasil' => true,
            'data'     => $notifs,
        ]);
    });

    Route::patch('/notifikasi/{id}/baca', function (Request $request, $id) {
        DB::table('notifikasi_user')
            ->where('id', $id)
            ->where('user_id', $request->user()->id_user)
            ->update(['sudah_dibaca' => 1]);

        return response()->json(['berhasil' => true]);
    });

    Route::patch('/notifikasi/baca-semua', function (Request $request) {
        DB::table('notifikasi_user')
            ->where('user_id', $request->user()->id_user)
            ->update(['sudah_dibaca' => 1]);

        return response()->json(['berhasil' => true]);
    });
    Route::post('/update-token', function (Request $request) {
        $request->validate(['expo_push_token' => 'required|string']);
        $request->user()->update([
            'expo_push_token' => $request->expo_push_token
        ]);
        return response()->json(['berhasil' => true]);
    });
});
