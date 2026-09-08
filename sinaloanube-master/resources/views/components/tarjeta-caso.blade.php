@props(['caso'])

<article class="tarjeta-caso">
    <a class="tarjeta-caso__enlace" href="{{ route('casos.show', $caso) }}">
        <span class="tarjeta-caso__medio">
            @if ($caso->portada)
                <img src="{{ \Illuminate\Support\Facades\Storage::disk('publico')->url($caso->portada) }}"
                     alt="" loading="lazy">
                @if ($caso->cliente)
                    <span class="placa-logo tarjeta-caso__placa">
                        <x-logo-cliente :cliente="$caso->cliente" />
                    </span>
                @endif
            @elseif ($caso->cliente)
                <span class="tarjeta-caso__marca">
                    <x-logo-cliente :cliente="$caso->cliente" />
                </span>
            @else
                <span class="tarjeta-caso__marca">
                    <span class="logo-cliente logo-cliente--texto">{{ $caso->servicio }}</span>
                </span>
            @endif
        </span>

        <span class="tarjeta-caso__cuerpo">
            <span class="tarjeta-caso__meta">
                <span class="pastilla">{{ $caso->servicio }}</span>
                <span>
                    {{ $caso->cliente?->giro }}@if ($caso->cliente?->giro && $caso->anio) · @endif{{ $caso->anio }}
                </span>
            </span>

            <span class="tarjeta-caso__titulo">{{ $caso->titulo }}</span>
            <span class="tarjeta-caso__resumen">{{ $caso->resumen }}</span>

            <span class="enlace-flecha">Ver el caso <x-icono nombre="flecha" /></span>
        </span>
    </a>
</article>
