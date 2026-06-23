<?php

namespace App\Http\Controllers;

use App\Models\Bengkel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BengkelController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL BENGKEL
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        $data = Bengkel::with('layanan')
            ->orderBy('urutan', 'asc')
            ->get()
            ->map(function ($item) {

                $gambar = json_decode($item->gambar, true);

                $item->gambar_url = $gambar
                    ? collect($gambar)->map(function ($img) {
                        return asset('storage/' . $img);
                    })
                    : [];

                return $item;
            });

        return response()->json($data);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE BENGKEL
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $request->validate([
            'nama'             => 'required|string|max:255',
            'alamat'           => 'nullable|string',
            'telepon'          => 'nullable|string|max:20',
            'website'          => 'nullable|string|max:100',
            'rating'           => 'nullable|string|max:10',
            'jam_operasional'  => 'nullable|string',
            'maps_link'        => 'nullable|string',
            'deskripsi'        => 'nullable|string',
            'status'           => 'required|in:draft,published',
            'urutan'           => 'nullable|integer',

            // MULTIPLE IMAGE
            'gambar.*'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $data = $request->except('gambar');

        /*
        |--------------------------------------------------------------------------
        | Upload Multiple Gambar
        |--------------------------------------------------------------------------
        */
        $gambarPaths = [];

        if ($request->hasFile('gambar')) {

            foreach ($request->file('gambar') as $file) {

                $path = $file->store('bengkel', 'public');

                $gambarPaths[] = $path;
            }

            $data['gambar'] = json_encode($gambarPaths);
        }

        $bengkel = Bengkel::create($data);

        return response()->json([
            'message' => 'Bengkel berhasil ditambahkan',
            'data'    => $bengkel
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW DETAIL
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        $bengkel = Bengkel::with('layanan')->findOrFail($id);

        $gambar = json_decode($bengkel->gambar, true);

        $bengkel->gambar_url = $gambar
            ? collect($gambar)->map(function ($img) {
                return config('app.url') . '/storage/' . $img;
            })
            : [];

        return response()->json($bengkel);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE BENGKEL
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, int $id)
    {
        $bengkel = Bengkel::findOrFail($id);

        $request->validate([
            'nama'             => 'nullable|string|max:255',
            'alamat'           => 'nullable|string',
            'telepon'          => 'nullable|string|max:20',
            'website'          => 'nullable|string|max:100',
            'rating'           => 'nullable|string|max:10',
            'jam_operasional'  => 'nullable|string',
            'maps_link'        => 'nullable|string',
            'deskripsi'        => 'nullable|string',
            'status'           => 'nullable|in:draft,published',
            'urutan'           => 'nullable|integer',

            // MULTIPLE IMAGE
            'gambar.*'         => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $data = $request->except('gambar');

        /*
        |--------------------------------------------------------------------------
        | Update Multiple Gambar
        |--------------------------------------------------------------------------
        */
        if ($request->hasFile('gambar')) {

            // Hapus gambar lama
            $oldImages = json_decode($bengkel->gambar, true);

            if ($oldImages) {

                foreach ($oldImages as $img) {

                    if (Storage::disk('public')->exists($img)) {
                        Storage::disk('public')->delete($img);
                    }
                }
            }

            // Upload gambar baru
            $gambarPaths = [];

            foreach ($request->file('gambar') as $file) {

                $path = $file->store('bengkel', 'public');

                $gambarPaths[] = $path;
            }

            $data['gambar'] = json_encode($gambarPaths);
        }

        $bengkel->update($data);

        return response()->json([
            'message' => 'Bengkel berhasil diupdate',
            'data'    => $bengkel
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE BENGKEL
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id)
    {
        $bengkel = Bengkel::findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Hapus Semua Gambar
        |--------------------------------------------------------------------------
        */
        $images = json_decode($bengkel->gambar, true);

        if ($images) {

            foreach ($images as $img) {

                if (Storage::disk('public')->exists($img)) {
                    Storage::disk('public')->delete($img);
                }
            }
        }

        $bengkel->delete();

        return response()->json([
            'message' => 'Bengkel berhasil dihapus'
        ]);
    }
}