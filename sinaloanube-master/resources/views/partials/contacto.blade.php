<section class="seccion contacto" id="contacto">
    <div class="contenedor contacto__interior">

        <div class="contacto__panel" data-revelar>
            <p class="antetitulo antetitulo--claro">Contáctanos</p>
            <h2 class="titulo-seccion">Cuéntanos tu próximo proyecto</h2>
            <p class="contacto__entrada">
                Estés donde estés, cuéntanos qué necesita tu negocio y diseñamos juntos la solución.
                Te respondemos dentro de las siguientes 24 horas hábiles.
            </p>

            <ul class="contacto__datos">
                <li>
                    <span class="contacto__icono"><x-icono nombre="telefono" /></span>
                    <span>
                        <strong>Teléfono</strong>
                        <a href="tel:{{ $ajustes->telefono_marcado }}">{{ $ajustes->telefono }}</a>
                    </span>
                </li>
                <li>
                    <span class="contacto__icono"><x-icono nombre="correo" /></span>
                    <span>
                        <strong>Correo</strong>
                        <a href="mailto:{{ $ajustes->email }}">{{ $ajustes->email }}</a>
                    </span>
                </li>
                <li>
                    <span class="contacto__icono"><x-icono nombre="pin" /></span>
                    <span>
                        <strong>Dirección</strong>
                        {{ $ajustes->direccion }}
                    </span>
                </li>
                <li>
                    <span class="contacto__icono"><x-icono nombre="reloj" /></span>
                    <span>
                        <strong>Horario</strong>
                        {{ $ajustes->horario }}
                    </span>
                </li>
            </ul>

            <a class="boton boton--fantasma"
               href="https://wa.me/{{ $ajustes->whatsapp_publico }}"
               target="_blank" rel="noopener">
                <x-icono nombre="whatsapp" /> Escribir por WhatsApp
            </a>
        </div>

        <div class="contacto__formulario" data-revelar>
            @if (session('estado_contacto'))
                <div class="aviso aviso--exito" role="status" data-desplazar>
                    <x-icono nombre="check" />
                    <p>{{ session('estado_contacto') }}</p>
                </div>
            @endif

            @if ($errors->any())
                <div class="aviso aviso--error" role="alert" data-desplazar>
                    <p><strong>Revisa estos datos:</strong></p>
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form action="{{ route('leads.store') }}" method="POST" novalidate>
                @csrf

                <input type="hidden" name="utm_source" value="{{ request('utm_source') }}">
                <input type="hidden" name="utm_medium" value="{{ request('utm_medium') }}">
                <input type="hidden" name="utm_campaign" value="{{ request('utm_campaign') }}">

                {{-- Trampa antispam: oculta para las personas, visible para los bots. --}}
                <div class="trampa" aria-hidden="true">
                    <label for="sitio_web">No llenes este campo</label>
                    <input type="text" id="sitio_web" name="sitio_web" tabindex="-1" autocomplete="off">
                </div>

                <div class="campos">
                    <p class="campo">
                        <label for="nombre">Nombre completo <span aria-hidden="true">*</span></label>
                        <input type="text" id="nombre" name="nombre" value="{{ old('nombre') }}"
                               required autocomplete="name" maxlength="120"
                               @error('nombre') aria-invalid="true" @enderror>
                        @error('nombre') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo">
                        <label for="empresa">Empresa</label>
                        <input type="text" id="empresa" name="empresa" value="{{ old('empresa') }}"
                               autocomplete="organization" maxlength="120">
                        @error('empresa') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo">
                        <label for="email">Correo electrónico <span aria-hidden="true">*</span></label>
                        <input type="email" id="email" name="email" value="{{ old('email') }}"
                               required autocomplete="email" maxlength="180"
                               @error('email') aria-invalid="true" @enderror>
                        @error('email') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo">
                        <label for="telefono">Teléfono / WhatsApp</label>
                        <input type="tel" id="telefono" name="telefono" value="{{ old('telefono') }}"
                               autocomplete="tel" maxlength="40" placeholder="668 123 4567">
                        @error('telefono') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo">
                        <label for="servicio">¿Qué necesitas?</label>
                        <select id="servicio" name="servicio">
                            <option value="">Selecciona un servicio</option>
                            @foreach (\App\Models\Servicio::opcionesDeContacto() as $opcion)
                                <option value="{{ $opcion }}" @selected(old('servicio') === $opcion)>{{ $opcion }}</option>
                            @endforeach
                        </select>
                        @error('servicio') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo">
                        <label for="presupuesto">Presupuesto estimado</label>
                        <select id="presupuesto" name="presupuesto">
                            <option value="">Prefiero no decirlo</option>
                            @foreach ($ajustes->presupuestos ?? [] as $opcion)
                                <option value="{{ $opcion }}" @selected(old('presupuesto') === $opcion)>{{ $opcion }}</option>
                            @endforeach
                        </select>
                        @error('presupuesto') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo campo--ancho">
                        <label for="mensaje">Cuéntanos brevemente tu proyecto <span aria-hidden="true">*</span></label>
                        <textarea id="mensaje" name="mensaje" rows="5" required maxlength="3000"
                                  placeholder="¿Qué proceso quieres resolver? ¿Cuántas personas lo usarían? ¿Para cuándo lo necesitas?"
                                  @error('mensaje') aria-invalid="true" @enderror>{{ old('mensaje') }}</textarea>
                        @error('mensaje') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>

                    <p class="campo campo--ancho campo--casilla">
                        <label>
                            <input type="checkbox" name="acepto_privacidad" value="1" required
                                   @checked(old('acepto_privacidad'))>
                            <span>
                                Autorizo que usen mis datos para contactarme sobre esta solicitud.
                                Consulta el <a href="{{ route('privacidad') }}" target="_blank" rel="noopener">aviso de privacidad</a>.
                            </span>
                        </label>
                        @error('acepto_privacidad') <span class="campo__error">{{ $message }}</span> @enderror
                    </p>
                </div>

                <button class="boton boton--marca boton--bloque" type="submit">
                    Enviar solicitud <x-icono nombre="flecha" />
                </button>

                <p class="formulario__nota">Sin compromiso. No compartimos tus datos con terceros.</p>
            </form>
        </div>
    </div>
</section>
