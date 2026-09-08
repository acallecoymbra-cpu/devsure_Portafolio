@props(['nombre'])

@php
    $trazos = [
        'sistemas' => '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 20h8M12 18v2M7 9h6M7 13h4"/>',
        'escritorio' => '<rect x="2" y="4" width="20" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        'web' => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
        'movil' => '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
        'camara' => '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h6A2.5 2.5 0 0 1 14 8.5v7A2.5 2.5 0 0 1 11.5 18h-6A2.5 2.5 0 0 1 3 15.5z"/><path d="m14 10.5 5.4-2.9a.8.8 0 0 1 1.2.7v7.4a.8.8 0 0 1-1.2.7L14 13.5z"/>',
        'wifi' => '<path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10 10 0 0 1 13 0M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1.2"/>',
        'instalacion' => '<path d="M14.7 6.3a4 4 0 0 0 5.2 5.2L21 12l-9 9-3-3 9-9z"/><path d="m7 7 3 3M3 13l4 4"/>',
        'nube' => '<path d="M7 18h9.5a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 5.6 10.2 3.9 3.9 0 0 0 7 18z"/>',
        'reloj' => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
        'escudo' => '<path d="M12 3l7.5 3v5.5c0 4.5-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5-7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
        'flecha' => '<path d="M5 12h14M13 6l6 6-6 6"/>',
        'telefono' => '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 7.2 2 2 0 0 1 6 5z"/>',
        'correo' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
        'pin' => '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
        'check' => '<path d="m5 13 4.5 4.5L19 7"/>',
        'whatsapp' => '<path d="M3.5 20.5 5 16.6A8 8 0 1 1 8 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/>',
    ];
@endphp

<svg {{ $attributes->merge(['class' => 'ico', 'aria-hidden' => 'true']) }} viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    {!! $trazos[$nombre] ?? $trazos['nube'] !!}
</svg>
