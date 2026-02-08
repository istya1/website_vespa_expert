<?php

use Illuminate\Support\Facades\Route;
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
use App\Http\Controllers\SolusiController;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/login-pengguna', [AuthController::class, 'loginPengguna']);

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

    // MASTER DATA
    Route::apiResource('gejala', GejalaController::class);
    Route::apiResource('kerusakan', KerusakanController::class);
    Route::apiResource('solusi', SolusiController::class);

    // ATURAN

    Route::prefix('aturan')->group(function () {
        Route::get('/', [AturanController::class, 'index']);
        Route::post('/', [AturanController::class, 'store']);
        Route::get('{id}', [AturanController::class, 'show']);
        Route::delete('{id}', [AturanController::class, 'destroy']);
    });


    // DIAGNOSA
    Route::get('diagnosa', [DiagnosaController::class, 'index']);
    Route::get('diagnosa/{id}', [DiagnosaController::class, 'show']);
    Route::delete('diagnosa/{id}', [DiagnosaController::class, 'destroy']);

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

    // PASSWORD
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

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
