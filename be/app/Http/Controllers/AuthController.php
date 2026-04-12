<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        if ($user->role === 'pengguna' && !$user->email_verified_at) {
            return response()->json([
                'message' => 'Email belum diverifikasi. Silakan cek email Anda atau kirim ulang email verifikasi.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user' => $user,
            'token' => $token
        ]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'        => 'required|string|max:255',
            'email'       => 'required|string|email|max:255|unique:user,email',   // ← diperbaiki
            'password'    => 'required|string|min:6',
            'no_hp'       => 'nullable|string|max:20',
            'alamat'      => 'nullable|string',
            'jenis_montor' => 'required|string|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = User::create([
                'nama'              => $request->nama,
                'email'             => $request->email,
                'password'          => Hash::make($request->password),
                'role'              => 'pengguna',
                'no_hp'             => $request->no_hp,
                'alamat'            => $request->alamat ?? null,
                'jenis_montor'      => $request->jenis_montor,
                'email_verified_at' => null,
            ]);

            // Generate token verifikasi
            $verifyToken = Str::random(64);

            DB::table('email_verifications')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token'      => Hash::make($verifyToken),
                    'created_at' => now()
                ]
            );

          $verifyLink = config('app.url') . "/api/verify-email?token={$verifyToken}&email={$user->email}";

            // Kirim email
            Mail::raw(
                "Halo {$user->nama},\n\n" .
                    "Terima kasih telah mendaftar.\n\n" .
                    "Klik link berikut untuk verifikasi email:\n\n{$verifyLink}\n\n" .
                    "Link berlaku 24 jam.",
                function ($msg) use ($user) {
                    $msg->to($user->email)
                        ->subject('Verifikasi Email - Vespa Expert');
                }
            );

            return response()->json([
                'message' => 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.'
            ], 201);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json([
                'message' => 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
            ], 422);
        } catch (\Exception $e) {
            Log::error('Register Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan saat mendaftar. Coba lagi.'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        // ✅ PERBAIKI: Return id_user, bukan id
        return response()->json([
            'id_user' => $user->id_user,
            'nama' => $user->nama,
            'email' => $user->email,
            'role' => $user->role,
            'foto' => $user->foto,
            'no_hp' => $user->no_hp,
            'jenis_motor' => $user->jenis_motor,
            'alamat' => $user->alamat,
        ]);
    }

    public function loginPengguna(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        // Izinkan role 'pengguna' dan 'montir' (kalau ada)
        if (!in_array($user->role, ['pengguna'])) {
            return response()->json([
                'message' => 'Akses hanya untuk pengguna'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user' => [
                'id_user' => $user->id_user,
                'nama' => $user->nama,
                'email' => $user->email,
                'role' => $user->role,
                'foto' => $user->foto,
                'no_hp' => $user->no_hp,
                'jenis_motor' => $user->jenis_motor,
                'alamat' => $user->alamat,
            ],
            'token' => $token,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'nama' => 'sometimes|string|max:255',
            'no_hp' => 'sometimes|string|max:20',
            'alamat' => 'sometimes|string',
            'jenis_motor' => 'sometimes|string|max:50',
            'password' => 'sometimes|string|min:6',
        ]);

        $updateData = $request->only(['nama', 'no_hp', 'alamat', 'jenis_motor']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user->fresh()
        ]);
    }

    public function forgotPassword(Request $request)
    {
        Log::info('FORGOT PASSWORD MASUK', ['email' => $request->email]);

        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Jika email terdaftar, kode OTP akan dikirim.'
            ]);
        }

        // Generate OTP 6 digit
        $otp = mt_rand(100000, 999999);

        // Simpan OTP di tabel password_reset_tokens (di-hash)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($otp),
                'created_at' => Carbon::now()
            ]
        );

        try {
            Mail::raw(
                "Halo 👋

Kamu meminta reset password Vespa Expert.

Kode OTP kamu:
{$otp}

Masukkan kode ini di aplikasi.

⚠️ Berlaku 30 menit.
Jangan berikan kode ini ke siapa pun.",
                function ($message) use ($request) {
                    $message->to($request->email)
                        ->subject('Kode Reset Password');
                }
            );

            Log::info('EMAIL OTP BERHASIL DIKIRIM');
        } catch (\Exception $e) {
            Log::error('EMAIL OTP GAGAL', [
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'message' => 'Silakan cek email Anda untuk kode OTP.'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|min:6|confirmed'
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Token reset tidak valid.'
            ], 400);
        }

        // Cek token
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Token reset tidak valid.'
            ], 400);
        }

        // Cek expired (30 menit)
        if (Carbon::parse($record->created_at)->addMinutes(30)->isPast()) {
            return response()->json([
                'message' => 'Token reset sudah kedaluwarsa.'
            ], 400);
        }

        // Update password user
        User::where('email', $request->email)->update([
            'password' => Hash::make($request->password)
        ]);

        // Hapus token setelah dipakai
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diperbarui. Silakan login kembali.'
        ]);
    }

  public function verifyEmail(Request $request)
{
    $email = $request->query('email');
    $token = $request->query('token');

    if (!$email || !$token) {
        return response()->json(['message' => 'Parameter tidak lengkap'], 400);
    }

    $record = DB::table('email_verifications')
        ->where('email', $email)
        ->first();

    if (!$record || !Hash::check($token, $record->token)) {
        return response()->json(['message' => 'Token verifikasi tidak valid atau sudah kadaluarsa'], 400);
    }

    if (Carbon::parse($record->created_at)->addHours(24)->isPast()) {
        DB::table('email_verifications')->where('email', $email)->delete();
        return response()->json(['message' => 'Token verifikasi sudah kadaluarsa.'], 400);
    }

    // ✅ HANYA pakai DB raw langsung ke tabel 'user'
    $affected = DB::table('user')
        ->where('email', $email)
        ->update(['email_verified_at' => now()]);

    Log::info('VERIFY EMAIL', [
        'email' => $email,
        'rows_affected' => $affected,
    ]);

    // Cek hasil update
    $userAfter = DB::table('user')->where('email', $email)->first();
    Log::info('USER SETELAH UPDATE', ['email_verified_at' => $userAfter->email_verified_at]);

    DB::table('email_verifications')->where('email', $email)->delete();

    return response()->json([
        'message' => 'Email berhasil diverifikasi. Silakan login.'
    ]);
}

    public function showResetForm(Request $request)
    {
        return view('reset-password', [
            'token' => $request->query('token'),
            'email' => $request->query('email'),
        ]);
    }

    public function handleResetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|min:6|confirmed'
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return back()->with('error', 'Token tidak valid');
        }

        if (Carbon::parse($record->created_at)->addMinutes(30)->isPast()) {
            return back()->with('error', 'Token sudah kadaluarsa');
        }

        // ✅ Update password
        User::where('email', $request->email)->update([
            'password' => Hash::make($request->password)
        ]);

        // ✅ Hapus token
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return redirect('/reset-success');
    }

    public function resendVerificationEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email Anda sudah diverifikasi'], 400);
        }

        // Generate token baru
        $verifyToken = Str::random(64);

        DB::table('email_verifications')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => Hash::make($verifyToken),
                'created_at' => now()
            ]
        );

        $verifyLink = url("/api/verify-email?token={$verifyToken}&email={$user->email}");

        try {
            Mail::raw(
                "Halo {$user->nama},\n\n" .
                    "Berikut adalah link verifikasi email baru Anda:\n\n" .
                    "{$verifyLink}\n\n" .
                    "Link ini berlaku selama 24 jam.",
                function ($msg) use ($user) {
                    $msg->to($user->email)
                        ->subject('Verifikasi Email Baru - Vespa Expert');
                }
            );

            return response()->json(['message' => 'Email verifikasi telah dikirim ulang. Silakan cek inbox/spam.']);
        } catch (\Exception $e) {
            Log::error('Gagal kirim ulang email', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal mengirim email. Coba lagi nanti.'], 500);
        }
    }
}
