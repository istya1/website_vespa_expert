<?php

namespace App\Http\Controllers;

use App\Models\UserServiceReminder;
use Illuminate\Http\Request;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class UserServiceReminderController extends Controller
{
    public function index(Request $request)
    {
        $query = UserServiceReminder::with('user');

        if ($request->jenis_motor) {
            $query->where('jenis_motor', $request->jenis_motor);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $reminders = $query->orderBy('tanggal_berikutnya', 'asc')->get();

        return response()->json($reminders);
    }

    public function sendNotification($id)
    {
        $reminder = UserServiceReminder::findOrFail($id);

        // Buat topic name: sprint-ganti-oli, lx-service-berkala, dll
        $topic = strtolower($reminder->jenis_motor . '-' . str_replace(' ', '-', $reminder->jenis_service));

        // Ambil messaging instance
        $messaging = Firebase::messaging();

        // Buat notifikasi
        $notification = FirebaseNotification::create()
            ->withTitle('Waktunya ' . $reminder->jenis_service . '!')
            ->withBody('Vespa ' . $reminder->jenis_motor . '-mu sudah waktunya ' . strtolower($reminder->jenis_service) . '. Segera ke bengkel!');

        // Buat message ke topic
        $message = CloudMessage::new()
            ->withNotification($notification);

        // Kirim ke topic
        $messaging->sendMulticast($message, [$topic]);

        // Update status sudah notif
        $reminder->sudah_notif = 1;
        $reminder->save();

        return response()->json([
            'message' => 'Notifikasi berhasil dikirim ke topic "' . $topic . '"!'
        ]);
    }
}