<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Models\Lead;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Channels\WhatsAppChannel;
use App\Notifications\EquipoVentas;
use App\Notifications\NuevoLeadRecibido;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'integrations.encryption_key' => 'base64:'.base64_encode(Encrypter::generateKey('AES-256-CBC')),
        ]);
    }

    public function test_cifra_las_credenciales_en_la_base_de_datos(): void
    {
        $integration = Integration::query()->create([
            'service' => Integration::TELEGRAM,
            'enabled' => true,
            'credentials' => ['bot_token' => 'token-super-secreto'],
            'settings' => ['chat_id' => '123456'],
        ]);

        $raw = DB::table('integrations')->where('id', $integration->id)->value('credentials');

        $this->assertStringNotContainsString('token-super-secreto', $raw);
        $this->assertSame('token-super-secreto', $integration->fresh()->credential('bot_token'));
    }

    public function test_una_clave_distinta_no_puede_descifrar_las_credenciales(): void
    {
        $integration = Integration::query()->create([
            'service' => Integration::TELEGRAM,
            'credentials' => ['bot_token' => 'token-super-secreto'],
        ]);

        config([
            'integrations.encryption_key' => 'base64:'.base64_encode(Encrypter::generateKey('AES-256-CBC')),
        ]);

        $this->expectException(DecryptException::class);

        $integration->fresh()->credentials;
    }

    public function test_habilita_los_canales_configurados_en_la_tabla(): void
    {
        Integration::query()->create([
            'service' => Integration::TELEGRAM,
            'enabled' => true,
            'credentials' => ['bot_token' => 'telegram-token'],
            'settings' => ['chat_id' => '123456'],
        ]);

        Integration::query()->create([
            'service' => Integration::WHATSAPP,
            'enabled' => true,
            'credentials' => ['token' => 'whatsapp-token'],
            'settings' => [
                'phone_number_id' => '987654',
                'destinatarios' => ['5216680000000'],
            ],
        ]);

        $canales = (new NuevoLeadRecibido(Lead::factory()->make()))->via(new EquipoVentas);

        $this->assertContains(TelegramChannel::class, $canales);
        $this->assertContains(WhatsAppChannel::class, $canales);
    }

    public function test_no_habilita_una_integracion_desactivada(): void
    {
        Integration::query()->create([
            'service' => Integration::TELEGRAM,
            'enabled' => false,
            'credentials' => ['bot_token' => 'telegram-token'],
            'settings' => ['chat_id' => '123456'],
        ]);

        $canales = (new NuevoLeadRecibido(Lead::factory()->make()))->via(new EquipoVentas);

        $this->assertNotContains(TelegramChannel::class, $canales);
    }
}
