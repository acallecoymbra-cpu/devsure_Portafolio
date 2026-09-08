# Graph Report - sinaloanube-master  (2026-09-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 629 nodes · 1182 edges · 61 communities (26 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30

## God Nodes (most connected - your core abstractions)
1. `Lead` - 39 edges
2. `Ajuste` - 34 edges
3. `Caso` - 27 edges
4. `Servicio` - 27 edges
5. `LeadResource` - 26 edges
6. `Integration` - 25 edges
7. `User` - 21 edges
8. `Cliente` - 20 edges
9. `NuevoLeadRecibido` - 17 edges
10. `EstadoLead` - 15 edges

## Surprising Connections (you probably didn't know these)
- `LeadController` --inherits--> `Controller`  [EXTRACTED]
  app/Http/Controllers/LeadController.php → app/Http/Controllers/Controller.php
- `ContactoTest` --inherits--> `TestCase`  [EXTRACTED]
  tests/Feature/ContactoTest.php → tests/TestCase.php
- `CasosTest` --inherits--> `TestCase`  [EXTRACTED]
  tests/Feature/CasosTest.php → tests/TestCase.php
- `PanelContenidoTest` --inherits--> `TestCase`  [EXTRACTED]
  tests/Feature/PanelContenidoTest.php → tests/TestCase.php
- `ContenidoInicialTest` --inherits--> `TestCase`  [EXTRACTED]
  tests/Feature/ContenidoInicialTest.php → tests/TestCase.php

## Import Cycles
- None detected.

## Communities (61 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (32): AjustesDelSitio, Integraciones, CasoResource, CasoForm, ClienteResource, ClienteForm, LeadForm, LeadInfolist (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (25): EstadoLead, LeadController, StoreLeadRequest, Ajuste, self, Lead, TelegramChannel, EquipoVentas (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (13): LeadResource, EditLead, ListLeads, ViewLead, User, DatabaseSeeder, Filament\Models\Contracts\FilamentUser, Filament\Resources\Pages\ViewRecord (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (16): CreateCaso, EditCaso, ListCasos, CreateCliente, EditCliente, ListClientes, CreatePregunta, EditPregunta (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (15): IntegrationCredentials, Integration, self, WhatsAppChannel, Encrypter, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Contracts\Encryption\DecryptException, Illuminate\Database\Eloquent\Model (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (17): CasosTable, ClientesTable, LeadsTable, PreguntasTable, ServiciosTable, Filament\Actions\BulkActionGroup, Filament\Actions\DeleteAction, Filament\Actions\DeleteBulkAction (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (13): CasoFactory, static, ClienteFactory, static, LeadFactory, static, PreguntaFactory, static (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (20): AppServiceProvider, AdminPanelProvider, Filament\Http\Middleware\Authenticate, Filament\Http\Middleware\AuthenticateSession, Filament\Http\Middleware\DisableBladeIconComponents, Filament\Http\Middleware\DispatchServingFilamentEvent, Filament\Panel, Filament\PanelProvider (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (20): devDependencies, concurrently, laravel-vite-plugin, tailwindcss, @tailwindcss/vite, vite, optionalDependencies, @laravel/multiplex (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (10): CasoController, Controller, LandingController, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware, Illuminate\Http\Request, Illuminate\Support\Facades\Route (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (4): Caso, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Relations\BelongsTo, CasosTest

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (3): Cliente, Illuminate\Database\Eloquent\Relations\HasMany, PanelContenidoTest

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (3): GrupoServicio, Servicio, ServicioFactory

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (3): Filament\Actions\Action, Illuminate\Database\Eloquent\Builder, Symfony\Component\HttpFoundation\StreamedResponse

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (5): Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Http\UploadedFile, Livewire\Livewire, TestCase

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (9): partials.casos, partials.clientes, partials.contacto, partials.diferenciadores, partials.hero, partials.nosotros, partials.preguntas, partials.proceso (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (9): require-dev, fakerphp/faker, laravel/boost, laravel/pail, laravel/pao, laravel/pint, mockery/mockery, nunomaduro/collision (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (5): require, filament/filament, laravel/framework, laravel/tinker, php

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

## Knowledge Gaps
- **62 isolated node(s):** `partials.casos`, `partials.clientes`, `partials.contacto`, `partials.diferenciadores`, `partials.hero` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 243 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Ajuste` connect `Community 1` to `Community 0`, `Community 4`, `Community 8`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 25`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Lead` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 11`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Caso` connect `Community 11` to `Community 0`, `Community 4`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `partials.casos`, `partials.clientes`, `partials.contacto` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06378378378378378 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0517503805175038 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06387921022067364 - nodes in this community are weakly interconnected._