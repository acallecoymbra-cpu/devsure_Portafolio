<?php

namespace Database\Seeders;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Sergio',
                'email' => 'sergio@sinaloanube.com',
                'password' => Hash::make('cambiame-por-favor'),
            ],
        );

        // Contenido real del sitio: corre también en producción para no arrancar vacío.
        $this->call(ContenidoInicialSeeder::class);

        Integration::query()->firstOrCreate(['service' => Integration::TELEGRAM], [
            'enabled' => false,
            'settings' => [],
        ]);
        Integration::query()->firstOrCreate(['service' => Integration::WHATSAPP], [
            'enabled' => false,
            'settings' => [],
        ]);

        if (class_exists(ContenidoDeEjemploSeeder::class)) {
            $this->call(ContenidoDeEjemploSeeder::class);
        }
    }
}
