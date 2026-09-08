@php($urlImagenHero = $ajustes->urlImagenHero())

<section class="hero{{ $urlImagenHero ? ' hero--con-imagen' : '' }}"
         @if ($urlImagenHero) style="--hero-imagen: url('{{ $urlImagenHero }}')" @endif>
    <div class="hero__fondo" aria-hidden="true">
        <span class="hero__burbuja hero__burbuja--1"></span>
        <span class="hero__burbuja hero__burbuja--2"></span>
        <span class="hero__burbuja hero__burbuja--3"></span>
    </div>

    <div class="contenedor hero__interior">
        <div class="hero__texto">
            <p class="antetitulo antetitulo--claro">{{ $ajustes->claim }}</p>

            <h1 class="hero__titulo">{{ $ajustes->titulo_hero }}</h1>

            <p class="hero__entrada">{{ $ajustes->entrada_hero }}</p>

            <div class="hero__acciones">
                <a class="boton boton--arena" href="#contacto">
                    Cuéntanos tu proyecto <x-icono nombre="flecha" />
                </a>
                <a class="boton boton--fantasma" href="#servicios">Ver servicios</a>
            </div>

            <ul class="hero__sellos">
                <li><x-icono nombre="check" /> 10 años de experiencia</li>
                <li><x-icono nombre="check" /> Software a la medida</li>
                <li><x-icono nombre="check" /> Atención remota y en sitio</li>
            </ul>
        </div>

        <div class="hero__lateral">
            <aside class="hero__tarjeta">
                <p class="hero__tarjeta-titulo">Atendemos desde Los Mochis</p>
                <p class="hero__tarjeta-texto">
                    Trabajamos de forma remota con clientes en México y en otros países.
                    La instalación física de cámaras y redes WiFi está disponible en el noroeste de México.
                </p>

                <dl class="hero__datos">
                    <div>
                        <dt><x-icono nombre="telefono" /> Teléfono</dt>
                        <dd><a href="tel:{{ $ajustes->telefono_marcado }}">{{ $ajustes->telefono }}</a></dd>
                    </div>
                    <div>
                        <dt><x-icono nombre="correo" /> Correo</dt>
                        <dd><a href="mailto:{{ $ajustes->email }}">{{ $ajustes->email }}</a></dd>
                    </div>
                </dl>
            </aside>
        </div>
    </div>
</section>
