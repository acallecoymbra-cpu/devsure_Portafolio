<?php

namespace App\Notifications;

use App\Models\Ajuste;
use Illuminate\Notifications\Notifiable;

/**
 * Destinatario interno de los avisos de nuevos leads. No es un modelo:
 * sus "rutas" salen de los ajustes del sitio.
 */
class EquipoVentas
{
    use Notifiable;

    /**
     * Identificador estable del destinatario. Lo piden las utilidades de
     * pruebas de Laravel, que esperan un notifiable con clave.
     */
    public function getKey(): string
    {
        return 'equipo-ventas';
    }

    /**
     * @return array<int, string>
     */
    public function routeNotificationForMail(): array
    {
        return Ajuste::actuales()->correosDeAviso();
    }
}
