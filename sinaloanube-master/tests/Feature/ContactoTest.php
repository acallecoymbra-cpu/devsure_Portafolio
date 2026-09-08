<?php

namespace Tests\Feature;

use App\Enums\EstadoLead;
use App\Models\Lead;
use App\Notifications\EquipoVentas;
use App\Notifications\GraciasPorContactarnos;
use App\Notifications\NuevoLeadRecibido;
use Database\Seeders\ContenidoInicialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Los servicios y presupuestos válidos viven en la base, no en config.
        $this->seed(ContenidoInicialSeeder::class);
    }

    /**
     * @return array<string, string>
     */
    protected function datosValidos(array $sobrescribir = []): array
    {
        return array_merge([
            'nombre' => 'Laura Mendoza',
            'email' => 'laura@empresa.mx',
            'telefono' => '668 123 4567',
            'empresa' => 'Agroexportadora del Valle',
            'servicio' => 'Sistemas de información',
            'presupuesto' => 'Menos de $30,000 MXN',
            'mensaje' => 'Necesitamos un sistema para controlar los embarques de temporada.',
            'acepto_privacidad' => '1',
        ], $sobrescribir);
    }

    public function test_la_landing_carga_con_el_formulario(): void
    {
        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('Cuéntanos tu próximo proyecto', false)
            ->assertSee('name="mensaje"', false);
    }

    public function test_guarda_el_prospecto_con_datos_validos(): void
    {
        Notification::fake();

        $respuesta = $this->post(route('leads.store'), $this->datosValidos());

        $respuesta->assertRedirect();
        $respuesta->assertSessionHas('estado_contacto');

        $lead = Lead::sole();

        $this->assertSame('Laura Mendoza', $lead->nombre);
        $this->assertSame('laura@empresa.mx', $lead->email);
        $this->assertSame(EstadoLead::Nuevo, $lead->estado);
        $this->assertNotNull($lead->ip);
    }

    public function test_avisa_a_ventas_y_acusa_recibo_al_prospecto(): void
    {
        Notification::fake();

        $this->post(route('leads.store'), $this->datosValidos());

        Notification::assertSentTo(new EquipoVentas, NuevoLeadRecibido::class);
        Notification::assertSentTo(Lead::sole(), GraciasPorContactarnos::class);
    }

    public function test_normaliza_el_correo_a_minusculas(): void
    {
        Notification::fake();

        $this->post(route('leads.store'), $this->datosValidos(['email' => '  LAURA@Empresa.MX ']));

        $this->assertSame('laura@empresa.mx', Lead::sole()->email);
    }

    public function test_rechaza_el_envio_sin_los_campos_obligatorios(): void
    {
        Notification::fake();

        $this->post(route('leads.store'), [])
            ->assertSessionHasErrors(['nombre', 'email', 'mensaje', 'acepto_privacidad']);

        $this->assertSame(0, Lead::count());
        Notification::assertNothingSent();
    }

    public function test_rechaza_un_servicio_fuera_del_catalogo(): void
    {
        $this->post(route('leads.store'), $this->datosValidos(['servicio' => 'Hackear la nasa']))
            ->assertSessionHasErrors('servicio');

        $this->assertSame(0, Lead::count());
    }

    public function test_descarta_los_envios_que_caen_en_la_trampa_antispam(): void
    {
        Notification::fake();

        $this->post(route('leads.store'), $this->datosValidos(['sitio_web' => 'https://spam.example']))
            ->assertSessionHasErrors('sitio_web');

        $this->assertSame(0, Lead::count());
        Notification::assertNothingSent();
    }

    public function test_el_prospecto_se_guarda_aunque_falle_el_aviso(): void
    {
        Notification::fake();
        Notification::shouldReceive('send')->andThrow(new \RuntimeException('SMTP caído'));

        $this->post(route('leads.store'), $this->datosValidos())
            ->assertRedirect();

        $this->assertSame(1, Lead::count());
    }

    public function test_guarda_los_parametros_utm_de_la_campania(): void
    {
        Notification::fake();

        $this->post(route('leads.store'), $this->datosValidos([
            'utm_source' => 'google',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'sistemas-2026',
        ]));

        $lead = Lead::sole();

        $this->assertSame('google', $lead->utm_source);
        $this->assertSame('sistemas-2026', $lead->utm_campaign);
    }

    public function test_no_notifica_por_telegram_ni_whatsapp_sin_credenciales(): void
    {
        config([
            'services.telegram.bot_token' => null,
            'services.whatsapp.token' => null,
        ]);

        $canales = (new NuevoLeadRecibido(Lead::factory()->make()))->via(new EquipoVentas);

        $this->assertSame(['mail'], $canales);
    }
}
