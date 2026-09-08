<?php

use App\Http\Controllers\CasoController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::get('/', LandingController::class)->name('landing');

Route::post('/contacto', [LeadController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('leads.store');

Route::get('/casos', [CasoController::class, 'index'])->name('casos.index');
Route::get('/casos/{caso:slug}', [CasoController::class, 'show'])->name('casos.show');

Route::view('/aviso-de-privacidad', 'privacidad')->name('privacidad');

// El panel interno lo sirve Filament en /admin (ver AdminPanelProvider).
