<?php

namespace App\Filament\Resources\Preguntas\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PreguntaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make()->schema([
                TextInput::make('pregunta')
                    ->label('Pregunta')
                    ->required()
                    ->maxLength(160),

                Textarea::make('respuesta')
                    ->label('Respuesta')
                    ->required()
                    ->rows(4),

                TextInput::make('orden')
                    ->label('Orden')
                    ->numeric()
                    ->default(0),

                Toggle::make('visible')
                    ->label('Visible en el sitio')
                    ->default(true),
            ]),
        ]);
    }
}
