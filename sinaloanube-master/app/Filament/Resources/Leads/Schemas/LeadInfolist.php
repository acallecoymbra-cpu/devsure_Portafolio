<?php

namespace App\Filament\Resources\Leads\Schemas;

use App\Enums\EstadoLead;
use App\Models\Lead;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LeadInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Mensaje')
                ->schema([
                    TextEntry::make('mensaje')
                        ->hiddenLabel()
                        ->prose(),
                ]),

            Section::make('Contacto')
                ->columns(3)
                ->schema([
                    TextEntry::make('email')
                        ->label('Correo')
                        ->copyable()
                        ->url(fn (Lead $lead): string => "mailto:{$lead->email}"),

                    TextEntry::make('telefono')
                        ->label('Teléfono')
                        ->placeholder('—')
                        ->copyable()
                        ->url(fn (Lead $lead): ?string => $lead->telefono
                            ? 'https://wa.me/'.preg_replace('/\D/', '', $lead->telefono)
                            : null)
                        ->openUrlInNewTab(),

                    TextEntry::make('empresa')
                        ->label('Empresa')
                        ->placeholder('—'),
                ]),

            Section::make('Solicitud')
                ->columns(4)
                ->schema([
                    TextEntry::make('servicio')
                        ->label('Servicio')
                        ->badge()
                        ->placeholder('—'),

                    TextEntry::make('presupuesto')
                        ->label('Presupuesto')
                        ->placeholder('—'),

                    TextEntry::make('estado')
                        ->label('Estado')
                        ->badge()
                        ->formatStateUsing(fn (EstadoLead $state): string => $state->etiqueta()),

                    TextEntry::make('contactado_en')
                        ->label('Primer contacto')
                        ->dateTime('d/m/Y H:i')
                        ->placeholder('Sin contactar'),
                ]),

            Section::make('Notas internas')
                ->schema([
                    TextEntry::make('notas_internas')
                        ->hiddenLabel()
                        ->prose()
                        ->placeholder('Sin notas todavía.'),
                ]),

            Section::make('Origen')
                ->columns(3)
                ->collapsed()
                ->schema([
                    TextEntry::make('utm_campaign')->label('Campaña')->placeholder('—'),
                    TextEntry::make('utm_source')->label('Fuente')->placeholder('directo'),
                    TextEntry::make('utm_medium')->label('Medio')->placeholder('—'),
                    TextEntry::make('pagina_origen')->label('Página')->placeholder('—')->columnSpanFull(),
                    TextEntry::make('ip')->label('IP')->placeholder('—'),
                    TextEntry::make('created_at')->label('Recibido')->dateTime('d/m/Y H:i'),
                ]),
        ]);
    }
}
