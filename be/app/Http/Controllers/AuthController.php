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
        Log::info($request->all());

        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // ❌ Email / password salah
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        // ❌ Role tidak valid
        if (!in_array($user->role, ['superadmin', 'admin', 'pengguna'])) {
            return response()->json([
                'message' => 'Role tidak diizinkan'
            ], 403);
        }

        // ✅ HANYA pengguna yang wajib verifikasi
        if ($user->role === 'pengguna' && !$user->email_verified_at) {
            return response()->json([
                'message' => 'Email belum diverifikasi. Silakan cek email Anda.'
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
                'alamat' => $user->alamat,
            ],
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        Log::info('Request body:', $request->all());
        Log::info('JSON body:', $request->json()->all());

        $validator = Validator::make($request->json()->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'jenis_montor' => 'required|string|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // ✅ Simpan user (BELUM VERIFIED)
            $user = User::create([
                'nama' => $request->json('nama'),
                'email' => $request->json('email'),
                'password' => Hash::make($request->json('password')),
                'role' => $request->json('role', 'pengguna'),
                'no_hp' => $request->json('no_hp'),
                'alamat' => $request->json('alamat'),
                'jenis_montor' => $request->json('jenis_montor'),
                'email_verified_at' => $request->json('role') !== 'pengguna' ? now() : null
            ]);

            // ✅ Generate token verifikasi
            $verifyToken = Str::random(64);

            DB::table('email_verifications')->insert([
                'email' => $user->email,
                'token' => Hash::make($verifyToken),
                'created_at' => Carbon::now()
            ]);

            // ✅ Link verifikasi
            $verifyLink = url('/api/verify-email') .
                "?token={$verifyToken}&email={$user->email}";

            // ✅ Kirim email
            Mail::raw(
                "Klik link berikut untuk verifikasi email akun Anda:\n\n{$verifyLink}",
                function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Verifikasi Email Akun');
                }
            );

            return response()->json([
                'message' => 'Registrasi berhasil. Silakan cek email untuk verifikasi.',
                'user' => [
                    'id_user' => $user->id_user,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'role' => $user->role,
                    'foto' => $user->foto,
                    'no_hp' => $user->no_hp,
                    'alamat' => $user->alamat,
                    'jenis_montor' => $user->jenis_montor,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registrasi gagal',
                'error' => $e->getMessage()
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
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        // Jangan bocorkan apakah email ada atau tidak
        if (!$user) {
            return response()->json([
                'message' => 'Jika email terdaftar, link reset password akan dikirim.'
            ]);
        }

        // Generate token
        $token = Str::random(64);

        // Simpan token (di-hash)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now()
            ]
        );

        // Link frontend reset password
        $resetLink = env('FRONTEND_URL') .
            "/reset-password?token={$token}&email={$request->email}";

        // Kirim email
        Mail::raw(
            "Klik link berikut untuk reset password:\n\n{$resetLink}\n\nLink berlaku 30 menit.",
            function ($message) use ($request) {
                $message->to($request->email)
                    ->subject('Reset Password');
            }
        );

        return response()->json([
            'message' => 'Link reset password berhasil dikirim ke email.'
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

        $record = DB::table('email_verifications')
            ->where('email', $email)
            ->first();

        if (!$record || !Hash::check($token, $record->token)) {
            return response()->view('verify-failed');
        }

        // ✅ Update user
        User::where('email', $email)->update([
            'email_verified_at' => now()
        ]);

        // ✅ Hapus token
        DB::table('email_verifications')
            ->where('email', $email)
            ->delete();

        // ✅ Tampilkan halaman sukses
        return view('verify-success');
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
}
