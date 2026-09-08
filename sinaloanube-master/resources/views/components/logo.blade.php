@props(['variante' => 'oscuro'])

@php
    $ajustes = \App\Models\Ajuste::actuales();
@endphp

@if ($ajustes->logo)
    <img class="logo logo--imagen" src="{{ \Illuminate\Support\Facades\Storage::disk('publico')->url($ajustes->logo) }}"
         alt="{{ $ajustes->razon_social }}" height="40">
@else
    {{--
        Marca provisional dibujada en SVG a partir del brochure. En cuanto se
        suba el logotipo real desde el panel (Ajustes del sitio), este bloque
        deja de usarse.
    --}}
    <span {{ $attributes->merge(['class' => 'logo logo--'.$variante]) }}>
        <svg class="logo__marca" viewBox="0 0 46 34" fill="none" aria-hidden="true">
            <path class="logo__nube-atras"
                  d="M20.5 30h14.2a6.3 6.3 0 0 0 .9-12.5A8.6 8.6 0 0 0 19 14.2 5.5 5.5 0 0 0 20.5 30z"/>
            <path class="logo__nube-frente"
                  d="M9.6 30h11.6a5.4 5.4 0 0 0 .8-10.7A7.4 7.4 0 0 0 8.4 16.5 5 5 0 0 0 9.6 30z"/>
            <path class="logo__sinaloa"
                  d="M18.9 3.4c1.3-.6 2.4.3 2.1 1.7-.5 2.2-1.7 4.5-3.4 7.1-1.6 2.5-2.6 4.6-3.2 7.2-.4 1.7-.7 3.4-1.3 5-.4 1.1-1.9 1.1-2.2 0-.5-1.9-.3-4 .3-6.3.8-3 2.2-5.7 4-8.4 1.3-2 2.3-3.8 2.8-5.1a1.7 1.7 0 0 1 .9-1.2z"/>
        </svg>
        <span class="logo__texto">
            {{-- La primera palabra va en color de marca, como en el logotipo. --}}
            @php([$primera, $resto] = array_pad(explode(' ', $ajustes->marca, 2), 2, null))
            <span class="logo__nombre"><b>{{ $primera }}</b>{{ $resto ? ' '.$resto : '' }}</span>
            <span class="logo__bajada">Sistemas</span>
        </span>
    </span>
@endif
