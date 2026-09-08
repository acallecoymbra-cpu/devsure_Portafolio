<?php

namespace App\Filament\Resources\Servicios\Tables;

use App\Enums\GrupoServicio;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class ServiciosTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('orden')
            ->reorderable('orden')
            ->columns([
                TextColumn::make('clave')
                    ->label('Clave')
                    ->badge()
                    ->placeholder('—'),

                TextColumn::make('titulo')
                    ->label('Servicio')
                    ->searchable()
                    ->weight('semibold')
                    ->description(fn ($record): string => $record->resumen),

                TextColumn::make('grupo')
                    ->label('Grupo')
                    ->formatStateUsing(fn (GrupoServicio $state): string => $state->etiqueta())
                    ->badge(),

                IconColumn::make('visible')
                    ->label('Visible')
                    ->boolean(),
            ])
            ->filters([
                SelectFilter::make('grupo')
                    ->label('Grupo')
                    ->options(GrupoServicio::opciones()),

                TernaryFilter::make('visible')
                    ->label('Visible en el sitio'),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
