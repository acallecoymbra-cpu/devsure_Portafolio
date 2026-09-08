<?php

namespace App\Enums;

enum EstadoLead: string
{
    case Nuevo = 'nuevo';
    case Contactado = 'contactado';
    case Calificado = 'calificado';
    case Ganado = 'ganado';
    case Perdido = 'perdido';

    public function etiqueta(): string
    {
        return match ($this) {
            self::Nuevo => 'Nuevo',
            self::Contactado => 'Contactado',
            self::Calificado => 'Calificado',
            self::Ganado => 'Ganado',
            self::Perdido => 'Perdido',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Nuevo => 'azul',
            self::Contactado => 'ambar',
            self::Calificado => 'violeta',
            self::Ganado => 'verde',
            self::Perdido => 'rojo',
        };
    }
}
