@php
    $servicios = \App\Models\Servicio::query()->visibles()->get();
    $grupos = $servicios->groupBy(fn ($servicio) => $servicio->grupo->value);
@endphp

@if ($grupos->isNotEmpty())
    <section class="seccion seccion--gris servicios" id="servicios">
        <div class="contenedor">
            <div class="encabezado-seccion" data-revelar>
                <p class="antetitulo">Nuestros servicios</p>
                <h2 class="titulo-seccion">
                    {{ $servicios->count() }} líneas de servicio, un solo proveedor
                </h2>
                <p class="parrafo-guia">
                    Del sistema que administra tu operación a las cámaras y la red que la sostienen.
                    Todo con el mismo equipo y un solo interlocutor.
                </p>
            </div>

            @foreach (\App\Enums\GrupoServicio::cases() as $grupo)
                @php($delGrupo = $grupos->get($grupo->value))
                @if ($delGrupo)
                    <div class="grupo-servicios" data-revelar>
                        <div class="grupo-servicios__encabezado">
                            <h3>{{ $grupo->etiqueta() }}</h3>
                            <p>{{ $grupo->descripcion() }}</p>
                        </div>

                        <div class="rejilla-servicios">
                            @foreach ($delGrupo as $servicio)
                                <article class="tarjeta-servicio">
                                    <span class="tarjeta-servicio__icono">
                                        <x-icono :nombre="$servicio->icono" />
                                    </span>
                                    @if ($servicio->clave)
                                        <span class="tarjeta-servicio__clave">{{ $servicio->clave }}</span>
                                    @endif

                                    <h4>{{ $servicio->titulo }}</h4>
                                    <p>{{ $servicio->resumen }}</p>

                                    @if (filled($servicio->puntos))
                                        <ul class="lista-check">
                                            @foreach ($servicio->puntos as $punto)
                                                <li><x-icono nombre="check" /> {{ $punto }}</li>
                                            @endforeach
                                        </ul>
                                    @endif

                                    <a class="enlace-flecha" href="#contacto">
                                        Cotizar este servicio <x-icono nombre="flecha" />
                                    </a>
                                </article>
                            @endforeach
                        </div>
                    </div>
                @endif
            @endforeach
        </div>
    </section>
@endif
