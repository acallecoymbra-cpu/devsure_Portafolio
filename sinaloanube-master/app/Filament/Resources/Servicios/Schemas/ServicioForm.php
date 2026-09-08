<?php

namespace App\Filament\Resources\Servicios\Schemas;

use App\Enums\GrupoServicio;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ServicioForm
{
    /**
     * Íconos disponibles en resources/views/components/icono.blade.php.
     *
     * @var array<string, string>
     */
    public const ICONOS = [
        'sistemas' => 'Sistemas',
        'escritorio' => 'Escritorio',
        'web' => 'Web',
        'movil' => 'Móvil',
        'camara' => 'Cámara',
        'wifi' => 'WiFi',
        'instalacion' => 'Instalación',
        'nube' => 'Nube',
        'escudo' => 'Escudo',
        'reloj' => 'Reloj',
    ];

    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make()
                ->columns(2)
                ->schema([
                    TextInput::make('titulo')
                        ->label('Título')
                        ->required()
                        ->maxLength(80)
                        ->columnSpanFull(),

                    Select::make('grupo')
                        ->label('Grupo')
                        ->options(GrupoServicio::opciones())
                        ->required()
                        ->helperText('Determina bajo qué encabezado sale en la portada.'),

                    Select::make('icono')
                        ->label('Ícono')
                        ->options(self::ICONOS)
                        ->required()
                        ->default('nube'),

                    TextInput::make('clave')
                        ->label('Clave')
                        ->maxLength(8)
                        ->placeholder('SI, WEB, CAM…')
                        ->helperText('La etiqueta corta en la esquina de la tarjeta.'),

                    TextInput::make('orden')
                        ->label('Orden')
                        ->numeric()
                        ->default(0),

                    Textarea::make('resumen')
                        ->label('Resumen')
                        ->required()
                        ->rows(2)
                        ->maxLength(300)
                        ->columnSpanFull(),

                    Repeater::make('puntos')
                        ->label('Puntos')
                        ->helperText('Los tres bullets con palomita de la tarjeta.')
                        ->simple(
                            TextInput::make('punto')
                                ->label('Punto')
                                ->required()
                                ->maxLength(80),
                        )
                        ->defaultItems(3)
                        ->addActionLabel('Agregar punto')
                        ->reorderable()
                        ->columnSpanFull(),

                    Toggle::make('visible')
                        ->label('Visible en el sitio')
                        ->default(true),
                ]),
        ]);
    }
}
