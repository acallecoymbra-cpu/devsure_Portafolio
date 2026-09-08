<?php

namespace App\Http\Requests;

use App\Models\Ajuste;
use App\Models\Servicio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:180'],
            'telefono' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+\-\s()]+$/'],
            'empresa' => ['nullable', 'string', 'max:120'],
            'servicio' => ['nullable', 'string', Rule::in(Servicio::opcionesDeContacto())],
            'presupuesto' => ['nullable', 'string', Rule::in(Ajuste::actuales()->presupuestos ?? [])],
            'mensaje' => ['required', 'string', 'min:15', 'max:3000'],
            'acepto_privacidad' => ['accepted'],
            'utm_source' => ['nullable', 'string', 'max:120'],
            'utm_medium' => ['nullable', 'string', 'max:120'],
            'utm_campaign' => ['nullable', 'string', 'max:120'],

            // Trampa antispam: los bots la llenan, las personas no la ven.
            'sitio_web' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'Necesitamos tu nombre para saber con quien hablamos.',
            'nombre.min' => 'Escribe tu nombre completo.',
            'email.required' => 'Sin correo no podemos responderte.',
            'email.email' => 'Ese correo no parece valido, revisalo por favor.',
            'telefono.regex' => 'El telefono solo puede llevar numeros, espacios y los signos + - ( ).',
            'servicio.in' => 'Selecciona un servicio de la lista.',
            'presupuesto.in' => 'Selecciona un rango de presupuesto de la lista.',
            'mensaje.required' => 'Cuentanos brevemente que necesitas.',
            'mensaje.min' => 'Danos un poco mas de contexto (minimo 15 caracteres).',
            'acepto_privacidad.accepted' => 'Necesitamos tu autorizacion para contactarte.',
            'sitio_web.prohibited' => 'No pudimos procesar el envio. Intenta de nuevo.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nombre' => 'nombre',
            'email' => 'correo',
            'telefono' => 'telefono',
            'empresa' => 'empresa',
            'servicio' => 'servicio',
            'presupuesto' => 'presupuesto',
            'mensaje' => 'mensaje',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nombre' => is_string($this->nombre) ? trim($this->nombre) : $this->nombre,
            'email' => is_string($this->email) ? mb_strtolower(trim($this->email)) : $this->email,
            'empresa' => is_string($this->empresa) ? trim($this->empresa) : $this->empresa,
        ]);
    }
}
