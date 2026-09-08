<?php

namespace App\Http\Controllers;

use App\Enums\EstadoLead;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use App\Notifications\EquipoVentas;
use App\Notifications\GraciasPorContactarnos;
use App\Notifications\NuevoLeadRecibido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class LeadController extends Controller
{
    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $lead = Lead::create([
            ...$request->safe()->except('acepto_privacidad', 'sitio_web'),
            'estado' => EstadoLead::Nuevo,
            'pagina_origen' => $request->headers->get('referer'),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $this->avisar($lead);

        return redirect()
            ->route('landing', ['enviado' => 1])
            ->withFragment('contacto')
            ->with('estado_contacto', 'Gracias, recibimos tu mensaje. Te contactamos dentro de las próximas 24 horas hábiles.');
    }

    /**
     * Los avisos nunca deben tumbar el envio: el lead ya quedo guardado.
     */
    protected function avisar(Lead $lead): void
    {
        try {
            (new EquipoVentas)->notify(new NuevoLeadRecibido($lead));
        } catch (Throwable $e) {
            Log::error('Fallo el aviso interno del lead.', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }

        try {
            $lead->notify(new GraciasPorContactarnos);
        } catch (Throwable $e) {
            Log::error('Fallo el acuse de recibo al prospecto.', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }
    }
}
