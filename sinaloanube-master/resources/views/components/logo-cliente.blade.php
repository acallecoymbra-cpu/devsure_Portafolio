@props(['cliente'])

@if ($cliente->logo)
    <img class="logo-cliente" src="{{ \Illuminate\Support\Facades\Storage::disk('publico')->url($cliente->logo) }}"
         alt="{{ $cliente->nombre }}" loading="lazy" height="46">
@else
    {{-- Sin archivo de logo mostramos el nombre, para que la franja no se rompa. --}}
    <span class="logo-cliente logo-cliente--texto">{{ $cliente->nombre }}</span>
@endif
