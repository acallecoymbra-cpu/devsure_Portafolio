<?php

namespace App\Models;

use Database\Factories\CasoFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Caso extends Model
{
    /** @use HasFactory<CasoFactory> */
    use HasFactory;

    protected $table = 'casos';

    protected $fillable = [
        'cliente_id',
        'titulo',
        'slug',
        'servicio',
        'anio',
        'resumen',
        'reto',
        'solucion',
        'resultados',
        'portada',
        'destacado',
        'orden',
        'publicado_en',
    ];

    protected function casts(): array
    {
        return [
            'resultados' => 'array',
            'destacado' => 'boolean',
            'publicado_en' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Caso $caso) {
            if (blank($caso->slug) && filled($caso->titulo)) {
                $caso->slug = Str::slug($caso->titulo);
            }
        });
    }

    /**
     * @return BelongsTo<Cliente, $this>
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function estaPublicado(): bool
    {
        return $this->publicado_en !== null && $this->publicado_en->isPast();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @param  Builder<Caso>  $query
     */
    public function scopePublicados(Builder $query): void
    {
        $query->whereNotNull('publicado_en')
            ->where('publicado_en', '<=', now())
            ->orderByDesc('destacado')
            ->orderBy('orden')
            ->orderByDesc('publicado_en');
    }
}
