<section class="seccion porque" id="porque">
    <div class="contenedor porque__interior">
        <div class="porque__texto" data-revelar>
            <p class="antetitulo">Por qué elegirnos</p>
            <h2 class="titulo-seccion">Un aliado tecnológico de confianza</h2>
            <p class="parrafo-guia">
                No entregamos un sistema y desaparecemos. Nos quedamos hasta que tu equipo
                lo esté usando todos los días sin pensarlo.
            </p>

            <a class="boton boton--marca" href="#contacto">
                Agendar una plática <x-icono nombre="flecha" />
            </a>
        </div>

        <div class="rejilla-porque" data-revelar>
            @foreach ($ajustes->diferenciadores ?? [] as $item)
                <article class="tarjeta-porque">
                    <h3>{{ $item['titulo'] }}</h3>
                    <p>{{ $item['texto'] }}</p>
                </article>
            @endforeach
        </div>
    </div>
</section>
