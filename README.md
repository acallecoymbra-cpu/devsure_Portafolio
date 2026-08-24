# DevSure

> Fundaciones digitales claras para construir experiencias confiables.

DevSure es un monorepo pnpm para un sitio corporativo y catálogo tecnológico. La
Fase 0 incluye la base de frontend, API, contratos compartidos, persistencia
SQLite, migraciones y automatización de calidad.

## Stack

| Área         | Tecnología                                   |
| ------------ | -------------------------------------------- |
| Monorepo     | pnpm + Turborepo                             |
| Frontend     | Next.js App Router + React + TypeScript      |
| Backend      | NestJS + TypeScript                          |
| Persistencia | TypeORM + SQLite (`better-sqlite3`)          |
| Contratos    | `packages/contracts`                         |
| Calidad      | ESLint, Prettier, Jest, Vitest y pruebas E2E |

## Requisitos

- Node.js 20 LTS
- pnpm 9.15.5
- Git

## Inicio rápido

Desde la raíz del proyecto:

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
pnpm db:migration:run
pnpm dev
```

Aplicaciones disponibles:

- Web: <http://localhost:3000>
- Health API: <http://localhost:3001/api/v1/health>
- Swagger: <http://localhost:3001/docs>

## Variables de entorno

La plantilla está en `.env.example`. Las variables reales deben configurarse
localmente y nunca deben subirse al repositorio.

Para configuraciones específicas también existen:

- `apps/api/.env.example`
- `apps/web/.env.example`

La API utiliza SQLite por defecto en `.data/devsure.sqlite` y mantiene
`synchronize: false`; los cambios de esquema deben hacerse mediante migraciones.

## Scripts principales

```powershell
# Desarrollo
pnpm dev

# Calidad
pnpm lint
pnpm typecheck
pnpm format:check

# Pruebas
pnpm test
pnpm test:integration
pnpm test:e2e

# Producción
pnpm build

# Base de datos
pnpm db:migration:run
pnpm db:migration:show
pnpm db:migration:revert
```

Para levantar la compilación de producción:

```powershell
pnpm build
pnpm --filter @devsure/api start
pnpm --filter @devsure/web start
```

La API y el frontend se ejecutan en terminales separadas.

## Estructura

```text
apps/
├─ api/                  # API REST NestJS
└─ web/                  # Interfaz Next.js

packages/
├─ config/               # Configuración compartida
└─ contracts/            # Tipos y contratos públicos
```

La API expone rutas versionadas bajo `/api/v1`. Las entidades TypeORM no se
usan como contrato público; las respuestas se definen mediante tipos y DTOs.

## Clonar en otra máquina

```powershell
git clone https://github.com/USUARIO/REPOSITORIO.git
Set-Location REPOSITORIO

corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm db:migration:run
pnpm dev
```

## Publicar en GitHub

```powershell
git add .
git commit -m "Create DevSure Phase 0"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

No se deben publicar archivos `.env`, `node_modules`, `.next`, `dist` ni
`.data`. Estos directorios están excluidos mediante `.gitignore`.

## Estado del proyecto

La Fase 0 prepara la arquitectura y el flujo de desarrollo. El siguiente slice
recomendado es **Tecnologías**, que añadirá el catálogo administrable, filtros,
paginación y conexión entre API y frontend.
