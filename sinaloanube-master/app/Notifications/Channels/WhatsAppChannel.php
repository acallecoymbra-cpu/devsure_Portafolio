<?php

namespace App\Notifications\Channels;

use App\Models\Integration;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envia el aviso por la WhatsApp Cloud API de Meta.
 *
 * Si se configura una plantilla se envia como plantilla aprobada
 * (necesario para escribir fuera de la ventana de 24 horas). Si no,
 * se envia texto libre, que solo llega si el destinatario escribio
 * al numero en las ultimas 24 horas.
 */
class WhatsAppChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $integration = Integration::service(Integration::WHATSAPP);
        $token = $integration?->credential('token');
        $phoneNumberId = $integration?->setting('phone_number_id');
        $destinatarios = $integration?->setting('destinatarios', []);

        if (! $integration?->enabled || blank($token) || blank($phoneNumberId) || blank($destinatarios) || ! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        $contenido = $notification->toWhatsApp($notifiable);
        $version = $integration->setting('version_api', 'v21.0');
        $url = "https://graph.facebook.com/{$version}/{$phoneNumberId}/messages";

        foreach ($destinatarios as $destinatario) {
            $respuesta = Http::withToken($token)
                ->asJson()
                ->timeout(10)
                ->retry(2, 200, throw: false)
                ->post($url, $this->cuerpo($integration, $destinatario, $contenido));

            if ($respuesta->failed()) {
                Log::warning('No se pudo enviar el aviso por WhatsApp.', [
                    'destinatario' => $destinatario,
                    'status' => $respuesta->status(),
                    'body' => $respuesta->body(),
                ]);
            }
        }
    }

    /**
     * @param  array{texto: string, parametros: array<int, string>}  $contenido
     * @return array<string, mixed>
     */
    protected function cuerpo(Integration $integration, string $destinatario, array $contenido): array
    {
        $plantilla = $integration->setting('plantilla');

        if (blank($plantilla)) {
            return [
                'messaging_product' => 'whatsapp',
                'to' => $destinatario,
                'type' => 'text',
                'text' => ['body' => $contenido['texto']],
            ];
        }

        return [
            'messaging_product' => 'whatsapp',
            'to' => $destinatario,
            'type' => 'template',
            'template' => [
                'name' => $plantilla,
                'language' => ['code' => $integration->setting('idioma', 'es_MX')],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(
                        fn (string $valor): array => ['type' => 'text', 'text' => $valor],
                        $contenido['parametros'],
                    ),
                ]],
            ],
        ];
    }
}
