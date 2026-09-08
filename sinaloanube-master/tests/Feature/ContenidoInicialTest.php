<?php

namespace Tests\Feature;

use App\Models\Ajuste;
use App\Models\Pregunta;
use App\Models\Servicio;
use App\Models\User;
use Database\Seeders\ContenidoInicialSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El seeder corre en cada despliegue, así que lo que importa no es que siembre
 * bien la primera vez, sino que no pise lo que el equipo edite después.
 */
class ContenidoInicialTest extends TestCase
{
    use RefreshDatabase;

    public function test_siembra_el_contenido_en_una_instalacion_vacia(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame('Sinaloa Nube', Ajuste::actuales()->marca);
        $this->assertNull(Ajuste::actuales()->urlImagenHero());
        $this->assertSame(7, Servicio::count());
        $this->assertSame(5, Pregunta::count());
    }

    public function test_la_landing_declara_el_favicon_de_la_marca(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        $this->get(route('landing'))
            ->assertOk()
            ->assertSee('favicon.svg');
    }

    public function test_correrlo_dos_veces_no_duplica_nada(): void
    {
        $this->seed(ContenidoInicialSeeder::class);
        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame(1, Ajuste::count());
        $this->assertSame(7, Servicio::count());
        $this->assertSame(5, Pregunta::count());
    }

    public function test_no_revive_un_servicio_borrado_desde_el_panel(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        Servicio::query()->where('titulo', 'Redes WiFi')->delete();

        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame(6, Servicio::count());
        $this->assertNull(Servicio::query()->firstWhere('titulo', 'Redes WiFi'));
    }

    public function test_no_duplica_un_servicio_renombrado_desde_el_panel(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        Servicio::query()->firstWhere('titulo', 'Aplicaciones web')->update(['titulo' => 'Desarrollo web']);

        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame(7, Servicio::count());
        $this->assertNull(Servicio::query()->firstWhere('titulo', 'Aplicaciones web'));
    }

    public function test_no_pisa_los_ajustes_editados_desde_el_panel(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        Ajuste::query()->first()->update(['titulo_hero' => 'Un título que escribió Sergio']);

        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame('Un título que escribió Sergio', Ajuste::actuales()->titulo_hero);
    }

    public function test_no_revive_una_pregunta_borrada(): void
    {
        $this->seed(ContenidoInicialSeeder::class);

        Pregunta::query()->first()->delete();

        $this->seed(ContenidoInicialSeeder::class);

        $this->assertSame(4, Pregunta::count());
    }

    public function test_el_seeder_general_crea_el_acceso_inicial_sin_datos_de_entorno(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', [
            'id' => 1,
            'name' => 'Sergio',
            'email' => 'sergio@sinaloanube.com',
        ]);
    }

    public function test_el_seeder_general_no_duplica_ni_pisa_el_administrador(): void
    {
        $this->seed(DatabaseSeeder::class);

        User::query()->findOrFail(1)->update([
            'name' => 'Administrador editado',
            'email' => 'nuevo@sinaloanube.com',
            'password' => 'una-clave-nueva',
        ]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(1, User::count());
        $this->assertDatabaseHas('users', [
            'id' => 1,
            'name' => 'Administrador editado',
            'email' => 'nuevo@sinaloanube.com',
        ]);
    }
}
