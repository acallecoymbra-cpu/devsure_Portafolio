<?php

namespace Tests\Feature;

use App\Models\Caso;
use App\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CasosTest extends TestCase
{
    use RefreshDatabase;

    public function test_lista_los_casos_publicados(): void
    {
        $publicado = Caso::factory()->create(['titulo' => 'Control de embarques']);
        $borrador = Caso::factory()->borrador()->create(['titulo' => 'Caso sin publicar']);

        $this->get(route('casos.index'))
            ->assertOk()
            ->assertSee($publicado->titulo)
            ->assertDontSee($borrador->titulo);
    }

    public function test_filtra_los_casos_por_servicio(): void
    {
        Caso::factory()->create(['titulo' => 'Sistema de embarques', 'servicio' => 'Sistemas de información']);
        Caso::factory()->create(['titulo' => 'Cámaras en sucursales', 'servicio' => 'Cámaras de seguridad']);

        $this->get(route('casos.index', ['servicio' => 'Sistemas de información']))
            ->assertOk()
            ->assertSee('Sistema de embarques')
            ->assertDontSee('Cámaras en sucursales');
    }

    public function test_muestra_el_detalle_de_un_caso(): void
    {
        $caso = Caso::factory()->create([
            'reto' => 'Todo estaba en hojas de cálculo.',
            'resultados' => ['Reportes al instante'],
        ]);

        $this->get(route('casos.show', $caso))
            ->assertOk()
            ->assertSee($caso->titulo)
            ->assertSee('Todo estaba en hojas de cálculo.')
            ->assertSee('Reportes al instante');
    }

    public function test_un_caso_en_borrador_no_es_publico(): void
    {
        $caso = Caso::factory()->borrador()->create();

        $this->get(route('casos.show', $caso))->assertNotFound();
    }

    public function test_devuelve_404_para_un_caso_inexistente(): void
    {
        $this->get('/casos/este-caso-no-existe')->assertNotFound();
    }

    public function test_la_landing_muestra_la_franja_de_clientes_y_los_casos(): void
    {
        $cliente = Cliente::factory()->create(['nombre' => 'Agroexportadora del Valle']);
        $caso = Caso::factory()->create(['cliente_id' => $cliente->id]);

        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('Agroexportadora del Valle')
            ->assertSee('Ver casos de éxito')
            ->assertSee(route('casos.show', $caso));
    }

    public function test_oculta_a_los_clientes_marcados_como_no_visibles(): void
    {
        Cliente::factory()->oculto()->create(['nombre' => 'Cliente Escondido']);

        $this->get(route('landing'))
            ->assertOk()
            ->assertDontSee('Cliente Escondido');
    }

    public function test_oculta_la_franja_y_los_casos_cuando_no_hay_datos(): void
    {
        $this->get(route('landing'))
            ->assertOk()
            ->assertDontSee('Ver casos de éxito')
            ->assertDontSee('id="casos"', false);
    }
}
