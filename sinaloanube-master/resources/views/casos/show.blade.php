@extends('layouts.publico')

@section('titulo', $caso->titulo.' | '.$ajustes->marca)
@section('descripcion', $caso->resumen)

@section('contenido')
    <section class="portada-interior">
        <div class="contenedor">
            @if ($caso->cliente)
                <span class="placa-logo placa-logo--portada">
                    <x-logo-cliente :cliente="$caso->cliente" />
                </span>
            @endif

            <p class="antetitulo antetitulo--claro">{{ $caso->servicio }}</p>
            <h1 class="portada-interior__titulo">{{ $caso->titulo }}</h1>
            <p class="portada-interior__entrada">{{ $caso->resumen }}</p>

            <dl class="portada-interior__datos">
                @if ($caso->cliente)
                    <div>
                        <dt>Cliente</dt>
                        <dd>{{ $caso->cliente->nombre }}</dd>
                    </div>
                    @if ($caso->cliente->giro)
                        <div>
                            <dt>Giro</dt>
                            <dd>{{ $caso->cliente->giro }}</dd>
                        </div>
                    @endif
                @endif
                @if ($caso->anio)
                    <div>
                        <dt>Año</dt>
                        <dd>{{ $caso->anio }}</dd>
                    </div>
                @endif
            </dl>
        </div>
    </section>

    <section class="seccion">
        <div class="contenedor caso-detalle">
            <div class="caso-detalle__cuerpo">
                @if ($caso->portada)
                    <img class="caso-detalle__imagen"
                         src="{{ \Illuminate\Support\Facades\Storage::disk('publico')->url($caso->portada) }}"
                         alt="{{ $caso->titulo }}" loading="lazy">
                @endif

                @if ($caso->reto)
                    <h2>El reto</h2>
                    <p class="parrafo-guia">{{ $caso->reto }}</p>
                @endif

                @if ($caso->solucion)
                    <h2>Lo que hicimos</h2>
                    <p class="parrafo-guia">{{ $caso->solucion }}</p>
                @endif
            </div>

            <aside class="caso-detalle__lateral">
                @if (filled($caso->resultados))
                    <div class="caso-resultados">
                        <h2>Resultados</h2>
                        <ul class="lista-check">
                            @foreach ($caso->resultados as $resultado)
                                <li><x-icono nombre="check" /> {{ $resultado }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <div class="caso-cta">
                    <p><strong>¿Te suena parecido a lo tuyo?</strong></p>
                    <p>Platiquemos sin compromiso y te decimos qué haría falta.</p>
                    <a class="boton boton--marca boton--bloque" href="{{ route('landing') }}#contacto">
                        Cuéntanos tu proyecto <x-icono nombre="flecha" />
                    </a>
                </div>
            </aside>
        </div>

        @if ($otros->isNotEmpty())
            <div class="contenedor otros-casos">
                <h2 class="titulo-seccion">Otros casos</h2>
                <div class="rejilla-casos">
                    @foreach ($otros as $otro)
                        <x-tarjeta-caso :caso="$otro" />
                    @endforeach
                </div>
            </div>
        @endif
    </section>
@endsection
