<?php

namespace App\Filament\Resources\Preguntas;

use App\Filament\Resources\Preguntas\Pages\CreatePregunta;
use App\Filament\Resources\Preguntas\Pages\EditPregunta;
use App\Filament\Resources\Preguntas\Pages\ListPreguntas;
use App\Filament\Resources\Preguntas\Schemas\PreguntaForm;
use App\Filament\Resources\Preguntas\Tables\PreguntasTable;
use App\Models\Pregunta;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class PreguntaResource extends Resource
{
    protected static ?string $model = Pregunta::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedQuestionMarkCircle;

    protected static string|UnitEnum|null $navigationGroup = 'Contenido del sitio';

    protected static ?int $navigationSort = 4;

    protected static ?string $recordTitleAttribute = 'pregunta';

    public static function getNavigationLabel(): string
    {
        return 'Preguntas frecuentes';
    }

    public static function getModelLabel(): string
    {
        return 'pregunta';
    }

    public static function getPluralModelLabel(): string
    {
        return 'preguntas';
    }

    public static function form(Schema $schema): Schema
    {
        return PreguntaForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PreguntasTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPreguntas::route('/'),
            'create' => CreatePregunta::route('/create'),
            'edit' => EditPregunta::route('/{record}/edit'),
        ];
    }
}
