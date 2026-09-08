<?php

namespace App\Filament\Resources\Clientes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class ClientesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('orden')
            ->reorderable('orden')
            ->columns([
                ImageColumn::make('logo')
                    ->label('Logo')
                    ->disk('publico')
                    ->height(32)
                    ->defaultImageUrl(null),

                TextColumn::make('nombre')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold'),

                TextColumn::make('giro')
                    ->label('Giro')
                    ->searchable()
                    ->placeholder('—'),

                TextColumn::make('casos_count')
                    ->label('Casos')
                    ->counts('casos')
                    ->alignCenter(),

                IconColumn::make('visible')
                    ->label('Visible')
                    ->boolean(),
            ])
            ->filters([
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
            ])
            ->emptyStateHeading('Todavía no hay clientes')
            ->emptyStateDescription('Agrega tus clientes y sus logotipos para que aparezcan en la franja de la portada.');
    }
}
