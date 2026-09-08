<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Registro único de ajustes del sitio. Se lee en casi todas las páginas,
 * así que va en caché y se invalida al guardar desde el panel.
 */
class Ajuste extends Model
{
    protected $table = 'ajustes';

    public const CLAVE_CACHE = 'ajustes-del-sitio';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'metricas' => 'array',
            'diferenciadores' => 'array',
            'proceso' => 'array',
            'presupuestos' => 'array',
            'leads_emails' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CLAVE_CACHE));
        static::deleted(fn () => Cache::forget(self::CLAVE_CACHE));
    }

    /**
     * Los ajustes vigentes. Siempre devuelve un modelo, aunque la tabla
     * esté vacía, para que las vistas nunca revienten.
     */
    public static function actuales(): self
    {
        // Se cachean los atributos, no el modelo: serializar Eloquent entre
        // peticiones es frágil y revienta si la caché queda de una versión vieja.
        $atributos = Cache::rememberForever(
            self::CLAVE_CACHE,
            fn (): array => static::query()->first()?->attributesToArray()
                ?? static::valoresPorDefecto(),
        );

        return (new static)->newInstance($atributos, exists: isset($atributos['id']));
    }

    /**
     * @return array<string, mixed>
     */
    public static function valoresPorDefecto(): array
    {
        return [
            'marca' => 'Sinaloa Nube',
            'razon_social' => 'Sinaloa Nube Sistemas',
            'claim' => 'Soluciones tecnológicas · México y el mundo',
            'titulo_hero' => '10 años transformando ideas en soluciones tecnológicas',
            'entrada_hero' => 'Desarrollo de sistemas de información, aplicaciones de escritorio, web y móviles, además de videovigilancia y conectividad, para clientes en México y en cualquier parte del mundo.',
            'imagen_hero' => null,
            'metricas' => [],
            'diferenciadores' => [],
            'proceso' => [],
            'presupuestos' => [],
            'leads_emails' => [],
        ];
    }

    /**
     * URL pública de la imagen que se subió desde el panel.
     */
    public function urlImagenHero(): ?string
    {
        return filled($this->imagen_hero)
            ? Storage::disk('publico')->url($this->imagen_hero)
            : null;
    }

    /**
     * Correos a los que se avisa de un prospecto nuevo.
     *
     * @return array<int, string>
     */
    public function correosDeAviso(): array
    {
        return array_values(array_filter(
            array_map('trim', $this->leads_emails ?? []),
        ));
    }
}
