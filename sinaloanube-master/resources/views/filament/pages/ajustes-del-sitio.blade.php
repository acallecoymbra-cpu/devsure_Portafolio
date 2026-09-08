<x-filament-panels::page>
    <form wire:submit="guardar" class="fi-form">
        {{ $this->form }}

        <div class="fi-form-actions">
            <x-filament::button type="submit" size="lg" wire:loading.attr="disabled">
                Guardar cambios
            </x-filament::button>
        </div>
    </form>
</x-filament-panels::page>
