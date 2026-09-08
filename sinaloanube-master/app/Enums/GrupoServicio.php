<?php

namespace App\Enums;

/**
 * Los dos bloques en los que se agrupan los servicios de la portada.
 */
enum GrupoServicio: string
{
    case Desarrollo = 'desarrollo';
    case Infraestructura = 'infraestructura';

    public function etiqueta(): string
    {
        return match ($this) {
            self::Desarrollo => 'Desarrollo de software',
            self::Infraestructura => 'Videovigilancia y conectividad',
        };
    }

    public function descripcion(): string
    {
        return match ($this) {
            self::Desarrollo => 'Sistemas hechos a partir de cómo opera tu negocio, no al revés.',
            self::Infraestructura => 'Infraestructura instalada y configurada llave en mano.',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function opciones(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn (self $grupo): array => [$grupo->value => $grupo->etiqueta()])
            ->all();
    }
}
