<?php

namespace App\Models;

use App\Enums\GrupoServicio;
use Database\Factories\ServicioFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    /** @use HasFactory<ServicioFactory> */
    use HasFactory;

    /** Opción comodín del formulario de contacto. */
    public const OTRO = 'Otro / no estoy seguro';

    protected $table = 'servicios';

    protected $fillable = [
        'grupo',
        'clave',
        'icono',
        'titulo',
        'resumen',
        'puntos',
        'visible',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'grupo' => GrupoServicio::class,
            'puntos' => 'array',
            'visible' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Servicio>  $query
     */
    public function scopeVisibles(Builder $query): void
    {
        $query->where('visible', true)->orderBy('orden')->orderBy('id');
    }

    /**
     * Títulos de los servicios visibles, en el orden del sitio.
     *
     * @return array<int, string>
     */
    public static function nombres(): array
    {
        return static::query()->visibles()->pluck('titulo')->all();
    }

    /**
     * Opciones del formulario de contacto: los servicios más el comodín,
     * porque quien escribe no siempre sabe qué necesita.
     *
     * @return array<int, string>
     */
    public static function opcionesDeContacto(): array
    {
        return [...static::nombres(), self::OTRO];
    }

    /**
     * Los servicios en el formato clave => valor que esperan los selectores
     * de Filament. Con $conComodin se agrega "Otro / no estoy seguro".
     *
     * @return array<string, string>
     */
    public static function opcionesParaSelect(bool $conComodin = false): array
    {
        $nombres = $conComodin ? static::opcionesDeContacto() : static::nombres();

        return array_combine($nombres, $nombres);
    }
}
