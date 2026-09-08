<?php

namespace App\Notifications;

use App\Filament\Resources\Leads\LeadResource;
use App\Models\Ajuste;
use App\Models\Integration;
use App\Models\Lead;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Channels\WhatsAppChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NuevoLeadRecibido extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Lead $lead) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $canales = [];

        if (filled(Ajuste::actuales()->correosDeAviso())) {
            $canales[] = 'mail';
        }

        $telegram = Integration::service(Integration::TELEGRAM);

        if ($telegram?->enabled
            && filled($telegram->credential('bot_token'))
            && filled($telegram->setting('chat_id'))) {
            $canales[] = TelegramChannel::class;
        }

        $whatsapp = Integration::service(Integration::WHATSAPP);

        if ($whatsapp?->enabled
            && filled($whatsapp->credential('token'))
            && filled($whatsapp->setting('phone_number_id'))
            && filled($whatsapp->setting('destinatarios'))) {
            $canales[] = WhatsAppChannel::class;
        }

        return $canales;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mensaje = (new MailMessage)
            ->subject("Nuevo prospecto: {$this->lead->nombre}".($this->lead->empresa ? " ({$this->lead->empresa})" : ''))
            ->greeting('Llegó un prospecto nuevo')
            ->line("**Nombre:** {$this->lead->nombre}")
            ->line("**Correo:** {$this->lead->email}");

        if ($this->lead->telefono) {
            $mensaje->line("**Teléfono:** {$this->lead->telefono}");
        }

        if ($this->lead->empresa) {
            $mensaje->line("**Empresa:** {$this->lead->empresa}");
        }

        if ($this->lead->servicio) {
            $mensaje->line("**Servicio de interés:** {$this->lead->servicio}");
        }

        if ($this->lead->presupuesto) {
            $mensaje->line("**Presupuesto:** {$this->lead->presupuesto}");
        }

        return $mensaje
            ->line('**Mensaje:**')
            ->line($this->lead->mensaje)
            ->action('Ver en el panel', LeadResource::getUrl('view', ['record' => $this->lead]))
            ->line('Origen: '.($this->lead->utm_source ?: 'directo').' | Página: '.($this->lead->pagina_origen ?: '-'));
    }

    public function toTelegram(object $notifiable): string
    {
        $lineas = [
            '<b>Nuevo prospecto en '.e(Ajuste::actuales()->marca).'</b>',
            '',
            '<b>Nombre:</b> '.e($this->lead->nombre),
            '<b>Correo:</b> '.e($this->lead->email),
        ];

        if ($this->lead->telefono) {
            $lineas[] = '<b>Teléfono:</b> '.e($this->lead->telefono);
        }

        if ($this->lead->empresa) {
            $lineas[] = '<b>Empresa:</b> '.e($this->lead->empresa);
        }

        if ($this->lead->servicio) {
            $lineas[] = '<b>Servicio:</b> '.e($this->lead->servicio);
        }

        if ($this->lead->presupuesto) {
            $lineas[] = '<b>Presupuesto:</b> '.e($this->lead->presupuesto);
        }

        $lineas[] = '';
        $lineas[] = e($this->lead->mensaje);
        $lineas[] = '';
        $lineas[] = LeadResource::getUrl('view', ['record' => $this->lead]);

        return implode("\n", $lineas);
    }

    /**
     * Texto plano para WhatsApp, y también los parámetros de la plantilla
     * cuando se configura una plantilla aprobada.
     *
     * @return array{texto: string, parametros: array<int, string>}
     */
    public function toWhatsApp(object $notifiable): array
    {
        $resumen = trim(mb_substr($this->lead->mensaje, 0, 300));

        $texto = 'Nuevo prospecto en '.Ajuste::actuales()->marca."\n"
            ."Nombre: {$this->lead->nombre}\n"
            ."Correo: {$this->lead->email}\n"
            .($this->lead->telefono ? "Teléfono: {$this->lead->telefono}\n" : '')
            .($this->lead->empresa ? "Empresa: {$this->lead->empresa}\n" : '')
            .($this->lead->servicio ? "Servicio: {$this->lead->servicio}\n" : '')
            ."\n{$resumen}";

        return [
            'texto' => $texto,
            'parametros' => [
                $this->lead->nombre,
                $this->lead->servicio ?: 'Sin especificar',
                $this->lead->telefono ?: $this->lead->email,
            ],
        ];
    }
}
