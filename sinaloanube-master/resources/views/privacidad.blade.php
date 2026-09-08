@extends('layouts.publico')

@section('titulo', 'Aviso de privacidad | '.$ajustes->marca)
@section('descripcion', 'Aviso de privacidad de '.$ajustes->razon_social.'.')

@section('contenido')
    <section class="seccion pagina-legal">
        <div class="contenedor contenedor--angosto">
            <p class="antetitulo">Legal</p>
            <h1 class="titulo-seccion">Aviso de privacidad</h1>

            <div class="prosa">
                <p class="parrafo-guia">
                    Este es un texto base. Antes de publicar el sitio, revísalo con tu asesor legal
                    para ajustarlo a la Ley Federal de Protección de Datos Personales en Posesión
                    de los Particulares.
                </p>

                <h2>Responsable</h2>
                <p>
                    {{ $ajustes->razon_social }}, con domicilio en {{ $ajustes->direccion }},
                    es responsable del tratamiento de los datos personales que nos proporcionas.
                </p>

                <h2>Datos que recabamos</h2>
                <p>
                    A través del formulario de contacto recabamos nombre, correo electrónico,
                    teléfono, empresa, el servicio de tu interés, el presupuesto estimado y el
                    mensaje que nos escribes. Por seguridad también registramos la dirección IP
                    y el navegador desde el que se envía la solicitud.
                </p>

                <h2>Para qué los usamos</h2>
                <ul>
                    <li>Responder tu solicitud y darle seguimiento comercial.</li>
                    <li>Elaborar la propuesta o cotización que nos pides.</li>
                    <li>Mantener contacto durante el proyecto y después de la entrega.</li>
                </ul>
                <p>No vendemos ni compartimos tus datos con terceros con fines comerciales.</p>

                <h2>Tus derechos ARCO</h2>
                <p>
                    Puedes solicitar el acceso, rectificación, cancelación u oposición al
                    tratamiento de tus datos escribiendo a
                    <a href="mailto:{{ $ajustes->email }}">{{ $ajustes->email }}</a>.
                    Responderemos tu solicitud en los plazos que marca la ley.
                </p>

                <h2>Cambios a este aviso</h2>
                <p>
                    Cualquier modificación se publicará en esta misma página.
                    Última actualización: {{ now()->translatedFormat('d \d\e F \d\e Y') }}.
                </p>
            </div>

            <a class="enlace-flecha" href="{{ route('landing') }}">Volver al inicio <x-icono nombre="flecha" /></a>
        </div>
    </section>
@endsection
