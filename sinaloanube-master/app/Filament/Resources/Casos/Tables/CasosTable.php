<?php

namespace App\Filament\Resources\Casos\Tables;

use App\Models\Servicio;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CasosTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('orden')
            ->reorderable('orden')
            ->modifyQueryUsing(fn (Builder $query): Builder => $query->with('cliente'))
            ->columns([
                ImageColumn::make('portada')
                    ->label('Portada')
                    ->disk('publico')
                    ->height(40),

                TextColumn::make('titulo')
                    ->label('Título')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold')
                    ->wrap()
                    ->description(fn ($record): ?string => $record->cliente?->nombre),

                TextColumn::make('servicio')
                    ->label('Servicio')
                    ->badge()
                    ->searchable(),

                TextColumn::make('anio')
                    ->label('Año')
                    ->alignCenter()
                    ->placeholder('—'),

                IconColumn::make('destacado')
                    ->label('Destacado')
                    ->boolean(),

                TextColumn::make('publicado_en')
                    ->label('Publicado')
                    ->dateTime('d/m/Y')
                    ->placeholder('Borrador')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('servicio')
                    ->label('Servicio')
                    ->options(fn (): array => Servicio::opcionesParaSelect()),

                SelectFilter::make('cliente')
                    ->label('Cliente')
                    ->relationship('cliente', 'nombre')
                    ->searchable()
                    ->preload(),

                Filter::make('borradores')
                    ->label('Solo borradores')
                    ->query(fn (Builder $query): Builder => $query->where(
                        fn (Builder $query) => $query->whereNull('publicado_en')->orWhere('publicado_en', '>', now())
                    )),
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
            ->emptyStateHeading('Todavía no hay casos')
            ->emptyStateDescription('Empieza con tres casos bien contados: se ven en la portada y cada uno tiene su propia página.');
    }
}
