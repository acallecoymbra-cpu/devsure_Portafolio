@php
    $preguntas = \App\Models\Pregunta::query()->visibles()->get();
@endphp

@if ($preguntas->isNotEmpty())
    <section class="seccion seccion--gris preguntas" id="preguntas">
        <div class="contenedor preguntas__interior">
            <div class="preguntas__texto" data-revelar>
                <p class="antetitulo">Preguntas frecuentes</p>
                <h2 class="titulo-seccion">Lo que casi siempre nos preguntan</h2>
                <p class="parrafo-guia">
                    ¿No está tu duda aquí? Escríbenos y te contestamos sin rodeos.
                </p>
                <a class="enlace-flecha" href="mailto:{{ $ajustes->email }}">
                    {{ $ajustes->email }} <x-icono nombre="flecha" />
                </a>
            </div>

            <div class="acordeon" data-revelar>
                @foreach ($preguntas as $indice => $item)
                    <details class="acordeon__item" @if ($indice === 0) open @endif>
                        <summary>
                            {{ $item->pregunta }}
                            <span class="acordeon__signo" aria-hidden="true"></span>
                        </summary>
                        <div class="acordeon__cuerpo">
                            <p>{{ $item->respuesta }}</p>
                        </div>
                    </details>
                @endforeach
            </div>
        </div>
    </section>
@endif
