<?php

namespace Database\Seeders;

use App\Enums\GrupoServicio;
use App\Models\Ajuste;
use App\Models\Pregunta;
use App\Models\Servicio;
use Illuminate\Database\Seeder;

/**
 * Contenido real del sitio, tomado del brochure de Sinaloa Nube.
 *
 * Corre en cada despliegue, así que sólo siembra lo que esté vacío: en cuanto
 * hay contenido, manda lo que el equipo edite desde el panel. Sin esta guarda,
 * borrar un servicio lo reviviría en el siguiente despliegue y renombrarlo
 * crearía un duplicado.
 */
class ContenidoInicialSeeder extends Seeder
{
    public function run(): void
    {
        $this->ajustes();
        $this->servicios();
        $this->preguntas();
    }

    protected function ajustes(): void
    {
        if (Ajuste::query()->exists()) {
            return;
        }

        Ajuste::query()->create([
            'marca' => 'Sinaloa Nube',
            'razon_social' => 'Sinaloa Nube Sistemas',
            'claim' => 'Soluciones tecnológicas · México y el mundo',

            'titulo_hero' => '10 años transformando ideas en soluciones tecnológicas',
            'entrada_hero' => 'Desarrollo de sistemas de información, aplicaciones de escritorio, web y móviles, además de videovigilancia y conectividad, para clientes en México y en cualquier parte del mundo.',
            // Se carga desde el panel para que el archivo persista fuera de Git.
            'imagen_hero' => null,

            'telefono' => '+52 668 233 2247',
            'telefono_marcado' => '+526682332247',
            'whatsapp_publico' => '5216682332247',
            'email' => 'sergio@sinaloanube.com',
            'direccion' => 'Blvd. Colegio Militar esq. Chiapas L-7, Los Mochis, Sinaloa, México',
            'horario' => 'Lunes a viernes, 9:00 a 18:00 (CST)',

            'nosotros_antetitulo' => 'Quiénes somos',
            'nosotros_titulo' => 'Una década creando tecnología a la medida',
            'nosotros_texto' => 'En Sinaloa Nube llevamos 10 años ayudando a empresas de México y de otros países a resolver sus retos operativos con tecnología: desarrollo de software a la medida y soluciones de videovigilancia y conectividad, con acompañamiento integral sin importar dónde te encuentres.',
            'nosotros_nota' => 'Trabajamos de forma remota con clientes en México y en otros países; la instalación física de cámaras y redes WiFi está disponible en el noroeste de México.',

            'metricas' => [
                ['valor' => '10', 'sufijo' => '+', 'texto' => 'Años de experiencia'],
                ['valor' => '7', 'sufijo' => '', 'texto' => 'Líneas de servicio'],
                ['valor' => '100', 'sufijo' => '%', 'texto' => 'A la medida del cliente'],
            ],

            'diferenciadores' => [
                [
                    'titulo' => 'Experiencia comprobada',
                    'texto' => '10 años desarrollando soluciones tecnológicas para negocios en México y en el extranjero, con proyectos que abarcan software e infraestructura.',
                ],
                [
                    'titulo' => 'Soluciones a la medida',
                    'texto' => 'No vendemos paquetes genéricos: cada sistema se diseña de acuerdo a cómo opera realmente tu negocio.',
                ],
                [
                    'titulo' => 'Acompañamiento integral',
                    'texto' => 'Desde el software hasta la conectividad e instalación física, damos seguimiento completo a cada proyecto.',
                ],
                [
                    'titulo' => 'Alcance internacional',
                    'texto' => 'Con base en Los Mochis, Sinaloa (México), atendemos de forma remota a clientes de cualquier país, con la misma cercanía que a nuestros clientes locales.',
                ],
            ],

            'proceso' => [
                ['paso' => '01', 'titulo' => 'Diagnóstico', 'texto' => 'Escuchamos cómo opera tu negocio hoy y detectamos qué conviene resolver primero.'],
                ['paso' => '02', 'titulo' => 'Propuesta', 'texto' => 'Te entregamos alcance, tiempos y costo por escrito, sin letras chiquitas.'],
                ['paso' => '03', 'titulo' => 'Desarrollo e instalación', 'texto' => 'Construimos por etapas y te mostramos avances para ajustar sobre la marcha.'],
                ['paso' => '04', 'titulo' => 'Acompañamiento', 'texto' => 'Capacitación, soporte y mejoras después de la entrega. No desaparecemos.'],
            ],

            'presupuestos' => [
                'Menos de $30,000 MXN',
                '$30,000 - $80,000 MXN',
                '$80,000 - $200,000 MXN',
                'Más de $200,000 MXN',
                'Aún no lo defino',
            ],

            'leads_emails' => ['sergio@sinaloanube.com'],
        ]);
    }

    protected function servicios(): void
    {
        if (Servicio::query()->exists()) {
            return;
        }

        $servicios = [
            [
                'grupo' => GrupoServicio::Desarrollo,
                'clave' => 'SI',
                'icono' => 'sistemas',
                'titulo' => 'Sistemas de información',
                'resumen' => 'Software administrativo y operativo a la medida de tu negocio.',
                'puntos' => ['Procesos y reglas propias', 'Reportes que sí usas', 'Usuarios y permisos'],
            ],
            [
                'grupo' => GrupoServicio::Desarrollo,
                'clave' => 'PC',
                'icono' => 'escritorio',
                'titulo' => 'Aplicaciones de escritorio',
                'resumen' => 'Software instalable, estable y con control local de tu información.',
                'puntos' => ['Funciona sin internet', 'Datos en tus equipos', 'Integración con periféricos'],
            ],
            [
                'grupo' => GrupoServicio::Desarrollo,
                'clave' => 'WEB',
                'icono' => 'web',
                'titulo' => 'Aplicaciones web',
                'resumen' => 'Plataformas accesibles desde cualquier navegador y lugar.',
                'puntos' => ['Acceso desde cualquier sede', 'Actualizaciones centralizadas', 'Respaldos automáticos'],
            ],
            [
                'grupo' => GrupoServicio::Desarrollo,
                'clave' => 'APP',
                'icono' => 'movil',
                'titulo' => 'Aplicaciones móviles',
                'resumen' => 'Apps para trabajar desde cualquier dispositivo, en todo momento.',
                'puntos' => ['Android e iOS', 'Trabajo en campo', 'Sincronización con tu sistema'],
            ],
            [
                'grupo' => GrupoServicio::Infraestructura,
                'clave' => 'CAM',
                'icono' => 'camara',
                'titulo' => 'Cámaras de seguridad',
                'resumen' => 'Videovigilancia WiFi con visión nocturna y monitoreo remoto.',
                'puntos' => ['Visión nocturna', 'Monitoreo desde el celular', 'Grabación continua'],
            ],
            [
                'grupo' => GrupoServicio::Infraestructura,
                'clave' => 'WIFI',
                'icono' => 'wifi',
                'titulo' => 'Redes WiFi',
                'resumen' => 'Enlaces y antenas para conectar zonas rurales y sitios remotos.',
                'puntos' => ['Enlaces punto a punto', 'Cobertura en campo', 'Equipos de grado industrial'],
            ],
            [
                'grupo' => GrupoServicio::Infraestructura,
                'clave' => 'INS',
                'icono' => 'instalacion',
                'titulo' => 'Instalación integral',
                'resumen' => 'Cableado, configuración y puesta en marcha llave en mano.',
                'puntos' => ['Cableado estructurado', 'Configuración completa', 'Capacitación al personal'],
            ],
        ];

        foreach ($servicios as $orden => $servicio) {
            Servicio::create([...$servicio, 'orden' => $orden]);
        }
    }

    protected function preguntas(): void
    {
        if (Pregunta::query()->exists()) {
            return;
        }

        $preguntas = [
            [
                'pregunta' => '¿Trabajan con empresas fuera de Sinaloa?',
                'respuesta' => 'Sí. El desarrollo de software lo hacemos de forma remota para clientes en México y en otros países. La instalación física de cámaras y redes WiFi está disponible en el noroeste de México.',
            ],
            [
                'pregunta' => '¿Cuánto cuesta un sistema a la medida?',
                'respuesta' => 'Depende del alcance. Después de una plática de diagnóstico te entregamos una propuesta con alcance, tiempos y costo cerrado, sin compromiso.',
            ],
            [
                'pregunta' => '¿Puedo empezar con algo pequeño y crecerlo después?',
                'respuesta' => 'Es lo que más recomendamos. Arrancamos con el proceso que más te duele y vamos sumando módulos conforme el sistema demuestra su valor.',
            ],
            [
                'pregunta' => '¿La información queda en mis equipos o en la nube?',
                'respuesta' => 'Como tú lo necesites. Manejamos aplicaciones de escritorio con datos locales y plataformas web en la nube; también esquemas mixtos.',
            ],
            [
                'pregunta' => '¿Dan soporte después de entregar?',
                'respuesta' => 'Sí. Damos capacitación al equipo y seguimiento posterior a la entrega para ajustes, dudas y mejoras.',
            ],
        ];

        foreach ($preguntas as $orden => $pregunta) {
            Pregunta::create([...$pregunta, 'orden' => $orden]);
        }
    }
}
