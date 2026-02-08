<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class ServiceReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private $title;
    private $body;
    private $data;

    public function __construct(string $title, string $body, array $data = [])
    {
        $this->title = $title;
        $this->body = $body;
        $this->data = $data;
    }

    public function via($notifiable)
    {
        return ['fcm'];
    }

    public function toFcm($notifiable)
    {
        // Kirim ke device user (kalau sudah ada token nanti)
        return CloudMessage::fromArray([
            'notification' => [
                'title' => $this->title,
                'body' => $this->body,
            ],
            'data' => $this->data,
        ]);
    }

    // Method khusus untuk kirim ke topic (dipanggil manual dari controller/job)
    public static function sendToTopic(string $topic, string $title, string $body, array $data = [])
    {
        $message = CloudMessage::fromArray([
            'topic' => $topic,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ]);

        app('firebase.messaging')->send($message);
    }
}