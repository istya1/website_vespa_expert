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
     * Menampilkan daftar semua user (dengan filter role opsional)
     */
    public function index(Request $request)
    {
        try {
            $query = User::query();

            // Filter berdasarkan role jika ada parameter ?role=xxx
            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            // Ambil data user diurutkan dari yang terbaru
            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menambahkan user baru (biasanya digunakan oleh admin)
     * jenis_motor dibuat nullable karena bisa diisi nanti melalui update profil
     */
    public function store(Request $request)
    {
        // Validasi data input
        $validator = Validator::make($request->all(), [
            'nama'        => 'required|string|max:255',
            'email'       => 'required|string|email|max:255|unique:user,email',
            'password'    => 'required|string|min:6',
            'role'        => 'required|string|in:admin,pengguna,superadmin',
            'no_hp'       => 'nullable|string|max:20',
            'alamat'      => 'nullable|string',
            'jenis_motor' => 'nullable|string|max:50',   // ← Boleh kosong
            'foto'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            // Simpan user baru ke database
            $user = User::create([
                'nama'        => $request->nama,
                'email'       => $request->email,
                'password'    => Hash::make($request->password),
                'role'        => $request->role,
                'no_hp'       => $request->no_hp,
                'alamat'      => $request->alamat,
                'jenis_motor' => $request->jenis_motor ?? null,
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
     * Menampilkan detail satu user berdasarkan id_user
     */
    public function show(int $id_user)
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
     * Mengupdate data profil user
     * jenis_motor tetap bisa diupdate di sini
     */
   public function update(Request $request, int $id_user)
    {
        try {
            // Cari user, jika tidak ditemukan langsung error 404
            $user = User::where('id_user', $id_user)->firstOrFail();

            // Validasi data yang boleh diupdate
            $validated = $request->validate([
                'nama'        => 'sometimes|required|string|max:255',
                'alamat'      => 'nullable|string',
                'no_hp'       => 'nullable|string|max:20',
                'jenis_motor' => 'nullable|string|max:50',
                'foto'        => 'nullable|string',        // string untuk base64 atau URL
            ]);

            // Update data user
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
     * Menghapus user beserta foto profilnya (jika ada)
     */
    public function destroy(int $id_user)
    {
        try {
            $user = User::where('id_user', $id_user)->firstOrFail();

            // Hapus foto lama dari storage jika ada
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
     * Upload foto profil user
     * Otomatis menghapus foto lama sebelum upload yang baru
     */
    public function uploadPhoto(Request $request, int $id_user)
    {
        // Validasi file foto
        $validator = Validator::make($request->all(), [
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // max 2MB
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

            // Simpan foto baru
            $file = $request->file('foto');

            if (!$file) {
                return response()->json([
                    'message' => 'File tidak diterima',
                ], 400);
            }

            $filename = time().'_'.$file->getClientOriginalName();

            $path = $file->storeAs(
                'users',
                $filename,
                'public'
            );

            if (!$path) {
                return response()->json([
                    'message' => 'storeAs gagal'
                ], 500);
            }

            $user->foto = $path;
            $user->save();

            return response()->json([
                'path' => $path,
                'exists' => Storage::disk('public')->exists($path),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengunggah foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mengubah password user (dengan verifikasi password lama)
     */
   public function changePassword(Request $request, int $id_user)
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

            // Verifikasi password lama
            if (!Hash::check($request->oldPassword, $user->password)) {
                return response()->json([
                    'message' => 'Password lama tidak sesuai'
                ], 400);
            }

            // Update dengan password baru (di-hash)
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
     * Menghitung jumlah user berdasarkan role tertentu
     * Contoh: /api/users/count/admin atau /api/users/count/pengguna
     */
    public function countByRole(string $role)
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
