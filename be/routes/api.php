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
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\VespaCareController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\RiwayatDiagnosisController;
use App\Http\Controllers\KerusakanDiagnosisController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\SolusiController;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use App\Http\Controllers\BengkelController;
use App\Http\Controllers\LayananController;


Route::get('/login', function () {
    return response()->json([
        'message' => 'Silakan login melalui aplikasi mobile Anda.'
    ], 401);
})->name('login');

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

    // VESPA CARE
    // Route::get('vespa-care/template', [VespaCareController::class, 'getTemplates']);
    // Route::get('vespa-care/template/{id}', [VespaCareController::class, 'getTemplate']);

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

        Route::get('/diagnosa', [DiagnosaController::class, 'indexMobile']); 
        Route::post('/diagnosa', [DiagnosaController::class, 'storeMobile']);
        Route::get('/diagnosa/{id}', [DiagnosaController::class, 'show']);
        

        // Route yang butuh token (auth:sanctum)
        // Route::middleware('auth:sanctum')->prefix('motor')->group(function () {
        //     Route::post('/update-km', [ServiceController::class, 'updateKm']);
        //     Route::get('/info', [ServiceController::class, 'getInfoMotor']);
        // });

        // Route::get('/motor/cek-notif', [ServiceController::class, 'cekDanKirimNotif']);
        // Route::get('/motor/cek-notif/{userId}', [ServiceController::class, 'cekDanKirimNotif']);
    });

    Route::middleware(['auth:sanctum'])->group(function () {

        Route::middleware(['superadmin'])->group(function () {
            Route::get('/admin', [SuperAdminController::class, 'index']);
            Route::post('/admin', [SuperAdminController::class, 'store']);
            Route::put('/admin/{user}', [SuperAdminController::class, 'update']);
            Route::delete('/admin/{user}', [SuperAdminController::class, 'destroy']);
        });
    });


    // TESTING FCM
    Route::get('/test-fcm-topic', function () {
        try {
            $credentialsPath = config('firebase.credentials');
            $fullPath = base_path($credentialsPath);

            $factory = (new Factory)->withServiceAccount($fullPath);
            $messaging = $factory->createMessaging();

            $notification = FirebaseNotification::create()
                ->withTitle('Test FCM Sukses!')
                ->withBody('Laravel sudah terhubung ke Firebase Cloud Messaging.');

            $message = CloudMessage::new()->withNotification($notification);

            $messaging->sendMulticast($message, ['test-vespa']);

            return response()->json([
                'status' => 'success',
                'message' => 'Notifikasi berhasil dikirim ke topic "test-vespa"!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'path_tried' => $fullPath ?? 'null',
                'line' => $e->getLine()
            ], 500);
        }
    });

    Route::get('/debug-firebase', function () {
        $configValue = config('firebase.credentials');
        $fullPath = base_path($configValue ?? 'TIDAK ADA');

        return response()->json([
            'firebase_credentials_from_config' => $configValue,
            'full_path_calculated' => $fullPath,
            'file_exists' => file_exists($fullPath),
            'base_path' => base_path(),
        ]);
    });
});
