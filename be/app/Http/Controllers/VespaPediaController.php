<?php

namespace App\Http\Controllers;

use App\Models\VespaPedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VespaPediaController extends Controller
{
    /**
     * Sanitize filename - hapus spasi dan karakter aneh
     */
    private function sanitizeFilename($filename)
    {
        // Pisahkan nama dan extension
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $name = pathinfo($filename, PATHINFO_FILENAME);
        
        // Ganti spasi dengan underscore, hapus karakter aneh
        $name = preg_replace('/[^A-Za-z0-9_\-]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name); // Multiple underscore jadi satu
        $name = strtolower($name);
        
        return $name . '.' . $extension;
    }

    public function index(Request $request)
    {
        try {
            $query = VespaPedia::query();
            
            $query->where('status', 'published');
            
            if ($request->has('jenis_motor')) {
                $query->where('jenis_motor', $request->jenis_motor);
            }
            
            if ($request->has('kategori')) {
                $query->where('kategori', $request->kategori);
            }
            
            $pedia = $query->orderBy('urutan')->orderBy('created_at', 'desc')->get();
            
            // Tambahkan full URL gambar
            $pedia = $pedia->map(function($item) {
                if ($item->gambar) {
                   $item->gambar_url = url('uploads/vespa-pedia/' . $item->gambar);

                } else {
                    $item->gambar_url = null;
                }
                return $item;
            });
            
            return response()->json($pedia);
            
        } catch (\Exception $e) {
            Log::error('Error in VespaPedia index: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengambil data vespa pedia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'judul' => 'required|max:255',
                'jenis_motor' => 'required|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
                'kategori' => 'required|in:Pengenalan,Keunggulan,Spesifikasi,Tips',
                'konten' => 'required',
                'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan' => 'nullable|integer|min:0',
                'status' => 'nullable|in:draft,published',
            ]);

            $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);
            
            // Default values
            $data['urutan'] = $data['urutan'] ?? 0;
            $data['status'] = $data['status'] ?? 'published';

            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');
                
                // Sanitize filename
                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename = time() . '_' . $originalName;
                
               $file->move(public_path('uploads/vespa-pedia'), $filename);

                $data['gambar'] = $filename;
            }

            $pedia = VespaPedia::create($data);
            
            if ($pedia->gambar) {
                $pedia->gambar_url = url('storage/vespa-pedia/' . $pedia->gambar);
            }

            return response()->json([
                'message' => 'Konten berhasil ditambahkan',
                'data' => $pedia
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error in VespaPedia store: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal menambahkan konten',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $pedia = VespaPedia::find($id);
            
            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }
            
            if ($pedia->gambar) {
                $pedia->gambar_url = url('storage/vespa-pedia/' . $pedia->gambar);
            }
            
            return response()->json($pedia);
            
        } catch (\Exception $e) {
            Log::error('Error in VespaPedia show: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengambil detail konten',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pedia = VespaPedia::findOrFail($id);

            $request->validate([
                'judul' => 'nullable|max:255',
                'jenis_motor' => 'nullable|in:Sprint 150,Sprint S 150,LX 125,Primavera 150,Primavera S 150',
                'kategori' => 'nullable|in:Pengenalan,Keunggulan,Spesifikasi,Tips',
                'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'urutan' => 'nullable|integer|min:0',
                'status' => 'nullable|in:draft,published',
            ]);

            $data = $request->only(['judul', 'jenis_motor', 'kategori', 'konten', 'urutan', 'status']);

            if ($request->hasFile('gambar')) {
                // Hapus gambar lama
                if ($pedia->gambar) {
                    Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
                }

                $file = $request->file('gambar');
                
                // Sanitize filename
                $originalName = $this->sanitizeFilename($file->getClientOriginalName());
                $filename = time() . '_' . $originalName;
                
               $file->move(public_path('uploads/vespa-pedia'), $filename);
                $data['gambar'] = $filename;
            }

            $pedia->update($data);
            
            if ($pedia->gambar) {
                $pedia->gambar_url = url('storage/vespa-pedia/' . $pedia->gambar);
            }

            return response()->json([
                'message' => 'Konten berhasil diupdate',
                'data' => $pedia
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in VespaPedia update: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal mengupdate konten',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pedia = VespaPedia::find($id);
            
            if (!$pedia) {
                return response()->json(['message' => 'Konten tidak ditemukan'], 404);
            }

            if ($pedia->gambar) {
                Storage::disk('public')->delete('vespa-pedia/' . $pedia->gambar);
            }

            $pedia->delete();

            return response()->json(['message' => 'Konten berhasil dihapus']);
            
        } catch (\Exception $e) {
            Log::error('Error in VespaPedia destroy: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Gagal menghapus konten',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}