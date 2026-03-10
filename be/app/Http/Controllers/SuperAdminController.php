<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class SuperAdminController extends Controller
{
    /**
     * List semua admin
     */
    public function index()
    {
        $admins = User::where('role', 'admin')
            ->select('id_user','nama','email','no_hp','alamat','jenis_motor','role','created_at')
            ->orderBy('nama')
            ->get();

        return response()->json([
            'message' => 'Daftar admin berhasil diambil',
            'data' => $admins
        ]);
    }

    /**
     * Tambah admin baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'no_hp' => 'nullable|string|max:15',
            'alamat' => 'nullable|string|max:255',
            'jenis_motor' => 'required|in:Primavera 150,Primavera S 150,LX 125,Sprint 150,Sprint S 150',
        ]);

        $admin = User::create([
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'no_hp' => $validated['no_hp'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'jenis_motor' => $validated['jenis_motor']
        ]);

        return response()->json([
            'message' => 'Admin berhasil dibuat',
            'data' => $admin
        ],201);
    }

    /**
     * Update admin
     */
    public function update(Request $request, User $user)
    {
        if($user->role !== 'admin'){
            return response()->json([
                'message' => 'Hanya admin yang bisa diupdate'
            ],403);
        }

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:50',
            'email' => 'sometimes|email|unique:users,email,'.$user->id_user.',id_user',
            'password' => 'nullable|string|min:8',
            'no_hp' => 'nullable|string|max:15',
            'alamat' => 'nullable|string|max:255',
            'jenis_motor' => 'nullable|string'
        ]);

        if(isset($validated['password'])){
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Admin berhasil diperbarui',
            'data' => $user
        ]);
    }

    /**
     * Hapus admin
     */
    public function destroy(User $user)
    {
        if($user->role !== 'admin'){
            return response()->json([
                'message' => 'Tidak bisa menghapus user ini'
            ],403);
        }

        if($user->id_user == Auth::id()){
            return response()->json([
                'message' => 'Tidak bisa menghapus akun sendiri'
            ],403);
        }

        $user->delete();

        return response()->json([
            'message' => 'Admin berhasil dihapus'
        ]);
    }
}