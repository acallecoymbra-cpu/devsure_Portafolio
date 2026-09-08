<?php

namespace App\Models;

use App\Enums\EstadoLead;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'nombre',
        'email',
        'telefono',
        'empresa',
        'servicio',
        'presupuesto',
        'mensaje',
        'estado',
        'notas_internas',
        'contactado_en',
        'pagina_origen',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoLead::class,
            'contactado_en' => 'datetime',
        ];
    }

    /**
     * @param  Builder<Lead>  $query
     */
    public function scopeBuscar(Builder $query, ?string $termino): void
    {
        $query->when($termino, function (Builder $query) use ($termino) {
            $query->where(function (Builder $query) use ($termino) {
                $query->where('nombre', 'like', "%{$termino}%")
                    ->orWhere('email', 'like', "%{$termino}%")
                    ->orWhere('empresa', 'like', "%{$termino}%")
                    ->orWhere('telefono', 'like', "%{$termino}%");
            });
        });
    }
}
