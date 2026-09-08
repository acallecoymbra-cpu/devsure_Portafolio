<?php

namespace App\Filament\Resources\Casos\Schemas;

use App\Models\Servicio;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CasoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identificación')
                ->columns(2)
                ->schema([
                    TextInput::make('titulo')
                        ->label('Título')
                        ->required()
                        ->maxLength(160)
                        ->columnSpanFull()
                        ->placeholder('Control de embarques de temporada en un solo tablero'),

                    TextInput::make('slug')
                        ->label('Slug')
                        ->maxLength(180)
                        ->unique(ignoreRecord: true)
                        ->helperText('Déjalo vacío y se genera solo. Es la dirección: /casos/mi-caso'),

                    Select::make('cliente_id')
                        ->label('Cliente')
                        ->relationship('cliente', 'nombre')
                        ->searchable()
                        ->preload()
                        ->nullable()
                        ->helperText('Si lo dejas vacío, el caso se publica sin nombre de cliente.'),

                    Select::make('servicio')
                        ->label('Servicio')
                        ->options(fn (): array => Servicio::opcionesParaSelect())
                        ->required()
                        ->helperText('Se usa como filtro en la página de casos.'),

                    TextInput::make('anio')
                        ->label('Año')
                        ->numeric()
                        ->minValue(2000)
                        ->maxValue((int) date('Y') + 1)
                        ->placeholder(date('Y')),
                ]),

            Section::make('Contenido')
                ->schema([
                    Textarea::make('resumen')
                        ->label('Resumen')
                        ->required()
                        ->rows(2)
                        ->maxLength(300)
                        ->helperText('Una o dos líneas. Es lo que se lee en la tarjeta.'),

                    Textarea::make('reto')
                        ->label('El reto')
                        ->rows(4)
                        ->helperText('¿Qué problema tenía el cliente antes de llamarte?'),

                    Textarea::make('solucion')
                        ->label('Lo que hicimos')
                        ->rows(4),

                    Repeater::make('resultados')
                        ->label('Resultados')
                        ->helperText('Lo que más convence son números concretos: "de 1 día a 5 minutos", "18 sucursales".')
                        ->simple(
                            TextInput::make('texto')
                                ->label('Resultado')
                                ->required()
                                ->maxLength(160),
                        )
                        ->defaultItems(3)
                        ->addActionLabel('Agregar resultado')
                        ->reorderable(),
                ]),

            Section::make('Publicación')
                ->columns(2)
                ->schema([
                    FileUpload::make('portada')
                        ->label('Imagen de portada')
                        ->image()
                        ->disk('publico')
                        ->directory('casos')
                        ->visibility('public')
                        ->imageEditor()
                        ->imageEditorAspectRatios(['16:9'])
                        ->maxSize(4096)
                        ->columnSpanFull()
                        ->helperText('Proporción 16:9 (por ejemplo 1200x675). Sin imagen, la tarjeta muestra el nombre del cliente sobre el degradado de la marca.'),

                    DateTimePicker::make('publicado_en')
                        ->label('Publicado el')
                        ->seconds(false)
                        ->default(now())
                        ->helperText('Vacío o con fecha futura = borrador, no se ve en el sitio.'),

                    TextInput::make('orden')
                        ->label('Orden')
                        ->numeric()
                        ->default(0),

                    Toggle::make('destacado')
                        ->label('Destacado')
                        ->helperText('Los destacados salen primero en la portada.'),
                ]),
        ]);
    }
}
