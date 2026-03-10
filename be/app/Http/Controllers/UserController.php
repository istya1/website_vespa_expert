<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = User::query();

            // Filter berdasarkan role jika ada parameter
            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created user (registrasi).
     * jenis_motor dibuat nullable karena bisa ditambahkan nanti di profil.
     */
   public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nama'        => 'required|string|max:255',
        'email'       => 'required|string|email|max:255|unique:user,email',
        'password'    => 'required|string|min:6',
        'role'        => 'required|string|in:admin,pengguna,superadmin',
        'no_hp'       => 'nullable|string|max:20',
        'alamat'      => 'nullable|string',
        'jenis_motor' => 'nullable|string|max:50',  // ← UBAH JADI nullable (boleh kosong)
        'foto'        => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validasi gagal',
            'errors'  => $validator->errors()
        ], 422);
    }

    try {
        $user = User::create([
            'nama'        => $request->nama,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'role'        => $request->role,
            'no_hp'       => $request->no_hp,
            'alamat'      => $request->alamat,
            'jenis_motor' => $request->jenis_motor ?? null,  // ← aman kalau null
            'foto'        => $request->foto,
        ]);

        return response()->json($user, 201);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Gagal menambahkan user',
            'error'   => $e->getMessage()
        ], 500);
    }
}

    /**
     * Display the specified resource.
     */
    public function show($id_user)
    {
        $user = User::where('id_user', $id_user)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        }
        return response()->json($user);
    }

    /**
     * Update the specified resource (profil).
     * jenis_motor tetap bisa diupdate di sini.
     */
    public function update(Request $request, $id_user)
    {
        try {
            $user = User::where('id_user', $id_user)->firstOrFail();

            $validated = $request->validate([
                'nama'        => 'sometimes|required|string|max:255',
                'alamat'      => 'nullable|string',
                'no_hp'       => 'nullable|string|max:20',
                'jenis_motor' => 'nullable|string|max:50', // ← tetap nullable & bisa diupdate
                'foto'        => 'nullable|string', // string untuk base64/url
            ]);

            $user->update($validated);

            return response()->json([
                'message' => 'Profil berhasil diperbarui',
                'data'    => $user
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal update profil',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource.
     */
    public function destroy($id_user)
    {
        try {
            $user = User::where('id_user', $id_user)->firstOrFail();

            // Hapus foto jika ada
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }

            $user->delete();

            return response()->json([
                'message' => 'User berhasil dihapus'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload photo for user.
     */
    public function uploadPhoto(Request $request, $id_user)
    {
        $validator = Validator::make($request->all(), [
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('id_user', $id_user)->firstOrFail();

            // Hapus foto lama jika ada
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }

            // Upload foto baru
            $file = $request->file('foto');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('users', $filename, 'public');

            // Update user
            $user->update(['foto' => $path]);

            // Return full URL
            $fotoUrl = url(Storage::url($path));

            return response()->json([
                'message' => 'Foto berhasil diupload',
                'foto'    => $fotoUrl
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengupload foto',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request, $id_user)
    {
        $validator = Validator::make($request->all(), [
            'oldPassword' => 'required|string',
            'newPassword' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('id_user', $id_user)->firstOrFail();

            // Cek password lama
            if (!Hash::check($request->oldPassword, $user->password)) {
                return response()->json([
                    'message' => 'Password lama tidak sesuai'
                ], 400);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->newPassword)
            ]);

            return response()->json([
                'message' => 'Password berhasil diubah'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengubah password',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Count users by role.
     */
    public function countByRole($role)
    {
        try {
            $count = User::where('role', $role)->count();

            return response()->json([
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghitung user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}