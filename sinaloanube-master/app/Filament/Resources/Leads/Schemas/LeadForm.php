<?php

namespace App\Filament\Resources\Leads\Schemas;

use App\Enums\EstadoLead;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class LeadForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Seguimiento')
                ->description('Lo que envió el prospecto no se edita: se conserva tal cual llegó.')
                ->columns(2)
                ->schema([
                    Select::make('estado')
                        ->label('Estado')
                        ->options(collect(EstadoLead::cases())
                            ->mapWithKeys(fn (EstadoLead $estado): array => [$estado->value => $estado->etiqueta()])
                            ->all())
                        ->required(),

                    DateTimePicker::make('contactado_en')
                        ->label('Primer contacto')
                        ->seconds(false)
                        ->helperText('Se llena solo al sacarlo de "Nuevo".'),

                    Textarea::make('notas_internas')
                        ->label('Notas internas')
                        ->rows(6)
                        ->columnSpanFull()
                        ->placeholder('Qué se habló, siguientes pasos, quién le da seguimiento…'),
                ]),
        ]);
    }
}
