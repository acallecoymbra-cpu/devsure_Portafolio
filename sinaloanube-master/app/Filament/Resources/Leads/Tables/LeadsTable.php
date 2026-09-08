<?php

namespace App\Filament\Resources\Leads\Tables;

use App\Enums\EstadoLead;
use App\Models\Lead;
use App\Models\Servicio;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class LeadsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                TextColumn::make('nombre')
                    ->label('Prospecto')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold')
                    ->description(fn (Lead $lead): ?string => $lead->empresa),

                TextColumn::make('email')
                    ->label('Contacto')
                    ->searchable()
                    ->copyable()
                    ->description(fn (Lead $lead): ?string => $lead->telefono),

                TextColumn::make('servicio')
                    ->label('Interés')
                    ->badge()
                    ->searchable()
                    ->placeholder('—')
                    ->description(fn (Lead $lead): ?string => $lead->presupuesto),

                TextColumn::make('estado')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (EstadoLead $state): string => $state->etiqueta())
                    ->color(fn (EstadoLead $state): string => match ($state) {
                        EstadoLead::Nuevo => 'info',
                        EstadoLead::Contactado => 'warning',
                        EstadoLead::Calificado => 'primary',
                        EstadoLead::Ganado => 'success',
                        EstadoLead::Perdido => 'danger',
                    }),
            ])
            ->filters([
                SelectFilter::make('estado')
                    ->label('Estado')
                    ->options(collect(EstadoLead::cases())
                        ->mapWithKeys(fn (EstadoLead $estado): array => [$estado->value => $estado->etiqueta()])
                        ->all()),

                SelectFilter::make('servicio')
                    ->label('Servicio')
                    ->options(fn (): array => Servicio::opcionesParaSelect(conComodin: true)),

                Filter::make('de_este_mes')
                    ->label('De este mes')
                    ->query(fn (Builder $query): Builder => $query->where('created_at', '>=', now()->startOfMonth())),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make()->label('Seguimiento'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('Todavía no llegan prospectos')
            ->emptyStateDescription('Cuando alguien llene el formulario del sitio, aparecerá aquí.');
    }
}
