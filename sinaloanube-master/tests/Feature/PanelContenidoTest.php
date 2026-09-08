<?php

namespace Tests\Feature;

use App\Filament\Pages\AjustesDelSitio;
use App\Filament\Resources\Casos\Pages\CreateCaso;
use App\Filament\Resources\Casos\Pages\ListCasos;
use App\Filament\Resources\Clientes\Pages\CreateCliente;
use App\Filament\Resources\Clientes\Pages\ListClientes;
use App\Models\Ajuste;
use App\Models\Caso;
use App\Models\Cliente;
use App\Models\Servicio;
use App\Models\User;
use Database\Seeders\ContenidoInicialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class PanelContenidoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // El selector de servicio del formulario de casos lee la tabla servicios.
        $this->seed(ContenidoInicialSeeder::class);

        $this->actingAs(User::factory()->create());
    }

    public function test_lista_los_clientes(): void
    {
        $cliente = Cliente::factory()->create(['nombre' => 'Agroexportadora del Valle']);

        Livewire::test(ListClientes::class)
            ->assertCanSeeTableRecords([$cliente])
            ->assertSee('Agroexportadora del Valle');
    }

    public function test_crea_un_cliente_con_logotipo(): void
    {
        Storage::fake('publico');

        Livewire::test(CreateCliente::class)
            ->fillForm([
                'nombre' => 'Clínica Altamar',
                'giro' => 'Salud',
                'logo' => UploadedFile::fake()->create('altamar.png', 20, 'image/png'),
                'visible' => true,
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $cliente = Cliente::sole();

        $this->assertSame('Clínica Altamar', $cliente->nombre);
        $this->assertSame('clinica-altamar', $cliente->slug);
        Storage::disk('publico')->assertExists($cliente->logo);
    }

    public function test_crea_un_caso_y_genera_su_slug(): void
    {
        $cliente = Cliente::factory()->create();

        Livewire::test(CreateCaso::class)
            ->fillForm([
                'cliente_id' => $cliente->id,
                'titulo' => 'Control de embarques en un solo tablero',
                'servicio' => 'Sistemas de información',
                'anio' => '2025',
                'resumen' => 'Un sistema que sigue cada embarque desde el corte hasta la entrega.',
                'reto' => 'La información vivía en archivos sueltos.',
                'solucion' => 'Construimos un sistema web a la medida.',
                'resultados' => [
                    ['texto' => 'Reportes al instante'],
                    ['texto' => 'Una sola fuente de información'],
                ],
                'publicado_en' => now(),
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $caso = Caso::sole();

        $this->assertSame('control-de-embarques-en-un-solo-tablero', $caso->slug);
        $this->assertSame($cliente->id, $caso->cliente_id);
        $this->assertSame(['Reportes al instante', 'Una sola fuente de información'], $caso->resultados);
        $this->assertTrue($caso->estaPublicado());
    }

    public function test_filtra_los_casos_por_servicio(): void
    {
        $sistemas = Caso::factory()->create(['servicio' => 'Sistemas de información']);
        $camaras = Caso::factory()->create(['servicio' => 'Cámaras de seguridad']);

        Livewire::test(ListCasos::class)
            ->filterTable('servicio', 'Sistemas de información')
            ->assertCanSeeTableRecords([$sistemas])
            ->assertCanNotSeeTableRecords([$camaras]);
    }

    public function test_guarda_los_ajustes_y_se_reflejan_en_el_sitio(): void
    {
        Livewire::test(AjustesDelSitio::class)
            ->fillForm([
                'marca' => 'Sinaloa Nube',
                'razon_social' => 'Sinaloa Nube Sistemas',
                'titulo_hero' => 'Otro título de portada',
                'entrada_hero' => 'Otra entrada para la portada.',
                'telefono' => '+52 668 111 2222',
                'email' => 'hola@sinaloanube.com',
            ])
            ->call('guardar')
            ->assertHasNoFormErrors();

        $this->assertSame('Otro título de portada', Ajuste::actuales()->titulo_hero);

        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('Otro título de portada')
            ->assertSee('+52 668 111 2222');
    }

    public function test_guarda_una_imagen_horizontal_para_la_portada(): void
    {
        Storage::fake('publico');

        Livewire::test(AjustesDelSitio::class)
            ->fillForm([
                'imagen_hero' => UploadedFile::fake()->create('portada.jpg', 100, 'image/jpeg'),
            ])
            ->call('guardar')
            ->assertHasNoFormErrors();

        $ajustes = Ajuste::query()->firstOrFail();

        $this->assertNotNull($ajustes->imagen_hero);
        Storage::disk('publico')->assertExists($ajustes->imagen_hero);
        $this->assertSame(Storage::disk('publico')->url($ajustes->imagen_hero), $ajustes->urlImagenHero());

        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('hero--con-imagen')
            ->assertSee('--hero-imagen: url(');
    }

    public function test_al_guardar_se_limpia_la_cache_de_ajustes(): void
    {
        $antes = Ajuste::actuales()->marca;

        Ajuste::query()->first()->update(['marca' => 'Marca Nueva']);

        $this->assertSame('Marca Nueva', Ajuste::actuales()->marca);
        $this->assertNotSame($antes, Ajuste::actuales()->marca);
    }

    public function test_un_servicio_oculto_desaparece_de_la_landing(): void
    {
        Servicio::query()->firstWhere('titulo', 'Redes WiFi')->update(['visible' => false]);

        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('Sistemas de información')
            ->assertDontSee('Redes WiFi');
    }
}
