<?php

namespace App\Http\Controllers;

use App\Models\Bengkel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BengkelController extends Controller
{

    /*
    |--------------------------------------------------------------------------
    | HELPER: Extract Latitude & Longitude dari Google Maps Link
    | Mendukung short link (share.google, goo.gl, maps.app.goo.gl)
    | dengan cara follow redirect pakai cURL, lalu di-parsing.
    |--------------------------------------------------------------------------
    */
    private function extractCoordinatesFromMapsLink(?string $link): ?array
    {
        if (!$link) {
            return null;
        }

        $finalUrl = $link;
        $host = parse_url($link, PHP_URL_HOST);

        $shortDomains = ['share.google', 'goo.gl', 'maps.app.goo.gl'];

        if ($host && in_array($host, $shortDomains)) {
            $resolved = $this->resolveRedirect($link);
            if ($resolved) {
                $finalUrl = $resolved;
            }
        }

        // Pola 1: /@-7.123456,111.123456,17z
        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $m)) {
            return ['latitude' => (float) $m[1], 'longitude' => (float) $m[2]];
        }

        // Pola 2: ?q=-7.123456,111.123456 atau &q=-7.123456,111.123456
        if (preg_match('/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $m)) {
            return ['latitude' => (float) $m[1], 'longitude' => (float) $m[2]];
        }

        // Pola 3: !3dLAT!4dLNG (format embed / place data)
        if (preg_match('/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/', $finalUrl, $m)) {
            return ['latitude' => (float) $m[1], 'longitude' => (float) $m[2]];
        }

        Log::warning('Gagal extract koordinat dari maps_link', [
            'original_link' => $link,
            'final_url'     => $finalUrl,
        ]);

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER: Resolve short link jadi URL final pakai cURL
    |--------------------------------------------------------------------------
    */
    private function resolveRedirect(string $url): ?string
    {
        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_NOBODY, false); // beberapa short link butuh body utk redirect JS/meta
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            curl_exec($ch);

            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            curl_close($ch);

            return $finalUrl ?: null;
        } catch (\Exception $e) {
            Log::warning('Gagal resolve maps short link: ' . $e->getMessage());
            return null;
        }
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
        | Extract Latitude & Longitude dari maps_link
        |--------------------------------------------------------------------------
        */
        $coords = $this->extractCoordinatesFromMapsLink($request->input('maps_link'));
        if ($coords) {
            $data['latitude']  = $coords['latitude'];
            $data['longitude'] = $coords['longitude'];
        }

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

    public function index()
    {
        $data = Bengkel::with('layanan')
            ->orderBy('urutan', 'asc')
            ->get()
            ->map(function ($item) {

                $gambar = json_decode($item->gambar, true);

                $item->gambar_url = $gambar
                    ? collect($gambar)->map(function ($img) {
                        return Storage::disk('public')->url($img);
                    })
                    : [];

                return $item;
            });

        return response()->json($data);
    }

    public function show(int $id)
    {
        $bengkel = Bengkel::with('layanan')->findOrFail($id);

        $gambar = json_decode($bengkel->gambar, true);

        $bengkel->gambar_url = $gambar
            ? collect($gambar)->map(function ($img) {
                return Storage::disk('public')->url($img);
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
        | Extract Latitude & Longitude dari maps_link (kalau link-nya diubah)
        |--------------------------------------------------------------------------
        */
        if ($request->filled('maps_link')) {
            $coords = $this->extractCoordinatesFromMapsLink($request->input('maps_link'));
            if ($coords) {
                $data['latitude']  = $coords['latitude'];
                $data['longitude'] = $coords['longitude'];
            }
        }

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
