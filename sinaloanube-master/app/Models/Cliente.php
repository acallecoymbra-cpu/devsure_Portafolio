<?php

namespace App\Models;

use Database\Factories\ClienteFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Cliente extends Model
{
    /** @use HasFactory<ClienteFactory> */
    use HasFactory;

    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'slug',
        'giro',
        'logo',
        'sitio_web',
        'visible',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'visible' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Cliente $cliente) {
            if (blank($cliente->slug) && filled($cliente->nombre)) {
                $cliente->slug = Str::slug($cliente->nombre);
            }
        });
    }

    /**
     * @return HasMany<Caso, $this>
     */
    public function casos(): HasMany
    {
        return $this->hasMany(Caso::class);
    }

    /**
     * Caso al que apunta el logotipo en la franja de la portada.
     */
    public function casoDestacado(): ?Caso
    {
        return $this->casos
            ->filter(fn (Caso $caso): bool => $caso->estaPublicado())
            ->sortByDesc('destacado')
            ->sortBy('orden')
            ->first();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @param  Builder<Cliente>  $query
     */
    public function scopeVisibles(Builder $query): void
    {
        $query->where('visible', true)->orderBy('orden')->orderBy('nombre');
    }
}
