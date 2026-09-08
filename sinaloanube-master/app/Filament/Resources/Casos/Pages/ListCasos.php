<?php

namespace App\Filament\Resources\Casos\Pages;

use App\Filament\Resources\Casos\CasoResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCasos extends ListRecords
{
    protected static string $resource = CasoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
