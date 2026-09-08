@php
    $clientes = \App\Models\Cliente::query()->visibles()->with('casos')->get();
@endphp

@if ($clientes->isNotEmpty())
    <section class="franja-clientes" aria-label="Clientes que confían en nosotros">
        <div class="contenedor franja-clientes__interior">
            <p class="franja-clientes__titulo">
                Empresas que ya confían su tecnología a {{ $ajustes->marca }}
            </p>

            {{--
                La marquesina duplica la lista para que el desplazamiento sea
                continuo. La copia lleva aria-hidden para no repetir el contenido
                a los lectores de pantalla.
            --}}
            <div class="marquesina">
                @foreach ([false, true] as $esCopia)
                    <ul class="marquesina__pista" @if ($esCopia) aria-hidden="true" @endif>
                        @foreach ($clientes as $cliente)
                            @php($caso = $cliente->casoDestacado())
                            <li class="marquesina__item">
                                @if ($caso)
                                    <a href="{{ route('casos.show', $caso) }}"
                                       title="Ver el caso de {{ $cliente->nombre }}"
                                       @if ($esCopia) tabindex="-1" @endif>
                                        <x-logo-cliente :cliente="$cliente" />
                                    </a>
                                @else
                                    <x-logo-cliente :cliente="$cliente" />
                                @endif
                            </li>
                        @endforeach
                    </ul>
                @endforeach
            </div>

            @if ($hayCasos ?? false)
                <a class="enlace-flecha franja-clientes__enlace" href="{{ route('casos.index') }}">
                    Ver casos de éxito <x-icono nombre="flecha" />
                </a>
            @endif
        </div>
    </section>
@endif
