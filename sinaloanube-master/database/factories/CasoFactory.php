<?php

namespace Database\Factories;

use App\Models\Caso;
use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Caso>
 */
class CasoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $titulo = fake()->unique()->sentence(6);

        return [
            'cliente_id' => Cliente::factory(),
            'titulo' => $titulo,
            'slug' => Str::slug($titulo),
            'servicio' => fake()->randomElement(LeadFactory::SERVICIOS),
            'anio' => (string) fake()->numberBetween(2020, (int) date('Y')),
            'resumen' => fake()->sentence(12),
            'reto' => fake()->paragraph(),
            'solucion' => fake()->paragraph(),
            'resultados' => [fake()->sentence(5), fake()->sentence(5), fake()->sentence(5)],
            'portada' => null,
            'destacado' => false,
            'orden' => 0,
            'publicado_en' => now()->subDays(fake()->numberBetween(1, 200)),
        ];
    }

    public function borrador(): static
    {
        return $this->state(fn (): array => ['publicado_en' => null]);
    }

    public function destacado(): static
    {
        return $this->state(fn (): array => ['destacado' => true]);
    }
}
