<?php

namespace Database\Factories;

use App\Enums\EstadoLead;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    /** @var array<int, string> */
    public const SERVICIOS = [
        'Sistemas de información',
        'Aplicaciones web',
        'Cámaras de seguridad',
        'Redes WiFi',
    ];

    /** @var array<int, string> */
    public const PRESUPUESTOS = [
        'Menos de $30,000 MXN',
        '$30,000 - $80,000 MXN',
        'Aún no lo defino',
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'telefono' => fake()->numerify('668 ### ####'),
            'empresa' => fake()->company(),
            'servicio' => fake()->randomElement(self::SERVICIOS),
            'presupuesto' => fake()->randomElement(self::PRESUPUESTOS),
            'mensaje' => fake()->paragraph(),
            'estado' => EstadoLead::Nuevo,
            'pagina_origen' => 'http://localhost/',
            'utm_source' => fake()->randomElement(['google', 'facebook', 'directo', null]),
            'utm_medium' => fake()->randomElement(['cpc', 'organico', null]),
            'utm_campaign' => null,
            'ip' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }

    public function contactado(): static
    {
        return $this->state(fn (): array => [
            'estado' => EstadoLead::Contactado,
            'contactado_en' => now()->subDay(),
        ]);
    }
}
