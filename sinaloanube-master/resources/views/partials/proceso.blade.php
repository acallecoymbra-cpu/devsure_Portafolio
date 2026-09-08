<section class="seccion seccion--oscura proceso" id="proceso">
    <div class="contenedor">
        <div class="encabezado-seccion encabezado-seccion--claro" data-revelar>
            <p class="antetitulo antetitulo--claro">Cómo trabajamos</p>
            <h2 class="titulo-seccion">Cuatro pasos, cero sorpresas</h2>
        </div>

        <ol class="pasos" data-revelar>
            @foreach ($ajustes->proceso ?? [] as $paso)
                <li class="paso">
                    <span class="paso__numero">{{ $paso['paso'] }}</span>
                    <h3>{{ $paso['titulo'] }}</h3>
                    <p>{{ $paso['texto'] }}</p>
                </li>
            @endforeach
        </ol>
    </div>
</section>
