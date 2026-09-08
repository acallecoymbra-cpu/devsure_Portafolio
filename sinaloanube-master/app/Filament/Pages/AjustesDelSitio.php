<?php

namespace App\Filament\Pages;

use App\Models\Ajuste;
use BackedEnum;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class AjustesDelSitio extends Page implements HasForms
{
    use InteractsWithForms;

    protected string $view = 'filament.pages.ajustes-del-sitio';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static string|UnitEnum|null $navigationGroup = 'Contenido del sitio';

    protected static ?int $navigationSort = 10;

    protected static ?string $title = 'Ajustes del sitio';

    /**
     * @var array<string, mixed>|null
     */
    public ?array $data = [];

    public static function getNavigationLabel(): string
    {
        return 'Ajustes del sitio';
    }

    public function mount(): void
    {
        $this->form->fill($this->registro()->attributesToArray());
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->statePath('data')
            ->components([
                Tabs::make()->tabs([
                    Tabs\Tab::make('Identidad')->schema([
                        Section::make()->columns(2)->schema([
                            TextInput::make('marca')
                                ->label('Marca')
                                ->required()
                                ->maxLength(60)
                                ->helperText('Nombre corto, el que se usa en textos y botones.'),

                            TextInput::make('razon_social')
                                ->label('Razón social')
                                ->required()
                                ->maxLength(120),

                            TextInput::make('claim')
                                ->label('Bajada de marca')
                                ->maxLength(140)
                                ->columnSpanFull()
                                ->helperText('Va arriba del título de portada, en mayúsculas.'),

                            FileUpload::make('logo')
                                ->label('Logotipo')
                                ->image()
                                ->disk('publico')
                                ->directory('marca')
                                ->visibility('public')
                                ->maxSize(2048)
                                ->columnSpanFull()
                                ->helperText('SVG o PNG con fondo transparente. Si lo dejas vacío se usa la marca dibujada por defecto.'),
                        ]),
                    ]),

                    Tabs\Tab::make('Portada')->schema([
                        Section::make()->schema([
                            TextInput::make('titulo_hero')
                                ->label('Título principal')
                                ->required()
                                ->maxLength(160),

                            Textarea::make('entrada_hero')
                                ->label('Párrafo de entrada')
                                ->required()
                                ->rows(3),

                            FileUpload::make('imagen_hero')
                                ->label('Imagen de portada')
                                ->image()
                                ->imageEditor()
                                ->imageEditorAspectRatios(['16:9'])
                                ->disk('publico')
                                ->directory('portada')
                                ->visibility('public')
                                ->maxSize(4096)
                                ->columnSpanFull()
                                ->helperText('Se usa como fondo del hero. Elige una imagen 16:9 con los sujetos a la derecha; se guarda en el servidor y no depende de Git.'),
                        ]),

                        Section::make('Métricas')
                            ->description('Los tres números que se animan en "Quiénes somos".')
                            ->schema([
                                Repeater::make('metricas')
                                    ->hiddenLabel()
                                    ->columns(3)
                                    ->defaultItems(0)
                                    ->addActionLabel('Agregar métrica')
                                    ->reorderable()
                                    ->itemLabel(fn (array $state): ?string => $state['texto'] ?? null)
                                    ->schema([
                                        TextInput::make('valor')
                                            ->label('Número')
                                            ->required()
                                            ->maxLength(6),
                                        TextInput::make('sufijo')
                                            ->label('Sufijo')
                                            ->maxLength(4)
                                            ->placeholder('+, %, /7'),
                                        TextInput::make('texto')
                                            ->label('Texto')
                                            ->required()
                                            ->maxLength(60),
                                    ]),
                            ]),
                    ]),

                    Tabs\Tab::make('Quiénes somos')->schema([
                        Section::make()->columns(2)->schema([
                            TextInput::make('nosotros_antetitulo')
                                ->label('Antetítulo')
                                ->maxLength(60),

                            TextInput::make('nosotros_titulo')
                                ->label('Título')
                                ->maxLength(160),

                            Textarea::make('nosotros_texto')
                                ->label('Texto')
                                ->rows(4)
                                ->columnSpanFull(),

                            Textarea::make('nosotros_nota')
                                ->label('Nota destacada')
                                ->rows(2)
                                ->columnSpanFull()
                                ->helperText('El recuadro con el ícono de ubicación.'),
                        ]),

                        Section::make('Por qué elegirnos')->schema([
                            Repeater::make('diferenciadores')
                                ->hiddenLabel()
                                ->defaultItems(0)
                                ->addActionLabel('Agregar motivo')
                                ->reorderable()
                                ->collapsible()
                                ->itemLabel(fn (array $state): ?string => $state['titulo'] ?? null)
                                ->schema([
                                    TextInput::make('titulo')
                                        ->label('Título')
                                        ->required()
                                        ->maxLength(80),
                                    Textarea::make('texto')
                                        ->label('Texto')
                                        ->required()
                                        ->rows(3),
                                ]),
                        ]),

                        Section::make('Cómo trabajamos')->schema([
                            Repeater::make('proceso')
                                ->hiddenLabel()
                                ->columns(3)
                                ->defaultItems(0)
                                ->addActionLabel('Agregar paso')
                                ->reorderable()
                                ->collapsible()
                                ->itemLabel(fn (array $state): ?string => $state['titulo'] ?? null)
                                ->schema([
                                    TextInput::make('paso')
                                        ->label('Número')
                                        ->required()
                                        ->maxLength(4)
                                        ->placeholder('01'),
                                    TextInput::make('titulo')
                                        ->label('Título')
                                        ->required()
                                        ->maxLength(80)
                                        ->columnSpan(2),
                                    Textarea::make('texto')
                                        ->label('Texto')
                                        ->required()
                                        ->rows(2)
                                        ->columnSpanFull(),
                                ]),
                        ]),
                    ]),

                    Tabs\Tab::make('Contacto')->schema([
                        Section::make('Datos públicos')->columns(2)->schema([
                            TextInput::make('telefono')
                                ->label('Teléfono')
                                ->maxLength(40)
                                ->placeholder('+52 668 000 0000'),

                            TextInput::make('telefono_marcado')
                                ->label('Teléfono para marcar')
                                ->maxLength(20)
                                ->placeholder('+526680000000')
                                ->helperText('Sin espacios. Es lo que usa el enlace "tel:".'),

                            TextInput::make('whatsapp_publico')
                                ->label('WhatsApp')
                                ->maxLength(20)
                                ->placeholder('5216680000000')
                                ->helperText('Formato internacional, solo dígitos.'),

                            TextInput::make('email')
                                ->label('Correo')
                                ->email()
                                ->maxLength(180),

                            TextInput::make('direccion')
                                ->label('Dirección')
                                ->maxLength(200)
                                ->columnSpanFull(),

                            TextInput::make('horario')
                                ->label('Horario')
                                ->maxLength(120)
                                ->columnSpanFull(),
                        ]),

                        Section::make('Redes sociales')
                            ->description('Deja vacío lo que no uses y el enlace no aparece.')
                            ->columns(3)
                            ->schema([
                                TextInput::make('facebook')->label('Facebook')->url()->maxLength(200),
                                TextInput::make('linkedin')->label('LinkedIn')->url()->maxLength(200),
                                TextInput::make('instagram')->label('Instagram')->url()->maxLength(200),
                            ]),
                    ]),

                    Tabs\Tab::make('Formulario')->schema([
                        Section::make('Avisos de prospectos')->schema([
                            TagsInput::make('leads_emails')
                                ->label('Correos que reciben los avisos')
                                ->placeholder('Escribe un correo y presiona Enter')
                                ->nestedRecursiveRules(['email'])
                                ->helperText('Telegram y WhatsApp se administran en la sección Integraciones.'),
                        ]),

                        Section::make('Rangos de presupuesto')
                            ->description('Las opciones del selector "Presupuesto estimado".')
                            ->schema([
                                Repeater::make('presupuestos')
                                    ->hiddenLabel()
                                    ->simple(
                                        TextInput::make('rango')
                                            ->label('Rango')
                                            ->required()
                                            ->maxLength(60),
                                    )
                                    ->defaultItems(0)
                                    ->addActionLabel('Agregar rango')
                                    ->reorderable(),
                            ]),
                    ]),
                ])->columnSpanFull(),
            ]);
    }

    public function guardar(): void
    {
        $this->registro()->fill($this->form->getState())->save();

        Notification::make()
            ->title('Ajustes guardados')
            ->body('Los cambios ya están en el sitio.')
            ->success()
            ->send();
    }

    protected function registro(): Ajuste
    {
        return Ajuste::query()->first()
            ?? Ajuste::query()->create(Ajuste::valoresPorDefecto());
    }
}
