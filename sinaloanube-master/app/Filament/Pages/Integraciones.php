<?php

namespace App\Filament\Pages;

use App\Models\Integration;
use BackedEnum;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class Integraciones extends Page implements HasForms
{
    use InteractsWithForms;

    protected string $view = 'filament.pages.integraciones';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPaperAirplane;

    protected static string|UnitEnum|null $navigationGroup = 'Comercial';

    protected static ?int $navigationSort = 20;

    protected static ?string $title = 'Integraciones';

    /** @var array<string, mixed>|null */
    public ?array $data = [];

    public function mount(): void
    {
        $telegram = $this->registro(Integration::TELEGRAM);
        $whatsapp = $this->registro(Integration::WHATSAPP);

        $this->form->fill([
            'telegram' => [
                'enabled' => $telegram->enabled,
                'bot_token' => null,
                'chat_id' => $telegram->setting('chat_id'),
            ],
            'whatsapp' => [
                'enabled' => $whatsapp->enabled,
                'token' => null,
                'phone_number_id' => $whatsapp->setting('phone_number_id'),
                'destinatarios' => $whatsapp->setting('destinatarios', []),
                'plantilla' => $whatsapp->setting('plantilla'),
                'idioma' => $whatsapp->setting('idioma', 'es_MX'),
                'version_api' => $whatsapp->setting('version_api', 'v21.0'),
            ],
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema->statePath('data')->components([
            Tabs::make()->tabs([
                Tabs\Tab::make('Telegram')->schema([
                    Section::make()->schema([
                        Toggle::make('telegram.enabled')->label('Enviar avisos por Telegram'),
                        TextInput::make('telegram.bot_token')
                            ->label('Token del bot')
                            ->password()
                            ->revealable()
                            ->helperText('Déjalo vacío para conservar el token guardado.'),
                        TextInput::make('telegram.chat_id')
                            ->label('Chat ID')
                            ->maxLength(100),
                    ]),
                ]),
                Tabs\Tab::make('WhatsApp')->schema([
                    Section::make()->columns(2)->schema([
                        Toggle::make('whatsapp.enabled')
                            ->label('Enviar avisos por WhatsApp')
                            ->columnSpanFull(),
                        TextInput::make('whatsapp.token')
                            ->label('Token de Meta')
                            ->password()
                            ->revealable()
                            ->helperText('Déjalo vacío para conservar el token guardado.')
                            ->columnSpanFull(),
                        TextInput::make('whatsapp.phone_number_id')
                            ->label('Phone number ID')
                            ->maxLength(100),
                        TagsInput::make('whatsapp.destinatarios')
                            ->label('Destinatarios')
                            ->placeholder('Número internacional y Enter'),
                        TextInput::make('whatsapp.plantilla')
                            ->label('Plantilla aprobada')
                            ->maxLength(100),
                        TextInput::make('whatsapp.idioma')
                            ->label('Idioma de plantilla')
                            ->default('es_MX')
                            ->maxLength(12),
                        TextInput::make('whatsapp.version_api')
                            ->label('Versión de Graph API')
                            ->default('v21.0')
                            ->maxLength(20),
                    ]),
                ]),
            ])->columnSpanFull(),
        ]);
    }

    public function guardar(): void
    {
        $data = $this->form->getState();

        $this->guardarTelegram($data['telegram']);
        $this->guardarWhatsApp($data['whatsapp']);

        Notification::make()->title('Integraciones guardadas')->success()->send();
        $this->mount();
    }

    /** @param array<string, mixed> $data */
    protected function guardarTelegram(array $data): void
    {
        $integration = $this->registro(Integration::TELEGRAM);
        $credentials = $integration->credentials ?? [];

        if (filled($data['bot_token'] ?? null)) {
            $credentials['bot_token'] = $data['bot_token'];
        }

        $integration->update([
            'enabled' => $data['enabled'] ?? false,
            'credentials' => $credentials,
            'settings' => ['chat_id' => $data['chat_id'] ?? null],
        ]);
    }

    /** @param array<string, mixed> $data */
    protected function guardarWhatsApp(array $data): void
    {
        $integration = $this->registro(Integration::WHATSAPP);
        $credentials = $integration->credentials ?? [];

        if (filled($data['token'] ?? null)) {
            $credentials['token'] = $data['token'];
        }

        $integration->update([
            'enabled' => $data['enabled'] ?? false,
            'credentials' => $credentials,
            'settings' => [
                'phone_number_id' => $data['phone_number_id'] ?? null,
                'destinatarios' => $data['destinatarios'] ?? [],
                'plantilla' => $data['plantilla'] ?? null,
                'idioma' => $data['idioma'] ?? 'es_MX',
                'version_api' => $data['version_api'] ?? 'v21.0',
            ],
        ]);
    }

    protected function registro(string $service): Integration
    {
        return Integration::query()->firstOrCreate(
            ['service' => $service],
            ['enabled' => false, 'settings' => []],
        );
    }
}
