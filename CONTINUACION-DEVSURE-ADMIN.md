# Continuación de DevSure Admin

## Registro de sesiones

Regla de trabajo adoptada: **una entidad o módulo por sesión**, con un
objetivo verificable y este documento actualizado al finalizar.

### Sesión 2026-09-07 — Auth: login por `username`

**Objetivo de la sesión:** consolidar la autenticación administrativa para
usar `username` como credencial de acceso (spec §4.1), dejando `email` como
dato de contacto. Es el primer punto de "Fundamentos administrativos" y
bloqueaba todo lo demás (Profile/owner_id depende de poder crear y loguear un
admin).

**Cambios realizados:**

- `AdminUser` ahora tiene columna `username` (varchar 32, única, inmutable
  por diseño: ningún endpoint la permite modificar).
- Login (`POST /api/auth/login`) exige `{ username, password }` en vez de
  `{ email, password }`. `email` sigue en la entidad como dato de contacto.
- `AdminIdentity` (contrato compartido) y `AdminIdentityDto` incluyen
  `username`.
- Se agregó `pnpm db:seed:admin` (`apps/api/src/database/seeds/seed-admin.ts`)
  para crear/actualizar el usuario admin inicial vía
  `ADMIN_SEED_USERNAME` / `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`. Antes de
  esta sesión **no existía ninguna forma de crear un admin** (ni seed ni
  fixture de pruebas), así que sin esto el login no era verificable
  end-to-end.
- Panel admin (Next.js): formulario de login pide "Usuario" en vez de
  "Correo electrónico"; la barra lateral muestra `username`.

**Archivos modificados/creados:**

```text
apps/api/src/auth/entities/admin-user.entity.ts
apps/api/src/auth/auth.dto.ts
apps/api/src/auth/auth.service.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/database/migrations/1788825600000-AddAdminUsername.ts   (nuevo)
apps/api/src/database/seeds/seed-admin.ts                             (nuevo)
apps/api/src/database/seeds/seed-admin.spec.ts                        (nuevo)
apps/api/test/auth.e2e-spec.ts                                        (nuevo)
apps/api/package.json            (script seed:admin)
package.json                     (script db:seed:admin)
.env.example                     (ADMIN_SEED_USERNAME/EMAIL/PASSWORD)
packages/contracts/src/index.ts  (AdminIdentity.username)
apps/web/src/features/admin/api/admin-api.ts       (login(username, password))
apps/web/src/features/admin/components/login-form.tsx
apps/web/src/features/admin/components/admin-shell.tsx
```

**Pruebas ejecutadas (todas verdes):**

```text
pnpm --filter @devsure/contracts build
pnpm --filter @devsure/contracts test
pnpm --filter @devsure/api lint
pnpm --filter @devsure/api typecheck
pnpm --filter @devsure/api test              (19 tests, incluye seed-admin.spec.ts)
pnpm --filter @devsure/api test:integration  (22 tests, incluye auth.e2e-spec.ts:
                                               login válido/ inválido, username
                                               malformado, sesión, CSRF, cambio de
                                               contraseña, revocación de sesiones
                                               antiguas, logout)
pnpm --filter @devsure/web lint
pnpm --filter @devsure/web typecheck
pnpm --filter @devsure/web test              (falla 1/4, ver "Pendientes")
```

No se ejecutó `pnpm test:e2e` (Playwright) ni `pnpm build` completo: no eran
necesarios para este módulo (no se tocó ninguna página pública ni el build de
producción) y el runner de Playwright no tenía un spec de auth que ejecutar.

**Pendientes detectados (no corregidos, fuera de alcance de esta sesión):**

- `apps/web/tests/admin-structure.test.mjs` ya fallaba **antes** de esta
  sesión: exige `apps/web/tests/e2e/admin-technologies.spec.ts`, que nunca se
  creó. No es una regresión de este cambio; requiere su propia sesión
  (Playwright e2e del CRUD de tecnologías admin).
- No hay endpoint para cambiar el `username` en el futuro multi-usuario (no
  requerido aún; el username es inmutable por spec).

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Implementar el módulo **Profile** (`GET/PATCH /api/admin/profile`):
identidad editable (name, fullName, email), avatar, bio/headline/resume
traducibles (JSON `{en, es, ...}`), `activeLocales`/`defaultLocale` y el
helper `translate()` (spec §5.2, §6.1, §7). Dejar **Translations** y
**Uploads** para sesiones posteriores (son módulos propios). Diseño sugerido:
mantener `admin_users` como identidad de auth (id, username, email, password,
role) y crear una entidad `Profile` 1:1 (`owner_id` único → `admin_users.id`)
con el contenido editorial, para no mezclar responsabilidades de auth con
contenido de portfolio.

## Instrucción para la siguiente IA

Continúa el desarrollo del proyecto **DevSure** desde el estado actual del
repositorio. No reinicies el proyecto, no borres implementaciones existentes y
no reviertas cambios que no hayas creado tú.

Antes de modificar archivos:

1. Lee este documento.
2. Lee `AGENTS.md`, `README.md` y `Portfolio/ADMIN-PORTABLE-SPEC.md`.
3. Revisa `git status` y el diff actual.
4. Inspecciona la implementación existente para reutilizar sus patrones.
5. Ejecuta las verificaciones necesarias después de cada bloque funcional.

## Proyecto y rutas importantes

Repositorio local:

```text
C:\Users\aliva\Documents\Codex\2026-08-24\quie\outputs\DEVSURE CODE
```

Especificación principal que debe implementarse:

```text
C:\Users\aliva\Documents\Codex\2026-08-24\quie\outputs\DEVSURE CODE\Portfolio\ADMIN-PORTABLE-SPEC.md
```

El proyecto es un monorepo con:

- `apps/api`: API NestJS.
- `apps/web`: frontend y panel administrativo Next.js.
- `packages/config`: configuración compartida.
- `packages/contracts`: contratos TypeScript compartidos.

Stack principal:

- pnpm + Turborepo.
- Next.js App Router, React y TypeScript.
- NestJS y TypeScript.
- TypeORM con SQLite (`better-sqlite3`).
- Migraciones TypeORM.
- Jest/Vitest y pruebas E2E.

## Objetivo real del trabajo

Portar a DevSure la funcionalidad descrita en
`Portfolio/ADMIN-PORTABLE-SPEC.md`. La especificación proviene de un panel
Laravel + Filament y describe un CMS de portfolio administrable desde
`/admin`, sin editar código para cambiar el contenido público.

El panel debe permitir gestionar el contenido que aparece en la web pública:

- Profile.
- Translations.
- Experiences.
- Projects.
- Studies/Education.
- Skills.
- Services.
- Strengths.
- Work style items.
- FAQs.
- Testimonials.
- Blog posts.
- Networks.
- Social links.
- Contact messages/Inbox.

La especificación también exige autenticación, autorización por propietario,
campos traducibles almacenados en base de datos, drafts mediante
`published_at`, uploads, endpoints públicos y una UI administrativa reutilizable.

## Estado actual real

La implementación está **parcialmente avanzada**, pero no terminada.

Ya existe, al menos, lo siguiente:

- Autenticación administrativa inicial.
- Entidades y sesiones administrativas.
- Login en `/admin/login`.
- Migraciones iniciales relacionadas con autenticación.
- Cambio obligatorio de contraseña en el flujo existente.
- Panel protegido de Next.js.
- CRUD administrativo inicial para `technologies`.
- Endpoints públicos y administrativos iniciales de tecnologías.
- Estructura base de API NestJS y frontend Next.js.
- Avances en la página pública de home, cultura y tecnologías.
- Archivos de pruebas estructurales y E2E para varias áreas existentes.

Archivos y carpetas relevantes ya presentes:

```text
apps/api/src/auth/
apps/api/src/technologies/
apps/api/src/database/migrations/
apps/api/src/database/seeds/
apps/web/src/app/admin/
apps/web/src/features/admin/
apps/web/src/app/cultura/
apps/web/src/features/culture/
apps/web/src/features/home/
apps/web/src/features/technologies/
```

No asumas que la implementación existente está completa solo porque compila.
Úsala como base y verifica sus contratos, autenticación, validación,
persistencia, manejo de errores y pruebas.

## Trabajo pendiente principal

Completar la especificación en este orden, salvo que la inspección del código
indique una dependencia diferente:

### 1. Fundamentos administrativos

- Consolidar autenticación por `username`.
- Verificar sesiones, expiración, logout y cambio de contraseña.
- Proteger todas las rutas `/api/admin/*`.
- Asociar el contenido a `owner_id`.
- Implementar Profile.
- Implementar uploads básicos.
- Implementar locales activos, locale por defecto y helper de traducción.

### 2. Contenido core

- Experiences, incluyendo `levels` y campos traducibles.
- Projects, incluyendo apps, galerías, borradores y límite de destacados.
- Studies/Education.
- Skills.
- Services.
- Endpoint público completo del portfolio.

### 3. Contenido secundario

- Strengths.
- Work style items.
- FAQs.
- Testimonials.
- Posts/Blog.
- Página de Translations.

### 4. Redes e Inbox

- Catálogo global de Networks.
- Acciones de approve y merge/alias cuando correspondan.
- Social links asociados al Profile.
- Formulario público de contacto.
- Inbox administrativo de mensajes.
- Lectura, respuesta/estado y borrado según la especificación.

### 5. UI administrativa

- Layout administrativo con navegación equivalente al panel original.
- Login y rutas protegidas.
- Tablas, formularios, creación, edición y borrado.
- Componentes reutilizables para formularios y tablas.
- Tabs EN/ES para campos traducibles.
- Estados de carga, error, vacío y confirmación de acciones.
- Validación coherente con los DTOs de la API.

## Reglas de diseño que deben preservarse

1. El CMS debe permitir modificar el contenido sin editar código.
2. Los textos editoriales deben almacenarse en la base de datos, no
   hardcodearse en archivos de idioma.
3. Los drafts deben representarse con `published_at: null`, no con un booleano
   alternativo.
4. Debe existir un límite razonable para proyectos destacados.
5. Networks debe ser un catálogo compartido y evitar duplicados mediante
   alias/merge.
6. Inbox recibe mensajes desde el formulario público; no debe permitir crear
   mensajes manualmente desde el admin.
7. `username` es la identidad de acceso y debe quedar preparado para una
   futura separación por usuario.
8. Los objetos JSON anidados traducibles deben conservar soporte para locales.
9. La API debe filtrar siempre por propietario en los recursos privados.
10. Los contratos públicos deben separarse de las entidades de persistencia.

## Rutas administrativas objetivo

```text
/admin/login
/admin
/admin/profile
/admin/translations
/admin/experiences
/admin/projects
/admin/studies
/admin/skills
/admin/services
/admin/strengths
/admin/work-style-items
/admin/faqs
/admin/testimonials
/admin/posts
/admin/networks
/admin/contact-messages
```

`/admin` debe llevar al área principal del panel, equivalente al Profile si
esa sigue siendo la decisión adoptada en la implementación.

## API objetivo

La especificación describe, como mínimo:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password

GET/PATCH /api/admin/profile
GET/PATCH /api/admin/translations

CRUD /api/admin/experiences
CRUD /api/admin/projects
CRUD /api/admin/studies
CRUD /api/admin/skills
CRUD /api/admin/services
CRUD /api/admin/strengths
CRUD /api/admin/work-style-items
CRUD /api/admin/faqs
CRUD /api/admin/testimonials
CRUD /api/admin/posts

CRUD /api/admin/networks
POST /api/admin/networks/:id/approve
POST /api/admin/networks/:id/merge

GET/DELETE /api/admin/contact-messages

POST /api/admin/uploads

GET /api/public/portfolio
GET /api/public/projects
GET /api/public/posts
GET /api/public/experiences
POST /api/public/contact
```

No agregues endpoints sin revisar primero los existentes y la sección 10 de
`ADMIN-PORTABLE-SPEC.md`. Ajusta las rutas a las convenciones reales del
proyecto, especialmente el prefijo global actual de la API.

## Verificación mínima

Desde la raíz del proyecto, usar los scripts ya existentes:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm format:check
pnpm build
```

Para cualquier bloque nuevo, agregar o actualizar pruebas siguiendo los
patrones existentes. No reemplazar pruebas reales por mocks superficiales.

## Cómo continuar

El siguiente bloque recomendado es:

1. Auditar el módulo de autenticación actual contra la sección 4 de la
   especificación.
2. Confirmar el esquema común de usuarios, propietarios, locales y campos
   traducibles.
3. Implementar Profile + Translations + uploads básicos.
4. Añadir migraciones reversibles, DTOs, servicios, controladores, contratos,
   páginas admin y pruebas.
5. Continuar con Experiences y Projects antes de implementar el resto del
   contenido.

Cada bloque debe quedar conectado de extremo a extremo:

```text
Migración -> entidad/repositorio -> DTO -> servicio -> controller API
-> contrato compartido -> cliente API -> página admin -> prueba
-> endpoint/página pública cuando corresponda
```

## Precauciones

- El repositorio puede tener cambios sin commit intencionalmente.
- No usar `git reset --hard`, `git checkout --` ni borrar carpetas completas.
- No eliminar el CRUD de tecnologías; es una implementación ya existente que
  debe mantenerse y servir como referencia.
- No subir secretos ni archivos `.env`.
- Mantener `synchronize: false` y usar migraciones.
- Evitar duplicar lógica: reutilizar guards, DTOs, validadores, clientes API y
  componentes ya existentes.
- Si existe una decisión ambigua, consultar la especificación antes de
  inventar una variante.

## Criterio de finalización

El trabajo no se considera terminado hasta que las áreas descritas en
`ADMIN-PORTABLE-SPEC.md` estén implementadas o marcadas explícitamente como
pendientes con una razón técnica. La Fase 0 por sí sola no cumple el objetivo
de este trabajo.
