@php
    $casos = \App\Models\Caso::query()->with('cliente')->publicados()->take(3)->get();
@endphp

@if ($casos->isNotEmpty())
    <section class="seccion seccion--fria casos" id="casos">
        <div class="contenedor">
            <div class="encabezado-seccion encabezado-seccion--partido" data-revelar>
                <div>
                    <p class="antetitulo">Casos de éxito</p>
                    <h2 class="titulo-seccion">Lo que hemos resuelto para otros negocios</h2>
                </div>
                <a class="boton boton--marca" href="{{ route('casos.index') }}">
                    Ver todos los casos <x-icono nombre="flecha" />
                </a>
            </div>

            <div class="rejilla-casos" data-revelar>
                @foreach ($casos as $caso)
                    <x-tarjeta-caso :caso="$caso" />
                @endforeach
            </div>
        </div>
    </section>
@endif
