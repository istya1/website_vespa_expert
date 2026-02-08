<?php

// namespace App\Http\Controllers;

// use Illuminate\Http\Request;
// use App\Models\VespaCare;

// class VespaCareController extends Controller
// {
//     /**
//      * Ambil semua template VespaCare
//      */
//     public function getTemplates()
//     {
//         // Ambil semua template dari tabel vespa_care_templates
//         $templates = VespaCare::all();

//         return response()->json([
//             'status' => 'success',
//             'data' => $templates
//         ]);
//     }

//     /**
//      * Ambil template berdasarkan ID (optional)
//      */
//     public function getTemplate($id)
//     {
//         $template = VespaCare::find($id);

//         if (!$template) {
//             return response()->json([
//                 'status' => 'error',
//                 'message' => 'Template tidak ditemukan'
//             ], 404);
//         }

//         return response()->json([
//             'status' => 'success',
//             'data' => $template
//         ]);
//     }
// }
