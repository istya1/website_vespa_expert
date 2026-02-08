<?php

namespace App\Http\Controllers;

use App\Models\ServiceTemplate;
use Illuminate\Http\Request;

class ServiceTemplateController extends Controller
{
    public function index(Request $request)
    {
        $jenisMotor = $request->query('jenis_motor');
        
        $query = ServiceTemplate::query();
        
        if ($jenisMotor) {
            $query->where('jenis_motor', $jenisMotor);
        }
        
        $templates = $query->orderBy('jenis_motor')->orderBy('jenis_service')->get();
        
        return response()->json($templates);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_motor' => 'required|in:Primavera 150, Primavera S 150, LX 125, Sprint 150, Sprint S 150',
            'jenis_service' => 'required|in:Ganti Oli,Service Berkala,Ganti CVT',
            'interval_km' => 'required|integer|min:1',
            'interval_hari' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'biaya_estimasi' => 'nullable|string|max:50',
        ]);

        $template = ServiceTemplate::create($request->all());

        return response()->json([
            'message' => 'Template service berhasil ditambahkan',
            'data' => $template
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $template = ServiceTemplate::findOrFail($id);

        $request->validate([
            'interval_km' => 'required|integer|min:1',
            'interval_hari' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'biaya_estimasi' => 'nullable|string|max:50',
        ]);

        $template->update($request->all());

        return response()->json([
            'message' => 'Template service berhasil diupdate',
            'data' => $template
        ]);
    }

    public function destroy($id)
    {
        $template = ServiceTemplate::findOrFail($id);
        $template->delete();

        return response()->json(['message' => 'Template service berhasil dihapus']);
    }
}