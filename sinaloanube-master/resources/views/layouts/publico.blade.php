<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('titulo', $ajustes->marca.' | Desarrollo de software, videovigilancia y conectividad')</title>
    <meta name="description" content="@yield('descripcion', 'Sinaloa Nube Sistemas: 10 años desarrollando sistemas de información, aplicaciones web, móviles y de escritorio, además de videovigilancia y redes WiFi. Los Mochis, Sinaloa.')">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $ajustes->razon_social }}">
    <meta property="og:title" content="@yield('titulo', $ajustes->marca)">
    <meta property="og:description" content="@yield('descripcion', $ajustes->titulo_hero)">
    <meta property="og:url" content="{{ url()->current() }}">

    <link rel="canonical" href="{{ url()->current() }}">
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{{ asset('css/sitio.css') }}">

    @php
        $datosEstructurados = [
            '@context' => 'https://schema.org',
            '@type' => 'ProfessionalService',
            'name' => $ajustes->razon_social,
            'description' => $ajustes->entrada_hero,
            'telephone' => $ajustes->telefono,
            'email' => $ajustes->email,
            'url' => url('/'),
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => 'Blvd. Colegio Militar esq. Chiapas L-7',
                'addressLocality' => 'Los Mochis',
                'addressRegion' => 'Sinaloa',
                'addressCountry' => 'MX',
            ],
        ];
    @endphp

    <script type="application/ld+json">
        {!! json_encode($datosEstructurados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}
    </script>
</head>
<body>
<a class="salta-al-contenido" href="#contenido">Saltar al contenido</a>

<header class="cabecera" data-cabecera>
    <div class="contenedor cabecera__interior">
        <a class="cabecera__logo" href="{{ route('landing') }}" aria-label="{{ $ajustes->razon_social }}">
            <x-logo />
        </a>

        <nav class="nav" data-menu aria-label="Navegación principal">
            <a href="{{ route('landing') }}#nosotros">Nosotros</a>
            <a href="{{ route('landing') }}#servicios">Servicios</a>
            <a href="{{ route('landing') }}#porque">Por qué elegirnos</a>
            @if ($hayCasos)
                {{-- Va a la sección de la portada, como el resto del menú: la
                     página completa de casos se abre desde el botón de la sección. --}}
                <a href="{{ route('landing') }}#casos">Casos</a>
            @endif
            <a href="{{ route('landing') }}#preguntas">Preguntas</a>
            <a class="nav__cta boton boton--marca" href="{{ route('landing') }}#contacto">
                Cotizar proyecto <x-icono nombre="flecha" />
            </a>
        </nav>

        <button class="hamburguesa" type="button" data-abrir-menu aria-expanded="false" aria-label="Abrir menú">
            <span></span><span></span><span></span>
        </button>
    </div>
</header>

<main id="contenido">
    @yield('contenido')
</main>

<footer class="pie">
    <div class="contenedor pie__interior">
        <div class="pie__marca">
            <x-logo variante="claro" />
            <p>{{ $ajustes->entrada_hero }}</p>
            <p class="pie__nota">{{ $ajustes->nosotros_nota }}</p>
        </div>

        <div class="pie__columna">
            <h3>Servicios</h3>
            <ul>
                @foreach (\App\Models\Servicio::nombres() as $servicio)
                    <li><a href="{{ route('landing') }}#servicios">{{ $servicio }}</a></li>
                @endforeach
            </ul>
        </div>

        <div class="pie__columna">
            <h3>Contacto</h3>
            <ul class="pie__contacto">
                <li>
                    <x-icono nombre="telefono" />
                    <a href="tel:{{ $ajustes->telefono_marcado }}">{{ $ajustes->telefono }}</a>
                </li>
                <li>
                    <x-icono nombre="correo" />
                    <a href="mailto:{{ $ajustes->email }}">{{ $ajustes->email }}</a>
                </li>
                <li>
                    <x-icono nombre="pin" />
                    <span>{{ $ajustes->direccion }}</span>
                </li>
                <li>
                    <x-icono nombre="reloj" />
                    <span>{{ $ajustes->horario }}</span>
                </li>
            </ul>
        </div>
    </div>

    <div class="contenedor pie__legal">
        <p>&copy; {{ date('Y') }} {{ $ajustes->razon_social }}. Todos los derechos reservados.</p>
        <p>
            @if ($hayCasos)
                <a href="{{ route('casos.index') }}">Casos de éxito</a>
                <span aria-hidden="true">·</span>
            @endif
            <a href="{{ route('privacidad') }}">Aviso de privacidad</a>
            <span aria-hidden="true">·</span>
            <a href="{{ route('filament.admin.auth.login') }}">Acceso interno</a>
        </p>
    </div>
</footer>

<a class="flotante-whatsapp"
   href="https://wa.me/{{ $ajustes->whatsapp_publico }}?text={{ rawurlencode('Hola, me interesa cotizar un proyecto con Sinaloa Nube.') }}"
   target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
    <x-icono nombre="whatsapp" />
    <span>WhatsApp</span>
</a>

<script src="{{ asset('js/sitio.js') }}" defer></script>
</body>
</html>
