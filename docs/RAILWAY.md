# Despliegue en Railway

DevSure se publica como dos servicios del mismo monorepo: `api` (NestJS) y
`web` (Next.js). La API conserva SQLite y los archivos cargados en un volumen
de Railway.

## Servicios

Conecta el mismo repositorio GitHub a ambos servicios. Deja el directorio raíz
en `/`, porque los paquetes compartidos se resuelven desde la raíz del
workspace.

| Servicio | Build Command | Start Command | Watch Paths |
| --- | --- | --- | --- |
| `api` | `pnpm --filter @devsure/api build` | `pnpm --filter @devsure/api start` | `/apps/api/**`, `/packages/**`, `/pnpm-lock.yaml`, `/package.json` |
| `web` | `pnpm --filter @devsure/web build` | `pnpm --filter @devsure/web start` | `/apps/web/**`, `/packages/**`, `/pnpm-lock.yaml`, `/package.json` |

Genera un dominio público para los dos servicios antes de definir sus
referencias cruzadas.

## Variables de `api`

```dotenv
NODE_ENV=production
API_PREFIX=api/v1
DATABASE_TYPE=sqlite
DATABASE_URL=/data/devsure.sqlite
DATABASE_LOGGING=false
UPLOADS_DIR=/data/uploads
SWAGGER_ENABLED=false
BODY_LIMIT=1mb
AUTH_SESSION_TTL_SECONDS=28800
AUTH_LOGIN_WINDOW_SECONDS=60
AUTH_LOGIN_MAX_ATTEMPTS=5
CORS_ORIGINS=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
```

No definas `API_PORT`: la API usa automáticamente el `PORT` que Railway
inyecta. El nombre `web` de la referencia debe coincidir exactamente con el
nombre del servicio frontend en Railway.

Adjunta un volumen al servicio `api` con punto de montaje `/data`. Es necesario
para conservar tanto `devsure.sqlite` como `uploads` entre despliegues.

## Variables de `web`

```dotenv
NODE_ENV=production
API_BASE_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api/v1
NEXT_PUBLIC_API_BASE_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api/v1
NEXT_PUBLIC_SITE_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
```

El nombre `api` debe coincidir con el servicio backend. Las variables
`NEXT_PUBLIC_*` participan en la compilación de Next.js: tras cambiar una
referencia, vuelve a desplegar `web`.

## Primer despliegue

1. Despliega `api`. Las migraciones se ejecutan al iniciar, antes de atender
   peticiones.
2. Crea el administrador inicial con `pnpm db:seed:admin` en un shell de
   Railway, proporcionando temporalmente `ADMIN_SEED_USERNAME`,
   `ADMIN_SEED_EMAIL` y `ADMIN_SEED_PASSWORD` como variables de ese comando.
   Elimina esas variables al terminar.
3. Carga los datos iniciales que correspondan mediante los comandos de seed,
   también desde el shell de Railway.
4. Despliega `web` y valida `/`, `/admin/login` y
   `https://<dominio-api>/api/v1/health`.

SQLite es adecuado para este MVP con una sola réplica de API y un único
volumen. No escales horizontalmente el servicio `api` mientras se use esta
base de datos.
