<?php

namespace App\Notifications\Channels;

use App\Models\Integration;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $integration = Integration::service(Integration::TELEGRAM);
        $token = $integration?->credential('bot_token');
        $chatId = $integration?->setting('chat_id');

        if (! $integration?->enabled || blank($token) || blank($chatId) || ! method_exists($notification, 'toTelegram')) {
            return;
        }

        $respuesta = Http::asJson()
            ->timeout(10)
            ->retry(2, 200, throw: false)
            ->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $notification->toTelegram($notifiable),
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);

        if ($respuesta->failed()) {
            Log::warning('No se pudo enviar el aviso por Telegram.', [
                'status' => $respuesta->status(),
                'body' => $respuesta->body(),
            ]);
        }
    }
}
