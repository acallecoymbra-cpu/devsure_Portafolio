<?php

namespace Tests\Feature;

use App\Enums\EstadoLead;
use App\Filament\Resources\Leads\LeadResource;
use App\Filament\Resources\Leads\Pages\EditLead;
use App\Filament\Resources\Leads\Pages\ListLeads;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class PanelFilamentTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_panel_pide_iniciar_sesion(): void
    {
        $this->get(LeadResource::getUrl('index'))
            ->assertRedirect(route('filament.admin.auth.login'));
    }

    public function test_lista_los_prospectos_al_usuario_autenticado(): void
    {
        $lead = Lead::factory()->create(['nombre' => 'Ricardo Payán']);

        $this->actingAs(User::factory()->create());

        Livewire::test(ListLeads::class)
            ->assertCanSeeTableRecords([$lead])
            ->assertSee('Ricardo Payán');
    }

    public function test_filtra_los_prospectos_por_estado(): void
    {
        $nuevo = Lead::factory()->create();
        $contactado = Lead::factory()->contactado()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(ListLeads::class)
            ->filterTable('estado', EstadoLead::Contactado->value)
            ->assertCanSeeTableRecords([$contactado])
            ->assertCanNotSeeTableRecords([$nuevo]);
    }

    /**
     * Filament solo deja pasar a cualquier autenticado cuando el entorno es
     * "local". Fuera de ahí exige el contrato FilamentUser, así que sin esta
     * prueba el 403 solo aparece ya desplegado.
     */
    public function test_un_usuario_autenticado_entra_al_panel_fuera_de_local(): void
    {
        $this->app['env'] = 'staging';

        $this->actingAs(User::factory()->create())
            ->get(LeadResource::getUrl('index'))
            ->assertOk();
    }

    public function test_no_se_pueden_dar_de_alta_prospectos_a_mano(): void
    {
        $this->assertFalse(LeadResource::canCreate());
    }

    public function test_al_cambiar_de_estado_registra_el_primer_contacto(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(EditLead::class, ['record' => $lead->getKey()])
            ->fillForm([
                'estado' => EstadoLead::Contactado->value,
                'notas_internas' => 'Se le llamó el lunes.',
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        $lead->refresh();

        $this->assertSame(EstadoLead::Contactado, $lead->estado);
        $this->assertSame('Se le llamó el lunes.', $lead->notas_internas);
        $this->assertNotNull($lead->contactado_en);
    }

    public function test_el_badge_cuenta_los_prospectos_nuevos(): void
    {
        Lead::factory()->count(3)->create();
        Lead::factory()->contactado()->create();

        $this->assertSame('3', LeadResource::getNavigationBadge());
    }

    public function test_exporta_los_prospectos_a_csv(): void
    {
        Lead::factory()->create(['nombre' => 'Laura Mendoza']);

        $this->actingAs(User::factory()->create());

        Livewire::test(ListLeads::class)->assertActionExists('exportar');

        $respuesta = ListLeads::csvDe(Lead::query());

        ob_start();
        $respuesta->sendContent();
        $csv = (string) ob_get_clean();

        $this->assertStringContainsString('Laura Mendoza', $csv);
        $this->assertStringContainsString('Notas internas', $csv);
    }

    public function test_la_exportacion_respeta_el_filtro_de_la_tabla(): void
    {
        Lead::factory()->create(['nombre' => 'Laura Mendoza']);
        Lead::factory()->contactado()->create(['nombre' => 'Ricardo Payán']);

        $respuesta = ListLeads::csvDe(Lead::query()->where('estado', EstadoLead::Contactado));

        ob_start();
        $respuesta->sendContent();
        $csv = (string) ob_get_clean();

        $this->assertStringContainsString('Ricardo Payán', $csv);
        $this->assertStringNotContainsString('Laura Mendoza', $csv);
    }
}
