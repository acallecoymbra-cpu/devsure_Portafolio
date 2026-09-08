<?php

namespace App\Filament\Resources\Leads\Pages;

use App\Filament\Resources\Leads\LeadResource;
use App\Models\Lead;
use Filament\Actions\Action;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListLeads extends ListRecords
{
    protected static string $resource = LeadResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('exportar')
                ->label('Exportar CSV')
                ->icon(Heroicon::OutlinedArrowDownTray)
                ->color('gray')
                // Exporta lo que esté filtrado en la tabla, no toda la base.
                ->action(fn (): StreamedResponse => self::csvDe($this->getFilteredSortedTableQuery())),
        ];
    }

    /**
     * @param  Builder<Lead>  $consulta
     */
    public static function csvDe(Builder $consulta): StreamedResponse
    {
        return response()->streamDownload(function () use ($consulta) {
            $salida = fopen('php://output', 'w');

            // BOM para que Excel respete los acentos.
            fwrite($salida, "\xEF\xBB\xBF");

            fputcsv($salida, [
                'ID', 'Fecha', 'Nombre', 'Correo', 'Teléfono', 'Empresa',
                'Servicio', 'Presupuesto', 'Estado', 'Mensaje',
                'UTM source', 'UTM medium', 'UTM campaign', 'Notas internas',
            ]);

            $consulta->chunk(500, function ($leads) use ($salida) {
                foreach ($leads as $lead) {
                    /** @var Lead $lead */
                    fputcsv($salida, [
                        $lead->id,
                        $lead->created_at->format('Y-m-d H:i'),
                        $lead->nombre,
                        $lead->email,
                        $lead->telefono,
                        $lead->empresa,
                        $lead->servicio,
                        $lead->presupuesto,
                        $lead->estado->etiqueta(),
                        $lead->mensaje,
                        $lead->utm_source,
                        $lead->utm_medium,
                        $lead->utm_campaign,
                        $lead->notas_internas,
                    ]);
                }
            });

            fclose($salida);
        }, 'prospectos-'.now()->format('Y-m-d-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
