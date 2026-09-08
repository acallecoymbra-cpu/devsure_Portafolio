<section class="seccion nosotros" id="nosotros">
    <div class="contenedor nosotros__interior">
        <div class="nosotros__texto" data-revelar>
            <p class="antetitulo">{{ $ajustes->nosotros_antetitulo }}</p>
            <h2 class="titulo-seccion">{{ $ajustes->nosotros_titulo }}</h2>
            <p class="parrafo-guia">{{ $ajustes->nosotros_texto }}</p>
            <p class="nosotros__nota"><x-icono nombre="pin" /> {{ $ajustes->nosotros_nota }}</p>
        </div>

        <ul class="metricas" data-revelar>
            @foreach ($ajustes->metricas ?? [] as $metrica)
                <li class="metrica">
                    <span class="metrica__valor">
                        <span data-contador="{{ $metrica['valor'] }}">0</span>{{ $metrica['sufijo'] }}
                    </span>
                    <span class="metrica__texto">{{ $metrica['texto'] }}</span>
                </li>
            @endforeach
        </ul>
    </div>
</section>
