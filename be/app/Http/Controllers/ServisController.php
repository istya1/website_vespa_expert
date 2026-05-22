<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CatatanServis;
use App\Models\Kendaraan;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ServisController extends Controller
{
    public function show(Request $request, int $kendaraanId)
    {
        $userId = $request->user()->id_user;
        Kendaraan::where('id', $kendaraanId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $servis = CatatanServis::where('kendaraan_id', $kendaraanId)
            ->where('sudah_ganti_oli', 0)
            ->latest('waktu_input')
            ->first();

        if (!$servis) {
            return response()->json([
                'berhasil' => false,
                'pesan'    => 'Belum ada data servis',
            ], 404);
        }

        return response()->json([
            'berhasil' => true,
            'data'     => [
                'id'                        => $servis->id,
                'km_sekarang'               => $servis->km_sekarang,
                'estimasi_km_sekarang'      => $servis->estimasi_km_sekarang,
                'km_target_oli'             => $servis->km_target_oli,
                'sisa_km'                   => $servis->sisa_km,
                'sisa_hari'                 => $servis->sisa_hari,
                'estimasi_tanggal_deadline' => $servis->estimasi_tanggal_deadline->format('d M Y'),
                'status_kondisi'            => $servis->status_kondisi,
                'sudah_ganti_oli'           => $servis->sudah_ganti_oli,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kendaraan_id'          => 'required|integer',
            'km_sekarang'           => 'required|integer|min:0',
            'rata_rata_km_per_hari' => 'required|integer|min:1',
            'interval_ganti_oli'    => 'nullable|integer|min:1',
            'expo_push_token'       => 'nullable|string',
        ]);

        $userId = $request->user()->id_user;
        $kendaraan = Kendaraan::where('id', $validated['kendaraan_id'])
            ->where('user_id', $userId)
            ->firstOrFail();

        if (!empty($validated['expo_push_token'])) {
            $request->user()->update(['expo_push_token' => $validated['expo_push_token']]);
        }

        $interval     = $validated['interval_ganti_oli'] ?? 1000;
        $kmTarget     = $validated['km_sekarang'] + $interval;
        $hariDeadline = (int) ceil($interval / $validated['rata_rata_km_per_hari']);
        $deadline     = Carbon::now()->addDays($hariDeadline);
        $mulaiNotif   = $deadline->copy()->subDays(7);

        $servis = CatatanServis::create([
            'kendaraan_id'              => $kendaraan->id,
            'user_id'                   => $userId, // ← pakai id_user
            'km_sekarang'               => $validated['km_sekarang'],
            'rata_rata_km_per_hari'     => $validated['rata_rata_km_per_hari'],
            'interval_ganti_oli'        => $interval,
            'waktu_input'               => Carbon::now(),
            'km_target_oli'             => $kmTarget,
            'estimasi_tanggal_deadline' => $deadline,
            'tanggal_mulai_notif'       => $mulaiNotif,
        ]);

        return response()->json([
            'berhasil' => true,
            'pesan'    => 'Data servis berhasil disimpan',
            'data'     => [
                'estimasi_km_sekarang'      => $servis->estimasi_km_sekarang,
                'km_target_oli'             => $kmTarget,
                'estimasi_tanggal_deadline' => $deadline->format('d M Y'),
                'sisa_hari'                 => $servis->sisa_hari,
            ],
        ]);
    }

    public function konfirmasiGantiOli(Request $request, int $id)
    {
        $userId = $request->user()->id_user;
        $servis = CatatanServis::where('user_id', $userId) // ← pakai id_user
            ->findOrFail($id);

        $servis->update([
            'sudah_ganti_oli'   => 1,
            'tanggal_ganti_oli' => Carbon::today(),
        ]);

        return response()->json([
            'berhasil' => true,
            'pesan'    => 'Konfirmasi ganti oli berhasil dicatat!',
        ]);
    }

    public function riwayat(Request $request, int $kendaraanId)
    {
        $userId = $request->user()->id_user;
        Kendaraan::where('id', $kendaraanId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $riwayat = CatatanServis::where('kendaraan_id', $kendaraanId)
            ->latest('waktu_input')
            ->get()
            ->map(fn($s) => [
                'id'                => $s->id,
                'km_sekarang'       => $s->km_sekarang,
                'km_target_oli'     => $s->km_target_oli,
                'tanggal_input'     => $s->waktu_input->format('d M Y'),
                'tanggal_deadline'  => $s->estimasi_tanggal_deadline->format('d M Y'),
                'tanggal_ganti_oli' => $s->tanggal_ganti_oli?->format('d M Y'),
                'sudah_ganti_oli'   => $s->sudah_ganti_oli,
            ]);

        return response()->json(['berhasil' => true, 'data' => $riwayat]);
    }

   public function adminIndex(Request $request)
{
    // Cek role manual
    if (!in_array($request->user()->role, ['admin', 'superadmin'])) {
        return response()->json([
            'berhasil' => false,
            'pesan'    => 'Akses ditolak'
        ], 403);
    }

    $perPage = $request->get('per_page', 50);
    
    $data = CatatanServis::with(['user', 'kendaraan'])
        ->latest()
        ->paginate($perPage);

    return response()->json(['berhasil' => true, 'data' => $data]);
}
}