<?php

namespace Database\Factories;

use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nombre = fake()->unique()->company();

        return [
            'nombre' => $nombre,
            'slug' => Str::slug($nombre),
            'giro' => fake()->randomElement(['Agroexportación', 'Comercio', 'Salud', 'Transporte', 'Agrícola']),
            'logo' => null,
            'sitio_web' => null,
            'visible' => true,
            'orden' => 0,
        ];
    }

    public function oculto(): static
    {
        return $this->state(fn (): array => ['visible' => false]);
    }
}
