# DevSure API

Minimal NestJS foundation for DevSure Phase 0.

## Run

```powershell
# From the repository root:
pnpm install
Set-Location apps/api
Copy-Item .env.example .env
pnpm run start:dev
```

The API is available at `http://localhost:3001/api/v1` and Swagger at
`http://localhost:3001/docs`.

## Verification

```powershell
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run test:integration
pnpm run build
```

Database changes use the independent TypeORM CLI:

```powershell
pnpm run migration:run
pnpm run migration:revert
```

SQLite runs with `synchronize: false`; use migrations for schema changes.
