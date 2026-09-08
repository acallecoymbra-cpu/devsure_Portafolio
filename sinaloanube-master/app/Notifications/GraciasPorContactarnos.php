<?php

namespace App\Notifications;

use App\Models\Ajuste;
use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Acuse de recibo que se envía al prospecto.
 */
class GraciasPorContactarnos extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        /** @var Lead $notifiable */
        $ajustes = Ajuste::actuales();
        $primerNombre = explode(' ', trim($notifiable->nombre))[0];

        return (new MailMessage)
            ->subject('Recibimos tu mensaje | '.$ajustes->marca)
            ->greeting("Hola {$primerNombre},")
            ->line('Gracias por escribirnos. Ya tenemos tu solicitud y un asesor te contactara dentro de las proximas 24 horas habiles.')
            ->line('**Esto fue lo que nos enviaste:**')
            ->line($notifiable->mensaje)
            ->line('Si es algo urgente, marcanos al '.$ajustes->telefono.'.')
            ->salutation('Un saludo, el equipo de '.$ajustes->marca);
    }
}
