/**
 * Sinaloa Nube — interacciones del sitio público.
 * Sin dependencias: menú móvil, sombra de cabecera, revelado al hacer scroll,
 * contadores de métricas y salto automático al aviso del formulario.
 */
(function () {
    'use strict';

    var reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------ Menú móvil */

    var boton = document.querySelector('[data-abrir-menu]');
    var menu = document.querySelector('[data-menu]');

    if (boton && menu) {
        boton.addEventListener('click', function () {
            var abierto = menu.classList.toggle('esta-abierto');
            boton.setAttribute('aria-expanded', String(abierto));
            boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
        });

        menu.addEventListener('click', function (evento) {
            if (evento.target.closest('a')) {
                menu.classList.remove('esta-abierto');
                boton.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && menu.classList.contains('esta-abierto')) {
                menu.classList.remove('esta-abierto');
                boton.setAttribute('aria-expanded', 'false');
                boton.focus();
            }
        });
    }

    /* --------------------------------------------------- Sombra de cabecera */

    var cabecera = document.querySelector('[data-cabecera]');

    if (cabecera) {
        var actualizarCabecera = function () {
            cabecera.classList.toggle('esta-fija', window.scrollY > 12);
        };

        actualizarCabecera();
        window.addEventListener('scroll', actualizarCabecera, { passive: true });
    }

    /* ---------------------------------------------------- Revelado al scroll */

    var revelables = document.querySelectorAll('[data-revelar]');

    if (!('IntersectionObserver' in window) || reducirMovimiento) {
        revelables.forEach(function (elemento) {
            elemento.classList.add('es-visible');
        });
    } else {
        var observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('es-visible');
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px' });

        revelables.forEach(function (elemento) {
            observador.observe(elemento);
        });
    }

    /* ------------------------------------------------ Contadores de métricas */

    var contadores = document.querySelectorAll('[data-contador]');

    var animarContador = function (elemento) {
        var destino = parseInt(elemento.dataset.contador, 10) || 0;

        if (reducirMovimiento) {
            elemento.textContent = String(destino);
            return;
        }

        var duracion = 1200;
        var inicio = null;

        var paso = function (marca) {
            if (inicio === null) {
                inicio = marca;
            }

            var avance = Math.min((marca - inicio) / duracion, 1);
            // Suavizado tipo ease-out.
            elemento.textContent = String(Math.round(destino * (1 - Math.pow(1 - avance, 3))));

            if (avance < 1) {
                window.requestAnimationFrame(paso);
            }
        };

        window.requestAnimationFrame(paso);
    };

    if ('IntersectionObserver' in window) {
        var observadorContadores = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    animarContador(entrada.target);
                    observadorContadores.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.6 });

        contadores.forEach(function (elemento) {
            observadorContadores.observe(elemento);
        });
    } else {
        contadores.forEach(animarContador);
    }

    /* --------------------------------- Llevar la vista al aviso del formulario */

    var aviso = document.querySelector('[data-desplazar]');

    if (aviso) {
        // El aviso vive dentro de un bloque con animación de entrada: lo
        // mostramos de inmediato para que no quede invisible ni se mueva
        // mientras el navegador salta hacia él.
        revelables.forEach(function (elemento) {
            elemento.classList.add('es-visible');
        });

        var irAlAviso = function () {
            aviso.scrollIntoView({
                behavior: reducirMovimiento ? 'auto' : 'smooth',
                block: 'center',
            });
        };

        if (document.readyState === 'complete') {
            window.setTimeout(irAlAviso, 60);
        } else {
            window.addEventListener('load', function () {
                window.setTimeout(irAlAviso, 60);
            });
        }
    }
}());
