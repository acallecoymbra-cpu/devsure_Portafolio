@extends('layouts.publico')

@section('titulo', 'Casos de éxito | '.$ajustes->marca)
@section('descripcion', 'Proyectos de software, videovigilancia y conectividad que hemos entregado a empresas de México y del extranjero.')

@section('contenido')
    <section class="portada-interior">
        <div class="contenedor">
            <p class="antetitulo antetitulo--claro">Casos de éxito</p>
            <h1 class="portada-interior__titulo">Proyectos que ya están operando</h1>
            <p class="portada-interior__entrada">
                Una muestra de lo que hemos construido e instalado. Si tu reto se parece
                a alguno de estos, platiquemos.
            </p>
        </div>
    </section>

    <section class="seccion">
        <div class="contenedor">
            @if ($servicios->count() > 1)
                <nav class="filtros-casos" aria-label="Filtrar casos por servicio">
                    <a class="filtro-caso {{ $filtro ? '' : 'esta-activo' }}" href="{{ route('casos.index') }}">
                        Todos
                    </a>
                    @foreach ($servicios as $servicio)
                        <a class="filtro-caso {{ $filtro === $servicio ? 'esta-activo' : '' }}"
                           href="{{ route('casos.index', ['servicio' => $servicio]) }}">
                            {{ $servicio }}
                        </a>
                    @endforeach
                </nav>
            @endif

            @if ($casos->isEmpty())
                <p class="parrafo-guia">
                    @if ($filtro)
                        Todavía no publicamos casos de este servicio.
                        <a href="{{ route('casos.index') }}">Ver todos los casos</a>.
                    @else
                        Pronto publicaremos aquí nuestros casos.
                    @endif
                </p>
            @else
                <div class="rejilla-casos">
                    @foreach ($casos as $caso)
                        <x-tarjeta-caso :caso="$caso" />
                    @endforeach
                </div>
            @endif

            <div class="cierre-interior">
                <h2>¿Tu negocio necesita algo parecido?</h2>
                <a class="boton boton--marca" href="{{ route('landing') }}#contacto">
                    Cuéntanos tu proyecto <x-icono nombre="flecha" />
                </a>
            </div>
        </div>
    </section>
@endsection
