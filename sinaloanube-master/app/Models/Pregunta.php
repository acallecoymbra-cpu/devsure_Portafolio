<?php

namespace App\Models;

use Database\Factories\PreguntaFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    /** @use HasFactory<PreguntaFactory> */
    use HasFactory;

    protected $table = 'preguntas';

    protected $fillable = [
        'pregunta',
        'respuesta',
        'visible',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'visible' => 'boolean',
        ];
    }

    /**
     * @param  Builder<Pregunta>  $query
     */
    public function scopeVisibles(Builder $query): void
    {
        $query->where('visible', true)->orderBy('orden')->orderBy('id');
    }
}
