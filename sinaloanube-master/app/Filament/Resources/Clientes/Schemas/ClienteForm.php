<?php

namespace App\Filament\Resources\Clientes\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ClienteForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Datos del cliente')
                ->columns(2)
                ->schema([
                    TextInput::make('nombre')
                        ->label('Nombre')
                        ->required()
                        ->maxLength(120),

                    TextInput::make('giro')
                        ->label('Giro')
                        ->maxLength(120)
                        ->placeholder('Agroexportación, comercio, clínica…'),

                    TextInput::make('slug')
                        ->label('Slug')
                        ->maxLength(140)
                        ->unique(ignoreRecord: true)
                        ->helperText('Déjalo vacío y se genera solo a partir del nombre.'),

                    TextInput::make('sitio_web')
                        ->label('Sitio web')
                        ->url()
                        ->maxLength(200)
                        ->placeholder('https://…'),
                ]),

            Section::make('Logotipo y orden')
                ->columns(2)
                ->schema([
                    FileUpload::make('logo')
                        ->label('Logotipo')
                        ->image()
                        ->disk('publico')
                        ->directory('clientes')
                        ->visibility('public')
                        ->maxSize(2048)
                        ->columnSpanFull()
                        ->helperText('SVG o PNG con fondo transparente. En la franja se muestra a 46 px de alto, en escala de grises, y toma color al pasar el mouse. Si lo dejas vacío se muestra el nombre en texto.'),

                    TextInput::make('orden')
                        ->label('Orden')
                        ->numeric()
                        ->default(0)
                        ->helperText('Menor número aparece primero en la franja.'),

                    Toggle::make('visible')
                        ->label('Visible en el sitio')
                        ->default(true),
                ]),
        ]);
    }
}
