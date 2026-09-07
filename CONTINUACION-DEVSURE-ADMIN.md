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

### Sesión 2026-09-07 (2) — Módulo Profile

**Objetivo de la sesión:** implementar `GET/PATCH /api/admin/profile` (spec
§5.2, §6.1, §7): identidad editable, contenido traducible (`headline`, `bio`,
`resume`), `activeLocales`/`defaultLocale` y su página admin. Translations y
Uploads quedan para sesiones propias.

**Decisión de diseño:** `admin_users` sigue siendo solo identidad de auth
(username/email/password/role). Se creó una entidad `Profile` 1:1
(`owner_id` único → `admin_users.id`, `ON DELETE CASCADE`) para el contenido
editorial, en vez de mezclarlo en `admin_users`. `GET/PATCH /admin/profile`
combina ambas (permite editar `email` de `AdminUser` además de los campos de
`Profile`) para que el admin no necesite dos llamadas.

**Hallazgo importante (afecta a toda sesión futura que use contratos en
runtime, no solo Profile):** `@devsure/contracts` es un paquete ESM puro
(`"type": "module"`, sin condición `require` en `exports`). Hasta ahora la
API solo importaba **tipos** de ese paquete (`import type`, se borra en
compilación), así que nunca se notó. Este módulo fue el primero en necesitar
un **valor** en tiempo de ejecución (`SUPPORTED_LOCALES`) y eso rompe
`require()` bajo Jest/CommonJS con "Cannot find module '@devsure/contracts'".
Arreglar el build dual CJS/ESM de contracts es una tarea de tooling propia,
fuera de alcance de "un módulo por sesión". Mitigación aplicada: se creó
`apps/api/src/common/locales.ts` con una copia local de `SUPPORTED_LOCALES`
(mismo array, comentado) para uso en tiempo de ejecución dentro de la API; el
contrato compartido sigue siendo la fuente de verdad de cara al resto del
monorepo (web) y para tipado. **Si una sesión futura toca contracts para
exportar otro valor runtime que la API deba consumir, revisar este mismo
problema antes de asumir que `import { X } from '@devsure/contracts'`
funciona en Jest.**

**Cambios realizados:**

- Backend: entidad `Profile`, migración `CreateProfiles`, validador
  reutilizable `IsTranslatableString` (para Translations también), DTOs
  (`UpdateProfileDto`/`ProfileDto`), `ProfileService` (transacción que
  sincroniza `AdminUser.email` + `Profile`, valida
  `defaultLocale ∈ activeLocales`, crea el perfil por defecto en el primer
  `GET` a partir del `username`), `AdminProfileController`
  (`GET/PATCH /api/admin/profile`, mismos guards que technologies/auth).
- Contratos compartidos: `SUPPORTED_LOCALES`, `SupportedLocale`,
  `TranslatableString`, `translateValue()` (helper de fallback de locale,
  aún sin consumidor — lo usará el endpoint público del portfolio),
  `Profile`, `UpdateProfileInput`.
- Frontend: página `/admin/profile`, `ProfileForm` (identidad + tabs de
  locale para headline/bio/resume + checkboxes de idiomas activos + select
  de idioma por defecto), componente reutilizable `<LocaleTabs>` (spec
  §11.2), cliente API (`getProfile`/`updateProfile`). `/admin` y el login
  ahora redirigen a `/admin/profile` (antes `/admin/technologies`), acorde a
  la spec ("no hay dashboard; Profile es la home del panel").
- El campo `avatar` y `resume.<locale>` se editan como **ruta de texto**
  (no hay subida de archivos todavía); el formulario lo indica explícitamente
  para no simular una funcionalidad que no existe.

**Archivos modificados/creados:**

```text
apps/api/src/profile/entities/profile.entity.ts                      (nuevo)
apps/api/src/profile/dto/profile.dto.ts                               (nuevo)
apps/api/src/profile/profile.service.ts                               (nuevo)
apps/api/src/profile/profile.service.spec.ts                          (nuevo)
apps/api/src/profile/admin-profile.controller.ts                      (nuevo)
apps/api/src/profile/profile.module.ts                                (nuevo)
apps/api/src/common/validators/translatable-string.validator.ts       (nuevo)
apps/api/src/common/locales.ts                                        (nuevo)
apps/api/src/database/migrations/1788912000000-CreateProfiles.ts      (nuevo)
apps/api/src/database/migrations/__tests__/1788912000000-CreateProfiles.spec.ts (nuevo)
apps/api/test/profile.e2e-spec.ts                                     (nuevo)
apps/api/src/app.module.ts               (registra ProfileModule + entidad)
apps/api/src/database/data-source.ts     (registra entidad Profile)
packages/contracts/src/index.ts          (SUPPORTED_LOCALES, TranslatableString,
                                           translateValue, Profile, UpdateProfileInput)
apps/web/src/app/admin/(protected)/profile/page.tsx                   (nuevo)
apps/web/src/features/admin/components/profile-form.tsx               (nuevo)
apps/web/src/features/admin/components/locale-tabs.tsx                (nuevo)
apps/web/tests/admin-profile-structure.test.mjs                       (nuevo)
apps/web/src/features/admin/types.ts       (re-exporta Profile/locales)
apps/web/src/features/admin/api/admin-api.ts (getProfile/updateProfile)
apps/web/src/features/admin/components/admin-shell.tsx (nav Profile)
apps/web/src/app/admin/page.tsx            (redirect -> /admin/profile)
apps/web/src/features/admin/components/login-form.tsx (redirect -> /admin/profile)
apps/web/src/features/admin/admin.module.css (estilos .localeTab*)
```

**Nota sobre la ubicación del test de migración:** se colocó en
`database/migrations/__tests__/` y NO directamente en `database/migrations/`
porque `app.module.ts`/`data-source.ts` cargan las migraciones reales con el
glob `database/migrations/*{.ts,.js}` (un solo nivel). Un `.spec.ts` colocado
directamente ahí se ejecuta como si fuera una migración real durante el
arranque de Nest en los tests e2e, y sus `describe/it/beforeEach` explotan
con "Cannot add a test after tests have started running". Cualquier test
nuevo sobre una migración debe ir en esa subcarpeta (el glob de un nivel no
la alcanza), no junto a los archivos de migración.

**Pruebas ejecutadas (todas verdes):**

```text
pnpm --filter @devsure/contracts build
pnpm --filter @devsure/api lint
pnpm --filter @devsure/api typecheck
pnpm --filter @devsure/api test              (25 tests: incluye profile.service.spec.ts
                                               con DB real en memoria y la migración
                                               up/down/up + cascada de borrado)
pnpm --filter @devsure/api test:integration  (29 tests: incluye profile.e2e-spec.ts:
                                               bloqueo por mustChangePassword, 401 sin
                                               sesión, perfil por defecto, 403 sin CSRF,
                                               400 por defaultLocale fuera de
                                               activeLocales, 400 por locale no
                                               soportado en headline, update end-to-end
                                               persistido)
pnpm --filter @devsure/web lint
pnpm --filter @devsure/web typecheck
pnpm --filter @devsure/web test              (falla 1/5, la misma preexistente de la
                                               sesión anterior — ver "Pendientes")
```

No se ejecutó `pnpm test:e2e` (Playwright): no hay spec de Playwright para
`/admin/profile` todavía (mismo hueco que technologies) y levantar el server
completo no era necesario para verificar este módulo end-to-end (ya cubierto
por los e2e de Jest contra la app real).

**Pendientes detectados (no corregidos, fuera de alcance de esta sesión):**

- `apps/web/tests/admin-structure.test.mjs` sigue fallando por el mismo
  motivo preexistente (falta `tests/e2e/admin-technologies.spec.ts`).
- No hay endpoint de subida de archivos: `avatar` y `resume.<locale>` se
  editan como texto libre con la ruta relativa. Es intencional — Uploads es
  su propio módulo (ver "Trabajo pendiente principal" más abajo).
- El endpoint público `GET /api/public/portfolio` (que usaría
  `translateValue()`) no existe todavía; `translateValue` está exportado en
  contracts pero sin consumidor real aún.
- Ningún test cubre todavía `IsTranslatableString` de forma aislada (se
  ejerce indirectamente vía los DTOs de Profile en el e2e); si Translations
  reutiliza el validador, considerar un spec unitario dedicado.

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Implementar **Translations** (`GET/PATCH /api/admin/translations`, spec
§6.2): reutilizar `Profile` (añadir las columnas de headings/intros que
faltan: `heroTag`, `heroTitle/Copy/Note`, `aboutHeading/Body`,
`strengthsHeading/Intro`, etc. — ver spec §5.2) y el mismo patrón de
controller/DTO ya usado en Profile. Reutilizar `IsTranslatableString` y
`SUPPORTED_LOCALES` (desde `apps/api/src/common/locales.ts`, no desde
`@devsure/contracts` directamente — ver la nota sobre el paquete ESM arriba).
Después de Translations, sigue **Uploads** (`POST /api/admin/uploads`) para
poder reemplazar los campos de texto de `avatar`/`resume` por una carga real.

### Sesión 2026-09-07 (3) — Módulo Translations

**Objetivo de la sesión:** implementar `GET/PATCH /api/admin/translations`
(spec §6.2): los 12 bloques de headings/intros editoriales del home
(Hero, About, Strengths, Experience, Education, Portfolio, Skills, Work
style, Testimonials, FAQ, Blog, Contact), reutilizando `Profile` y el
validador `IsTranslatableString` creados en la sesión de Profile.

**Decisión de diseño:** las 22 columnas de headings/intros se añadieron a la
**misma entidad y tabla `profiles`** (no una tabla nueva), porque
`GET/PATCH /admin/translations` es solo otra vista/otro DTO sobre el mismo
registro por owner que ya gestiona Profile (igual que en el `users` original
de la spec, donde todo vive en una sola fila). `TranslationsService` es un
servicio nuevo (no mezclado con `ProfileService`) dentro del mismo
`profile.module.ts`, con su propio `getOrCreate` — se extrajo
`profileDefaults()` a `profile.defaults.ts` para que ambos servicios no
dupliquen los valores por defecto de una fila nueva.

**Cambios realizados:**

- Backend: 22 columnas nuevas en `Profile` (`heroTag` string simple +
  21 campos `TranslatableString`), migración `AddProfileTranslations`,
  `UpdateTranslationsDto`/`TranslationsDto` (reutilizan
  `IsTranslatableString`), `TranslationsService`, `AdminTranslationsController`
  (`GET/PATCH /api/admin/translations`, mismos guards que Profile/auth).
- Contratos compartidos: `Translations`, `UpdateTranslationsInput`.
- Frontend: página `/admin/translations`, `TranslationsForm` con 12
  secciones colapsables (`<details>/<summary>` nativos, sin JS adicional),
  cada una con `<LocaleTabs>` para sus campos traducibles; los tabs usan los
  `activeLocales` del Profile (se pide también `getProfile()` solo para
  leerlos, esa página no los edita). Nav lateral: enlace "Translations"
  entre Profile y Tecnologías. Se extrajo `collectTranslatable()` a
  `lib/translatable-form.ts` para que Profile y Translations no dupliquen
  esa lógica de lectura de FormData.

**Archivos modificados/creados:**

```text
apps/api/src/profile/entities/profile.entity.ts        (+22 columnas)
apps/api/src/profile/profile.defaults.ts                              (nuevo)
apps/api/src/profile/profile.service.ts                 (usa profileDefaults)
apps/api/src/profile/dto/translations.dto.ts                          (nuevo)
apps/api/src/profile/translations.service.ts                          (nuevo)
apps/api/src/profile/translations.service.spec.ts                     (nuevo)
apps/api/src/profile/admin-translations.controller.ts                 (nuevo)
apps/api/src/profile/profile.module.ts                  (registra Translations*)
apps/api/src/database/migrations/1788998400000-AddProfileTranslations.ts (nuevo)
apps/api/src/database/migrations/__tests__/1788998400000-AddProfileTranslations.spec.ts (nuevo)
apps/api/src/database/migrations/__tests__/1788912000000-CreateProfiles.spec.ts
  (dividido en 2 describe: uno solo con CreateProfiles para el up/down/up,
  otro con la migración de translations aplicada para el test de cascada —
  ver nota debajo)
apps/api/test/translations.e2e-spec.ts                                (nuevo)
packages/contracts/src/index.ts                          (Translations,
                                                            UpdateTranslationsInput)
apps/web/src/app/admin/(protected)/translations/page.tsx              (nuevo)
apps/web/src/features/admin/components/translations-form.tsx          (nuevo)
apps/web/src/features/admin/lib/translatable-form.ts                  (nuevo,
  compartido con profile-form.tsx)
apps/web/src/features/admin/components/profile-form.tsx  (usa el helper compartido)
apps/web/src/features/admin/components/admin-shell.tsx   (nav Translations)
apps/web/src/features/admin/admin.module.css              (.collapsible)
apps/web/src/features/admin/types.ts / api/admin-api.ts   (Translations,
  getTranslations/updateTranslations)
apps/web/tests/admin-translations-structure.test.mjs                  (nuevo)
```

**Nota sobre el test de migración dividido:** al añadir las 22 columnas
nuevas a la entidad `Profile`, el test de `CreateProfiles` que hacía
`profiles.save(...)` con un `DataSource` que **no** incluía
`AddProfileTranslations` empezó a fallar con
`SqliteError: table profiles has no column named hero_tag` (TypeORM incluye
todas las columnas de la metadata de la entidad en el INSERT, tengan valor o
no). Se separó en dos `describe`: uno minimalista (solo hasta
`CreateProfiles`) para el ciclo up/down/up de la tabla, y otro con
`AddProfileTranslations` aplicada para las pruebas de integridad de datos.
**Regla para la próxima migración que añada columnas a `profiles`:**
cualquier test que use el `Profile` de TypeORM para guardar/leer filas reales
necesita **todas** las migraciones de `profiles` aplicadas en su
`DataSource`, no solo `CreateProfiles`.

**Pruebas ejecutadas (todas verdes):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (30 tests: incluye
                                               translations.service.spec.ts y el
                                               nuevo spec de la migración de
                                               translations)
pnpm --filter @devsure/api test:integration  (35 tests: incluye
                                               translations.e2e-spec.ts — 401 sin
                                               sesión, default vacío, 403 sin CSRF,
                                               400 por locale no soportado, 400 por
                                               exceder maxLength, update parcial que
                                               no pisa otras secciones, persistencia)
pnpm --filter @devsure/web lint / typecheck
pnpm --filter @devsure/web test              (falla 1/6, la misma preexistente ya
                                               documentada — no relacionada)
```

No se ejecutó `pnpm test:e2e` (Playwright): mismo motivo que en las sesiones
anteriores (sin spec de Playwright para `/admin/*` más allá del hueco
preexistente de technologies).

**Pendientes detectados (no corregidos, fuera de alcance de esta sesión):**

- `apps/web/tests/admin-structure.test.mjs` sigue fallando por el mismo
  motivo preexistente (falta `tests/e2e/admin-technologies.spec.ts`).
- `translateValue()` (contracts) sigue sin consumidor real: lo usará
  `GET /api/public/portfolio` cuando se implemente (Fase 2).
- El campo `heroTag` no es traducible por diseño (así lo define la spec);
  si en el futuro se decide traducirlo, requiere migración + DTO nuevos.

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Con Fase 1 (Fundamentos administrativos) esencialmente completa (auth por
username, Profile, Translations; falta solo Uploads), el orden sugerido por
la spec es continuar con **Uploads** (`POST /api/admin/uploads`, spec §8)
para poder reemplazar los campos de texto de `avatar`/`resume` en Profile por
una carga real de archivos — o, alternativamente, saltar directo a
**Experiences** (Fase 2, primer contenido "core") si se prefiere posponer
Uploads hasta que Projects lo necesite también (galerías, covers). Cualquiera
de las dos es un módulo autocontenido válido; recomendamos Uploads primero
porque Profile ya tiene los campos esperando la integración.

### Sesión 2026-09-07 (4) — Módulo Uploads

**Objetivo de la sesión:** implementar `POST /api/admin/uploads` (spec §8,
§10.6) y reemplazar los campos de texto de `avatar`/`resume` en Profile por
carga real de archivos, con el componente reutilizable `<FileUploadField>`
que ya preveía la spec (§11.2).

**⚠️ Hallazgo crítico, preexistente, fuera de alcance de esta sesión —
`pnpm --filter @devsure/web build` está roto ahora mismo:**

Al ejecutar por primera vez (en ninguna de las 3 sesiones previas se había
corrido) `pnpm --filter @devsure/web build`, falla con un error de webpack
en `apps/web/src/features/admin/admin.module.css` líneas 1-15 (código que
**no toqué en ninguna sesión** — es parte del scaffolding original del panel
admin, previo a mi participación):

```
Selector ":global(body:has(.adminRoot) > .site-header), ..." is not pure
(pure selectors must contain at least one local class or id)
```

Causa raíz doble:
1. css-loader exige que todo selector en un `.module.css` tenga al menos un
   token local fuera de `:global(...)`; aquí los tres selectores están
   100% envueltos en `:global(...)`, así que el build falla directamente.
2. Aunque compilara, esas reglas ya eran **no funcionales**: usan la clase
   literal `.adminRoot` dentro de `:global()`, pero CSS Modules hashea el
   nombre real (`styles.adminRoot` se renderiza como algo tipo
   `adminRoot_a1b2c3`), así que `:has(.adminRoot)` nunca matchea el DOM real.
   Es decir, la lógica que debía ocultar el header/footer/skip-link públicos
   dentro de `/admin` nunca funcionó como CSS Module.

**No lo arreglé** porque la solución correcta no es un one-liner: implica
decidir si esa hoja de estilos "global" sale del `.module.css` (a un CSS
plano importado en el layout) o si el ocultamiento del chrome público se
resuelve en `layout.tsx` sin CSS. Es una decisión de arquitectura de la capa
de layout admin, no de Uploads. **Recomendación: la próxima sesión que toque
el layout/estilos del admin debe resolver esto antes de nada más — el
`pnpm build` de la raíz también fallará mientras esto no se arregle.**
Mientras tanto, verifiqué el módulo de Uploads con lint/typecheck/unit/
integración (todo real, contra la app real), y con `pnpm --filter @devsure/api
build` (sí pasa) — pero **no pude confirmar el build de producción de
`apps/web`** por este bug ajeno.

**Cambios realizados:**

- Backend: `UploadsModule` con `StorageService` (disco local, uuid + carpeta
  por tipo de contenido) y `UploadsService` (valida mimetype y tamaño por
  carpeta contra la tabla del spec §8: avatars 2MB, resumes 5MB PDF,
  experiences/logos 2MB, projects/covers 4MB, projects/gallery 4MB,
  studies/logos 2MB, testimonials 1MB, posts/covers 4MB, network-icons
  512KB SVG/PNG), `AdminUploadsController`
  (`POST /api/admin/uploads`, multipart, mismos guards). Se sirven los
  archivos en `/storage/*` vía `express.static` en `bootstrap.ts`, con
  `Cross-Origin-Resource-Policy: cross-origin` solo en esa ruta (el resto de
  la API conserva el `same-origin` por defecto de helmet) para que el sitio
  público (otro origen) pueda incrustar las imágenes.
- Se agregaron `multer` (dependency) y `@types/multer` (devDependency) a
  `apps/api` — antes solo llegaban transitivamente vía
  `@nestjs/platform-express` y pnpm no los exponía para `require()` directo.
- Config: `UPLOADS_DIR` (env, default `./.data/uploads`) en
  `env.validation.ts`/`configuration.ts`/`.env.example` (raíz y
  `apps/api/.env.example`).
- Contratos compartidos: `UploadFolder` (unión de los 9 folders) y
  `UploadResult { path, url }` — **solo tipos** (`import type` en todo el
  API), a propósito, para no repetir el problema ESM/CJS de
  `SUPPORTED_LOCALES` documentado en la sesión de Profile; el mapa de
  configuración por carpeta (tamaños/mimetypes) vive solo en la API
  (`upload-folders.ts`), no en contracts, porque es un detalle de
  implementación del backend.
- Frontend: `<FileUploadField>` reutilizable (spec §11.2: sube al elegir el
  archivo, guarda el `path` devuelto en un input oculto, se integra con el
  patrón de formulario no controlado + `FormData` ya usado en Profile/
  Translations sin tocar `formDataToInput`). Se integró en `ProfileForm`:
  el campo de avatar y el CV por locale ahora son cargas reales, no texto
  libre. Se corrigió `admin-api.ts` para no forzar
  `Content-Type: application/json` cuando el body es `FormData` (si no, el
  navegador no podía fijar el boundary multipart correcto).

**Archivos modificados/creados:**

```text
apps/api/src/uploads/upload-folders.ts                                (nuevo)
apps/api/src/uploads/dto/upload.dto.ts                                (nuevo)
apps/api/src/uploads/storage.service.ts                               (nuevo)
apps/api/src/uploads/storage.service.spec.ts                          (nuevo)
apps/api/src/uploads/uploads.service.ts                               (nuevo)
apps/api/src/uploads/uploads.service.spec.ts                          (nuevo)
apps/api/src/uploads/admin-uploads.controller.ts                      (nuevo)
apps/api/src/uploads/uploads.module.ts                                (nuevo)
apps/api/test/uploads.e2e-spec.ts                                     (nuevo)
apps/api/src/app.module.ts                (registra UploadsModule)
apps/api/src/bootstrap.ts                 (sirve /storage, CORP cross-origin)
apps/api/src/config/env.validation.ts     (UPLOADS_DIR)
apps/api/src/config/configuration.ts      (storage.uploadsDir)
apps/api/package.json                     (multer, @types/multer)
.env.example / apps/api/.env.example      (UPLOADS_DIR)
packages/contracts/src/index.ts           (UploadFolder, UploadResult)
apps/web/src/features/admin/components/file-upload-field.tsx          (nuevo)
apps/web/src/features/admin/components/profile-form.tsx  (usa FileUploadField)
apps/web/src/features/admin/api/admin-api.ts (uploadFile, fix Content-Type
                                               para FormData)
apps/web/src/features/admin/types.ts      (UploadFolder, UploadResult)
apps/web/src/features/admin/admin.module.css (.uploadPath, .uploadError)
apps/web/tests/admin-uploads-structure.test.mjs                       (nuevo)
```

**Pruebas ejecutadas:**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (40 tests: incluye
                                               storage.service.spec.ts —
                                               escribe en un tmpdir real y lo
                                               limpia — y uploads.service.spec.ts
                                               con las 9 carpetas/reglas)
pnpm --filter @devsure/api test:integration  (42 tests: incluye
                                               uploads.e2e-spec.ts — 401/403/
                                               400 folder inválido/415 mimetype/
                                               413 tamaño/201 + servido real en
                                               /storage con verificación del
                                               header CORP)
pnpm --filter @devsure/api build             (nest build — verde)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web test              (falla 1/7, la misma preexistente
                                               ya documentada)
pnpm --filter @devsure/web build             (FALLA — ver hallazgo crítico
                                               arriba, no relacionado con
                                               Uploads)
```

**Pendientes detectados:**

- **Crítico, primero en la cola:** arreglar `admin.module.css` para que
  `pnpm build` vuelva a pasar (ver hallazgo arriba).
- `apps/web/tests/admin-structure.test.mjs` sigue con el mismo hueco de
  siempre (falta el e2e de Playwright de technologies).
- No hay borrado de archivos huérfanos: si un admin reemplaza un avatar, el
  archivo viejo queda en disco. Aceptable para MVP (spec no lo pide), pero
  documentarlo para cuando exista un job de limpieza.

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

1. Primero, una sesión corta y aislada para arreglar el build roto de
   `admin.module.css` (ver hallazgo crítico).
2. Luego, con Fase 1 completa (auth, Profile, Translations, Uploads),
   continuar con **Experiences** (Fase 2, spec §5.3, §6.3): CRUD con
   `levels` (repeater anidado con traducciones), `owner_id`, y reutilizar
   `<FileUploadField>` para `logo` (carpeta `experiences-logos`).

### Sesión 2026-09-07 (5) — Fix: build roto de `admin.module.css` + bug real de chrome público en `/admin`

**Objetivo de la sesión:** arreglar el `pnpm --filter @devsure/web build`
roto que dejé documentado como bloqueante al final de la sesión de Uploads,
antes de tocar Experiences.

**Lo que encontré al investigar (más grave que un simple error de build):**
las reglas `:global(body:has(.adminRoot) > .site-header), ...` en
`admin.module.css` intentaban ocultar el header/footer/skip-link públicos
cuando se está en `/admin/*`. Pero:
1. Nunca eran válidas para CSS Modules (selectores 100% `:global`, sin
   ningún token local — de ahí el error "not pure" que rompía el build).
2. Aunque compilaran, **nunca habrían funcionado en runtime**: CSS Modules
   hashea `.adminRoot` (p. ej. a `adminRoot_a1b2c3`), pero el selector usaba
   el string literal `adminRoot` dentro de `:global()`, que no matchea el
   DOM real.

Conclusión: el panel `/admin/*` **siempre se ha renderizado con el header y
el footer del sitio público envolviéndolo**, desde que existe el scaffolding
del admin (antes de mi primera sesión). No es solo un build roto: es una
funcionalidad que nunca funcionó.

**Decisión de diseño y arreglo:** en vez de parchear el selector CSS, se
resolvió donde corresponde — en React, por ruta. Se creó
`src/components/site-chrome.tsx` (client component, `usePathname()`): si la
ruta empieza con `/admin`, renderiza solo `<main>{children}</main>` (el panel
ya trae su propio layout completo vía `AdminShell`); si no, renderiza
skip-link + `SiteHeader` + `main` + `SiteFooter` como antes. `app/layout.tsx`
ahora delega en `<SiteChrome>` en vez de tener esa lógica inline. Se
eliminaron las 3 reglas `:global(...)` rotas de `admin.module.css` (ya
redundantes: `.adminRoot` ya define `min-height: 100vh` y su propio fondo).

**Verificado con un servidor real** (`next build` + `next start`, no solo
tests): `curl` a `/` trae `class="site-header"`; `curl` a `/admin/login` ya
no lo trae. Confirma que el fix funciona en runtime, no solo en el test
estructural.

**Archivos modificados/creados:**

```text
apps/web/src/components/site-chrome.tsx                               (nuevo)
apps/web/src/app/layout.tsx               (usa <SiteChrome>, ya no arma el
                                            chrome público inline)
apps/web/src/features/admin/admin.module.css (quita las 3 reglas :global rotas)
apps/web/tests/app-structure.test.mjs     (el assert de "Saltar al contenido"
                                            ahora lee site-chrome.tsx, que es
                                            donde vive esa marca; se agregó un
                                            assert de que decide por pathname)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm lint                    (turbo, 4 paquetes)
pnpm typecheck                (turbo, 4 paquetes)
pnpm test                     (contracts + api 40/40 verdes; web falla 1/7,
                               el mismo hueco preexistente de siempre —
                               admin-technologies.spec.ts de Playwright que
                               nunca se creó, no relacionado)
pnpm test:integration         (api, 42/42 verdes, sin cambios de este fix)
pnpm --filter @devsure/web build   ✅ AHORA PASA (antes fallaba)
pnpm build (raíz, turbo, los 3 paquetes con build)  ✅ AHORA PASA
```

**Gap adicional encontrado (no corregido, informado según AGENTS.md
"informa el vacío"):** `pnpm format:check` falla en ~80 archivos, la gran
mayoría **preexistentes y ajenos a mis 5 sesiones** (todo `Portfolio/`, los
archivos de `10k-websites-skill/`, y también archivos base del admin que ya
estaban sin formatear antes de que yo los tocara, como
`auth.controller.ts`/`admin-technologies.controller.ts`). Nunca se ha
ejecutado `pnpm format` en este repo. No corrí `prettier --write` porque
reformatear esos archivos mezclaría cambios de estilo masivos y ajenos con
los diffs semánticos de cada slice, y tocaría `Portfolio/` (fuera de
alcance). **Recomendación:** una sesión dedicada y explícitamente pedida por
el usuario para correr `pnpm format` sobre `apps/` y `packages/` (nunca sobre
`Portfolio/`, que es la especificación de referencia, no código del
proyecto).

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Con la Fase 1 completa y el build verde, continuar con **Experiences**
(Fase 2, spec §5.3, §6.3): entidad con `levels` (repeater anidado
traducible), CRUD `owner_id`-scoped, y reutilizar `<FileUploadField>` para
`logo` (carpeta `experiences-logos`, ya soportada en `upload-folders.ts`).

### Sesión 2026-09-07 (6) — Módulo Experiences (primer contenido "core", Fase 2)

**Objetivo de la sesión:** implementar el CRUD completo de `Experiences`
(spec §5.3, §6.3) con `owner_id`-scoping real, `levels[]` (repeater anidado
con descripción e `highlights` traducibles), `tech_stack` y `logo`. Es el
primer módulo de Fase 2 y el primer contenido con múltiples registros por
owner (a diferencia de Profile/Translations, que son una fila por owner).

**Decisiones de diseño:**

- `Experience.slug` es único **globalmente** (no compuesto con `owner_id`),
  igual que `Technology.slug` — consistente con el patrón ya existente en el
  proyecto y con la redacción literal de la spec ("string unique").
- `levels`/`summary`/`techStack` se guardan como `simple-json` en la entidad
  (mismo patrón que `Profile`). `levels` es la primera estructura JSON
  **anidada** del proyecto (objetos con un array de objetos traducibles
  dentro) — se validó con `@ValidateNested({ each: true }) @Type(() =>
  ExperienceLevelDto)` más el validador `IsTranslatableString` ya existente,
  reutilizado también para `highlights` gracias a la opción `each: true` que
  `class-validator` aplica automáticamente a elementos de array.
- **El formulario de admin es controlado (state de React), no
  `FormData`/no controlado como Profile-Translations-Technologies.** Es la
  primera vez que se necesita: `levels[]` tiene longitud dinámica y cada
  nivel tiene a su vez un array `highlights[]` de longitud dinámica con
  objetos traducibles — no hay forma limpia de representar eso con nombres de
  campo planos en `FormData`. Se construyeron dos componentes reutilizables
  nuevos exigidos por la spec §11.2 para esto: `<RepeaterField>` (genérico,
  add/remove, usado tanto para `levels` como para `highlights` dentro de cada
  nivel) y `<TagsInput>` (para `tech_stack`). `<LocaleTabs>` (de la sesión de
  Profile) se reutilizó sin cambios. `<FileUploadField>` se extendió con un
  callback `onUploaded` opcional para poder usarse en un formulario
  controlado (antes solo soportaba `hiddenName` para formularios con
  `FormData`); `ProfileForm` sigue funcionando igual, sin cambios de
  comportamiento.
- Se extrajo `apps/api/src/common/slugify.ts` (con tests) como utilidad
  compartida — la reutilizarán Projects/Posts/Networks cuando lleguen (regla
  de negocio #3 de la spec: slug auto-generado si viene vacío).
- **No se implementó bulk delete** (`DELETE /api/admin/{entity}` con
  `{ids:[]}`, spec §10.3): Technologies, el módulo de referencia existente,
  tampoco lo tiene. Se mantuvo la paridad con el patrón ya establecido en vez
  de introducir uno nuevo solo para Experiences.
- **No se implementó el endpoint público** (`GET /api/public/experiences/:slug`):
  la propia spec lo ubica después de todo el contenido "core" (Experiences +
  Projects + Studies + Skills + Services), no como parte de Experiences en
  solitario.

**Archivos modificados/creados:**

```text
apps/api/src/common/slugify.ts                                        (nuevo)
apps/api/src/common/slugify.spec.ts                                    (nuevo)
apps/api/src/experiences/entities/experience.entity.ts                (nuevo)
apps/api/src/experiences/dto/experience-level.dto.ts                  (nuevo)
apps/api/src/experiences/dto/experience.dto.ts                        (nuevo)
apps/api/src/experiences/dto/list-experiences-query.dto.ts            (nuevo)
apps/api/src/experiences/experiences.service.ts                       (nuevo)
apps/api/src/experiences/experiences.service.spec.ts                  (nuevo)
apps/api/src/experiences/admin-experiences.controller.ts              (nuevo)
apps/api/src/experiences/experiences.module.ts                        (nuevo)
apps/api/src/database/migrations/1789084800000-CreateExperiences.ts   (nuevo)
apps/api/src/database/migrations/__tests__/1789084800000-CreateExperiences.spec.ts (nuevo)
apps/api/test/experiences.e2e-spec.ts                                 (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (Experience, ExperienceInput,
                                            ExperienceLevel)
apps/web/src/app/admin/(protected)/experiences/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/experience-list.tsx            (nuevo)
apps/web/src/features/admin/components/experience-form.tsx            (nuevo)
apps/web/src/features/admin/components/repeater-field.tsx             (nuevo)
apps/web/src/features/admin/components/tags-input.tsx                 (nuevo)
apps/web/src/features/admin/components/file-upload-field.tsx (+onUploaded)
apps/web/src/features/admin/components/admin-shell.tsx    (nav Experiencias)
apps/web/src/features/admin/api/admin-api.ts (listExperiences/getExperience/
                                               createExperience/updateExperience/
                                               deleteExperience)
apps/web/src/features/admin/types.ts       (Experience*, ExperiencePage)
apps/web/src/features/admin/admin.module.css (.tagsInput, .tag, .repeater*,
                                               .highlightsLabel)
apps/web/tests/admin-experiences-structure.test.mjs                   (nuevo)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (53 tests: incluye
                                               slugify.spec.ts,
                                               experiences.service.spec.ts —
                                               auto-slug, slug explícito,
                                               conflicto de slug entre owners,
                                               round-trip de levels/highlights
                                               por JSON, scoping por owner en
                                               list/get/update/delete — y la
                                               migración up/down/up + cascada)
pnpm --filter @devsure/api test:integration  (48 tests: incluye
                                               experiences.e2e-spec.ts — 401,
                                               400 sin levels, 400 locale no
                                               soportado en description, 201
                                               con auto-slug, 409 slug
                                               duplicado, list/update/delete
                                               end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web build             ✅ (incluye las 3 rutas nuevas
                                               de experiences)
pnpm --filter @devsure/web test              (falla 1/8, la misma preexistente
                                               ya documentada, nada nuevo roto)
pnpm build (raíz, turbo)                     ✅
```

**Pendientes detectados:**

- Mismo hueco preexistente de siempre en `admin-structure.test.mjs`
  (Playwright de technologies nunca creado).
- `pnpm format:check` sigue con el mismo hueco preexistente amplio ya
  documentado (no se agrandó: los archivos nuevos de esta sesión también
  saldrían sin formatear si se corriera `prettier --write` sobre todo el
  repo, pero es el mismo problema de fondo, no uno nuevo).
- Falta el endpoint público de portfolio (a propósito, ver spec §14 Fase 2).
- No hay reordenamiento drag-and-drop de `levels`/`highlights` en
  `<RepeaterField>` — solo añadir al final y eliminar. La spec no lo exige
  explícitamente; `sort_order` a nivel de Experience sí existe y se respeta.

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Con Experiences funcionando de punta a punta, seguir con **Projects**
(spec §5.4, §6.4) — es más grande que Experiences (`apps`, `gallery`,
`experience_id` opcional, `featured` con tope de 3, `published_at` draft) y
puede reutilizar directamente `<RepeaterField>` (para `apps`),
`<TagsInput>` (`tech_stack`) y `<FileUploadField>` (`projects-covers`,
`projects-gallery` — esta última necesitará soporte de **múltiples**
archivos, hoy `<FileUploadField>` solo maneja uno; revisar si conviene
extenderlo o crear una variante antes de construir el formulario de
Projects).

### Sesión 2026-09-07 (7) — Módulo Projects

**Objetivo de la sesión:** implementar el CRUD completo de `Projects`
(spec §5.4, §6.4) con `apps[]` (multi-app repeater), galería de imágenes
múltiple y reordenable, `experience_id` opcional validado contra las
experiencias del propio owner, y la regla de negocio de `featured` con tope
de 3 (spec §9 regla 4).

**Decisiones de diseño:**

- `Project.title` es traducible (`TranslatableString`), a diferencia de
  `Experience.company` (string plano) — el auto-slug ahora usa
  `firstTranslatableValue()` (nuevo helper en `common/slugify.ts`, con
  tests) sobre la primera traducción no vacía, tal como pide la spec
  ("Auto desde primera traducción de title").
- `experience_id` es FK nullable con `onDelete: 'SET NULL'` (no `CASCADE`):
  si se borra una experiencia, sus proyectos quedan como "Personal" en vez
  de borrarse — verificado con un test de migración dedicado.
- El servicio valida que `experienceId` (si viene) pertenezca al mismo
  `ownerId` antes de guardar (`BadRequestException` si no), replicando el
  mismo patrón de aislamiento por owner que ya usa Experiences, ahora entre
  dos entidades relacionadas.
- **Regla de `featured` (máx. 3, desmarcar el más antiguo por
  `updated_at DESC, id DESC`)**: implementada en `enforceFeaturedCap()`,
  que se ejecuta después de persistir cualquier proyecto con
  `featured: true`. Se descubrió en el test unitario que **sqlite trunca
  `datetime` a resolución de segundo** (aunque TypeORM genera el valor con
  precisión de milisegundo en JS) — el primer intento del test con
  separaciones de 5ms entre creaciones fallaba por empates de timestamp.
  Se corrigió usando separaciones de ~1.1s en el test unitario
  (determinista) y se relajó la aserción del e2e correspondiente (que sí
  puede tener timestamps empatados entre requests rápidos) para verificar
  solo el invariante (`total <= 3`), no qué proyecto específico quedó
  desmarcado — esa semántica exacta ya está cubierta de forma determinista
  en el test unitario. **Cualquier función futura que dependa del orden por
  `updated_at` en sqlite debe tener esto en cuenta.**
- Se creó `IsStringRecord` (nuevo validador, hermano de
  `IsTranslatableString`) para `ProjectApp.links` — un `Record<string,string>`
  sin el conjunto de claves fijo de un locale (claves libres tipo
  `"Live"`/`"Code"`).
- **Se resolvió la subida de múltiples archivos** (pendiente explícito de
  la sesión anterior): se creó `<GalleryField>`, hermano de
  `<FileUploadField>` pero para arrays — sube cada archivo seleccionado
  (input con `multiple`) por separado contra el mismo
  `POST /admin/uploads`, y permite reordenar con botones ↑/↓ (sin
  drag-and-drop, consistente con el resto del panel que no usa librerías
  extra) y quitar. No se modificó `<FileUploadField>` para esto — es un
  caso de uso genuinamente distinto (una ruta vs. un array de rutas).
- El campo `published_at` se editó como `<input type="datetime-local">`
  (vacío = borrador), acorde a `<DraftPublishField>` de la spec §11.2.

**Archivos modificados/creados:**

```text
apps/api/src/common/validators/string-record.validator.ts             (nuevo)
apps/api/src/common/slugify.ts (+firstTranslatableValue, con tests)
apps/api/src/projects/entities/project.entity.ts                      (nuevo)
apps/api/src/projects/dto/project-app.dto.ts                          (nuevo)
apps/api/src/projects/dto/project.dto.ts                              (nuevo)
apps/api/src/projects/dto/list-projects-query.dto.ts                  (nuevo)
apps/api/src/projects/projects.service.ts                             (nuevo)
apps/api/src/projects/projects.service.spec.ts                        (nuevo)
apps/api/src/projects/admin-projects.controller.ts                    (nuevo)
apps/api/src/projects/projects.module.ts                              (nuevo)
apps/api/src/database/migrations/1789171200000-CreateProjects.ts      (nuevo)
apps/api/src/database/migrations/__tests__/1789171200000-CreateProjects.spec.ts (nuevo)
apps/api/test/projects.e2e-spec.ts                                    (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (Project, ProjectApp, ProjectInput)
apps/web/src/app/admin/(protected)/projects/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/project-list.tsx               (nuevo)
apps/web/src/features/admin/components/project-form.tsx               (nuevo)
apps/web/src/features/admin/components/gallery-field.tsx              (nuevo)
apps/web/src/features/admin/components/admin-shell.tsx    (nav Proyectos)
apps/web/src/features/admin/api/admin-api.ts (listProjects/getProject/
                                               createProject/updateProject/
                                               deleteProject)
apps/web/src/features/admin/types.ts       (Project*, ProjectPage)
apps/web/src/features/admin/admin.module.css (.gallery, .galleryItem*)
apps/web/tests/admin-projects-structure.test.mjs                      (nuevo)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (66 tests: incluye
                                               projects.service.spec.ts —
                                               auto-slug desde title,
                                               experienceId ajeno rechazado,
                                               experienceId propio aceptado,
                                               draft por defecto, filtros
                                               (owner/experienceId/featured/
                                               published), tope de featured
                                               con separación real de 1.1s —
                                               y la migración up/down/up +
                                               cascada + SET NULL de
                                               experience_id)
pnpm --filter @devsure/api test:integration  (55 tests: incluye
                                               projects.e2e-spec.ts — 401,
                                               400 título vacío, 400 URL sin
                                               protocolo, 400 demasiados
                                               links, 201 draft con
                                               auto-slug, 400 experienceId
                                               inexistente, tope de featured
                                               + publicar + borrar end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web build             ✅ (incluye las 3 rutas nuevas
                                               de projects)
pnpm --filter @devsure/web test              (falla 1/9, la misma
                                               preexistente ya documentada)
pnpm build (raíz, turbo)                     ✅
```

**Pendientes detectados:**

- Mismo hueco preexistente de siempre (`admin-structure.test.mjs`).
- El listado de Projects hace una segunda llamada (`listExperiences`) solo
  para mostrar el nombre de la experiencia asociada — aceptable para el
  tamaño esperado de datos (owner único, pocas decenas de experiencias como
  mucho), pero si el catálogo público crece mucho convendría que el backend
  devuelva el nombre embebido en vez de resolverlo en el cliente.
- No hay borrado de archivos huérfanos al quitar una imagen de la galería o
  reemplazar la portada (mismo pendiente ya anotado en la sesión de
  Uploads).

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Seguir con **Studies** (Education) — spec §5.5, más pequeño que
Experiences/Projects (sin repeaters anidados: institution, title
traducible, field, description traducible, fechas, in_progress, logo). Es
un buen candidato para cerrar rápido antes de Skills y Services (aún más
simples) y llegar al hito de la spec: "Endpoint público completo del
portfolio" (Fase 2, item 8), que requiere que Experiences + Projects +
Studies + Skills + Services ya existan.

### Sesión 2026-09-07 (8) — Módulo Studies (Education)

**Objetivo de la sesión:** implementar el CRUD completo de `Studies` (spec
§5.5, §6.5) — el primer módulo "CRUD estándar" sin repeaters anidados, slug,
ni reglas de negocio especiales (a diferencia de Experiences/Projects).

**Decisión de diseño — vuelta al patrón `FormData` no controlado:**
`Study` no tiene ningún array de longitud dinámica (no hay `levels`, `apps`,
`gallery`, `tech_stack` en la spec de este recurso), así que el formulario
de admin **no necesita ser un componente controlado** como
`ExperienceForm`/`ProjectForm`. Se construyó igual que `ProfileForm`/
`TranslationsForm`: `<form>` no controlado + `FormData` + `<LocaleTabs>` +
`<FileUploadField>` (modo `hiddenName`, sin `onUploaded`). Solo se usa
`useState` local para una cosa puntual de UX (deshabilitar `endDate` cuando
`inProgress` está marcado), no para todo el formulario. El test estructural
de esta sesión incluye una aserción negativa explícita
(`doesNotMatch(form, /RepeaterField|TagsInput/)`) para que quede registrado
que esta simplicidad es intencional, no un olvido.

**Otras decisiones:**

- Sin slug: la tabla `studies` de la spec no lo incluye (a diferencia de
  Experience/Project/Network/Post), así que no hay lógica de unicidad ni
  `ConflictException` en este servicio — el `save()` es un simple
  `repository.save()`.
- Regla de consistencia `inProgress` ⇒ `endDate = null`: aplicada tanto en
  `create` como en `update` (incluyendo el caso de marcar `inProgress: true`
  sin tocar `endDate` en un PATCH parcial — cubierto explícitamente en el
  test unitario).
- Orden de listado: `sortOrder ASC, startDate DESC, id ASC` (coherente con
  cómo el front público mostrará educación más reciente primero dentro del
  mismo `sortOrder`, igual que describe la spec §12 para el home).

**Archivos modificados/creados:**

```text
apps/api/src/studies/entities/study.entity.ts                         (nuevo)
apps/api/src/studies/dto/study.dto.ts                                 (nuevo)
apps/api/src/studies/dto/list-studies-query.dto.ts                    (nuevo)
apps/api/src/studies/studies.service.ts                               (nuevo)
apps/api/src/studies/studies.service.spec.ts                          (nuevo)
apps/api/src/studies/admin-studies.controller.ts                      (nuevo)
apps/api/src/studies/studies.module.ts                                (nuevo)
apps/api/src/database/migrations/1789257600000-CreateStudies.ts       (nuevo)
apps/api/src/database/migrations/__tests__/1789257600000-CreateStudies.spec.ts (nuevo)
apps/api/test/studies.e2e-spec.ts                                     (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (Study, StudyInput)
apps/web/src/app/admin/(protected)/studies/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/study-list.tsx                 (nuevo)
apps/web/src/features/admin/components/study-form.tsx                 (nuevo)
apps/web/src/features/admin/components/admin-shell.tsx    (nav Educación)
apps/web/src/features/admin/api/admin-api.ts (listStudies/getStudy/
                                               createStudy/updateStudy/
                                               deleteStudy)
apps/web/src/features/admin/types.ts       (Study, StudyPage)
apps/web/tests/admin-studies-structure.test.mjs                       (nuevo)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (73 tests: incluye
                                               studies.service.spec.ts —
                                               defaults, inProgress limpia
                                               endDate en create Y en update
                                               parcial, scoping por owner —
                                               y la migración up/down/up +
                                               cascada)
pnpm --filter @devsure/api test:integration  (59 tests: incluye
                                               studies.e2e-spec.ts — 401,
                                               400 título vacío, 201 con
                                               inProgress limpiando endDate,
                                               list/update/delete end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web build             ✅ (incluye las 3 rutas nuevas
                                               de studies)
pnpm --filter @devsure/web test              (falla 1/10, la misma
                                               preexistente ya documentada)
pnpm build (raíz, turbo)                     ✅
```

**Pendientes detectados:** mismo hueco preexistente de siempre
(`admin-structure.test.mjs`). Nada nuevo.

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Seguir con **Skills** (spec §5.6) — más simple todavía que Studies: solo
`name`, `category` (enum sugerido: Languages, Frameworks, Databases, Tools,
Cloud, Methodology), `sort_order`. Sin campos traducibles siquiera, así que
el formulario puede ser aún más directo. Después de Skills, **Services**
(spec §5.7, con `title`/`description` traducibles e `icon`) completa la
lista de contenido "core" que la spec exige antes del endpoint público del
portfolio (Fase 2, item 8).

### Sesión 2026-09-07 (9) — Módulo Services

**Objetivo de la sesión:** implementar el CRUD completo de `Services` (spec
§5.7) — primer paso del plan acordado con el usuario ("Services →
Strengths → WorkStyleItems → Faqs, luego el endpoint público, luego el
rediseño visual"). Es el módulo más simple hasta ahora: `title`/
`description` traducibles **obligatorios**, `icon` (clase Themify) opcional,
`sort_order`. Sin fechas, sin uploads, sin slug, sin reglas de negocio
especiales.

**Se mantuvo el patrón `FormData` no controlado** (como Studies) —
`ServiceForm` es aún más corto que `StudyForm` porque no hay ni siquiera un
`useState` local para UX (no hay ningún campo condicional). El test
estructural incluye la misma aserción negativa que Studies
(`doesNotMatch(form, /RepeaterField|TagsInput|FileUploadField/)`) para dejar
constancia de que la simplicidad es intencional.

**Nota operativa (no un problema de código):** al correr
`pnpm --filter @devsure/web build` para verificar esta sesión, falló con
`EPERM` sobre `apps/web/.next/trace`. Investigué antes de asumir que era un
bug: **son los propios servidores de desarrollo del usuario corriendo en
paralelo** (`pnpm --filter @devsure/api start:dev` y
`pnpm --filter @devsure/web dev`, arrancados ~4:01pm, probablemente
mientras probaba el login que configuramos en la sesión anterior) — el
`next dev` activo tiene el `.next` abierto y choca con `next build`. **No
maté esos procesos** (podrían ser el entorno de trabajo activo del usuario).
Se compensó verificando lint + typecheck + unit + integración (ambos
verdes), pero **el build de producción de `apps/web` no se confirmó en esta
sesión** por este motivo externo — no por un error introducido. Si la
siguiente sesión también encuentra esto, avisar al usuario en vez de matar
procesos sin preguntar.

**Archivos modificados/creados:**

```text
apps/api/src/services/entities/service.entity.ts                      (nuevo)
apps/api/src/services/dto/service.dto.ts                              (nuevo)
apps/api/src/services/dto/list-services-query.dto.ts                  (nuevo)
apps/api/src/services/services.service.ts                             (nuevo)
apps/api/src/services/services.service.spec.ts                        (nuevo)
apps/api/src/services/admin-services.controller.ts                    (nuevo)
apps/api/src/services/services.module.ts                              (nuevo)
apps/api/src/database/migrations/1789344000000-CreateServices.ts      (nuevo)
apps/api/src/database/migrations/__tests__/1789344000000-CreateServices.spec.ts (nuevo)
apps/api/test/services.e2e-spec.ts                                    (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (Service, ServiceInput)
apps/web/src/app/admin/(protected)/services/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/service-list.tsx               (nuevo)
apps/web/src/features/admin/components/service-form.tsx               (nuevo)
apps/web/src/features/admin/components/admin-shell.tsx    (nav Servicios)
apps/web/src/features/admin/api/admin-api.ts (listServices/getService/
                                               createService/updateService/
                                               deleteService)
apps/web/src/features/admin/types.ts       (ServiceContent, ServicePage —
                                             alias para no chocar con el
                                             nombre genérico `Service`)
apps/web/tests/admin-services-structure.test.mjs                      (nuevo)
```

**Pruebas ejecutadas:**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (80 tests: incluye
                                               services.service.spec.ts y su
                                               migración up/down/up + cascada)
pnpm --filter @devsure/api test:integration  (64 tests: incluye
                                               services.e2e-spec.ts — 401,
                                               400 descripción vacía, 400
                                               ícono con formato inválido,
                                               201, list/update/delete
                                               end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web test              (falla 1/11, la misma
                                               preexistente ya documentada)
pnpm --filter @devsure/web build             NO EJECUTADO ESTA VEZ — ver
                                              nota operativa arriba
```

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Seguir con **Strengths** (spec §5.8) — según el plan acordado con el
usuario. Mapea casi 1:1 a la sección "Por qué elegirnos" de
`Portfolio/imagenBase.png`: `label` + `title` + `body` traducibles,
`tech_stack` opcional (reutilizar `<TagsInput>`), `sort_order`. Mismo patrón
`FormData` no controlado que Services/Studies (sin arrays anidados
dinámicos salvo el `tech_stack`, que ya tiene componente reutilizable).

### Sesión 2026-09-07 (10) — Módulo Strengths

**Objetivo de la sesión:** implementar el CRUD completo de `Strengths`
(spec §5.8) — segundo paso del plan acordado ("Services → Strengths →
WorkStyleItems → Faqs"). Mapea a la sección "Por qué elegirnos" de
`Portfolio/imagenBase.png`: `label` (tag corto) + `title` + `body`
traducibles, todos obligatorios, más `tech_stack` opcional y `sort_order`.

**Decisión de diseño:** se mantuvo el formulario `FormData` no controlado
(como Studies/Services), pero esta vez con un campo controlado puntual:
`techStack` usa `<TagsInput>` con un `useState<string[]>` local que se
combina manualmente con el resto del `FormData` recién en el submit
(`formDataToInput(data, activeLocales, techStack)`). No fue necesario tocar
`<TagsInput>` — ya era reutilizable tal cual. Se ajustó `onChange` para
marcar `dirty` explícitamente, porque quitar un tag (botón ×) no dispara un
evento nativo `change` que el `onChange` del `<form>` pueda capturar por
bubbling (a diferencia de escribir en el input de texto, que sí burbujea).

**Archivos modificados/creados:**

```text
apps/api/src/strengths/entities/strength.entity.ts                    (nuevo)
apps/api/src/strengths/dto/strength.dto.ts                            (nuevo)
apps/api/src/strengths/dto/list-strengths-query.dto.ts                (nuevo)
apps/api/src/strengths/strengths.service.ts                           (nuevo)
apps/api/src/strengths/strengths.service.spec.ts                      (nuevo)
apps/api/src/strengths/admin-strengths.controller.ts                  (nuevo)
apps/api/src/strengths/strengths.module.ts                            (nuevo)
apps/api/src/database/migrations/1789430400000-CreateStrengths.ts     (nuevo)
apps/api/src/database/migrations/__tests__/1789430400000-CreateStrengths.spec.ts (nuevo)
apps/api/test/strengths.e2e-spec.ts                                   (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (Strength, StrengthInput)
apps/web/src/app/admin/(protected)/strengths/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/strength-list.tsx              (nuevo)
apps/web/src/features/admin/components/strength-form.tsx              (nuevo)
apps/web/src/features/admin/components/admin-shell.tsx    (nav Fortalezas)
apps/web/src/features/admin/api/admin-api.ts (listStrengths/getStrength/
                                               createStrength/updateStrength/
                                               deleteStrength)
apps/web/src/features/admin/types.ts       (Strength, StrengthPage)
apps/web/tests/admin-strengths-structure.test.mjs                     (nuevo)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (87 tests: incluye
                                               strengths.service.spec.ts —
                                               defaults, techStack, scoping
                                               por owner — y la migración
                                               up/down/up + cascada)
pnpm --filter @devsure/api test:integration  (68 tests: incluye
                                               strengths.e2e-spec.ts — 401,
                                               400 body vacío, 201 con
                                               techStack, list/update/delete
                                               end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web test              (falla 1/12, la misma
                                               preexistente ya documentada)
pnpm --filter @devsure/web build             ✅ (esta vez sí — el usuario ya
                                               había cerrado sus `pnpm dev`;
                                               incluye las 3 rutas nuevas)
pnpm build (raíz, turbo)                     ✅
```

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Seguir con **WorkStyleItems** (spec §5.9) — el más simple de toda la lista:
un único campo traducible `text` + `sort_order`, sin nada más. Mapea a
"Cuatro pasos, cero sorpresas" en la imagen de referencia (aunque esa
sección numera los items automáticamente por posición, no necesita un campo
propio para el número). Después sigue **Faqs** (spec §5.10, `question` +
`answer` traducibles) para cerrar el plan acordado con el usuario antes del
endpoint público del portfolio.

### Sesión 2026-09-07 (11) — Módulo WorkStyleItems

**Objetivo de la sesión:** implementar el CRUD completo de `WorkStyleItems`
(spec §5.9) — tercer paso del plan acordado ("Services → Strengths →
WorkStyleItems → Faqs"). El módulo más simple de todo el CMS hasta ahora: un
único campo traducible `text` + `sort_order`, sin nada más. Mapea a los
bullets numerados de "Cómo trabajamos" en `Portfolio/imagenBase.png` (el
número de cada bullet lo pone el front por posición, no es un campo).

Mismo patrón `FormData` no controlado que Services/Studies, sin ningún
`useState` adicional siquiera (a diferencia de Strengths, que necesitaba uno
para `techStack`). Nada nuevo que decidir arquitectónicamente en esta
sesión — fue una repetición mecánica del patrón ya establecido.

**Archivos modificados/creados:**

```text
apps/api/src/work-style-items/entities/work-style-item.entity.ts       (nuevo)
apps/api/src/work-style-items/dto/work-style-item.dto.ts               (nuevo)
apps/api/src/work-style-items/dto/list-work-style-items-query.dto.ts   (nuevo)
apps/api/src/work-style-items/work-style-items.service.ts              (nuevo)
apps/api/src/work-style-items/work-style-items.service.spec.ts         (nuevo)
apps/api/src/work-style-items/admin-work-style-items.controller.ts     (nuevo)
apps/api/src/work-style-items/work-style-items.module.ts               (nuevo)
apps/api/src/database/migrations/1789516800000-CreateWorkStyleItems.ts (nuevo)
apps/api/src/database/migrations/__tests__/1789516800000-CreateWorkStyleItems.spec.ts (nuevo)
apps/api/test/work-style-items.e2e-spec.ts                             (nuevo)
apps/api/src/app.module.ts / database/data-source.ts (registran el módulo)
packages/contracts/src/index.ts           (WorkStyleItem, WorkStyleItemInput)
apps/web/src/app/admin/(protected)/work-style-items/{page,new/page,[id]/edit/page}.tsx (nuevos)
apps/web/src/features/admin/components/work-style-item-list.tsx        (nuevo)
apps/web/src/features/admin/components/work-style-item-form.tsx        (nuevo)
apps/web/src/features/admin/components/admin-shell.tsx  (nav Estilo de trabajo)
apps/web/src/features/admin/api/admin-api.ts (listWorkStyleItems/
                                               getWorkStyleItem/
                                               createWorkStyleItem/
                                               updateWorkStyleItem/
                                               deleteWorkStyleItem)
apps/web/src/features/admin/types.ts       (WorkStyleItem, WorkStyleItemPage)
apps/web/tests/admin-work-style-items-structure.test.mjs               (nuevo)
```

**Pruebas ejecutadas (todas verdes salvo el hueco preexistente ya conocido):**

```text
pnpm --filter @devsure/contracts build / test
pnpm --filter @devsure/api lint / typecheck
pnpm --filter @devsure/api test              (93 tests: incluye
                                               work-style-items.service.spec.ts
                                               y su migración up/down/up +
                                               cascada)
pnpm --filter @devsure/api test:integration  (72 tests: incluye
                                               work-style-items.e2e-spec.ts —
                                               401, 400 texto vacío, 201,
                                               list/update/delete end-to-end)
pnpm --filter @devsure/web lint / typecheck  (verdes)
pnpm --filter @devsure/web test              (falla 1/13, la misma
                                               preexistente ya documentada)
pnpm --filter @devsure/web build             ✅ (incluye las 3 rutas nuevas)
pnpm build (raíz, turbo)                     ✅
```

**Siguiente tarea recomendada (siguiente sesión, un solo módulo):**

Cerrar el plan acordado con **Faqs** (spec §5.10): `question` + `answer`
traducibles, ambos obligatorios, `sort_order`. Mismo patrón exacto que
Services (dos bloques `<LocaleTabs>`, sin campos extra). Después de Faqs,
**los cuatro módulos del plan del usuario quedan completos** — el siguiente
hito natural es el endpoint público `GET /api/public/portfolio` (spec §10.7,
§12), y recién después el rediseño visual de la home.

## Nueva dirección visual: rediseño de la home pública

**Añadido el 2026-09-07, a pedido del usuario, tras validar el CMS admin
construido hasta ahora ("ya probé, están buenas lo que hicimos").** Es una
línea de trabajo **nueva y separada** del backlog del CMS admin (Skills,
Services, etc.) — toca `apps/web`, la home pública, no `/admin`.

**Referencia visual:** `Portfolio/imagenBase.png` — captura de una landing
page corporativa de servicios tecnológicos (marca ajena, "Sinaloa Nube", no
relacionada con DevSure). El usuario quiere que la home pública de DevSure
se acerque a esa **estructura y composición de secciones**, no a esa marca.

**Regla que sigue aplicando sin excepción (AGENTS.md):** *"No copies marca,
textos, activos ni composición exacta del sitio de referencia."* Esto
significa: replicar el **tipo de sección y su propósito**, con copy, colores,
iconografía y contenido 100% de DevSure — nunca el texto, los logos de
cliente, ni el layout pixel-por-pixel de la captura.

**Inventario de secciones de la referencia** (de arriba hacia abajo; el
recuadro azul repetido a la derecha de la captura es una superposición de
una extensión del navegador, no es parte del diseño — ignorarlo):

| # | Sección en la imagen | Propósito | Fuente de contenido en DevSure |
|---|---|---|---|
| 1 | Header: logo + nav + botón CTA | Navegación fija | Ya existe (`site-header.tsx`); solo ajustar estilo/CTA si se decide |
| 2 | Hero: eyebrow + título + copy + 2 CTAs + bullets de confianza + tarjeta de contacto | Primera impresión | `Translations.heroTag/heroTitle/heroCopy/heroNote` (ya implementado) + `Profile` (ya implementado) |
| 3 | Franja de logos de clientes | Prueba social | **No existe en la spec del CMS** — decidir si se agrega (tabla nueva) o se omite |
| 4 | "Quiénes somos" + stats en tarjetas | Autoridad/trayectoria | `Translations.aboutHeading/aboutBody` (ya implementado); los stats numéricos no tienen campo propio todavía — evaluar si van hardcodeados, en `Profile`, o en una tabla nueva |
| 5 | Grid de servicios agrupado por categoría | Oferta de valor | **`Services`** (spec §5.7 — pendiente de implementar) |
| 6 | "Por qué elegirnos" con tarjetas | Diferenciación | **`Strengths`** (spec §5.8 — pendiente) — encaja casi exacto (`label`+`title`+`body`) |
| 7 | Casos de éxito (tarjetas con imagen) | Prueba social concreta | **`Projects`** (ya implementado) filtrados por `featured`, o **`Testimonials`** (spec §5.11 — pendiente) |
| 8 | "Cómo trabajamos" (4 pasos numerados) | Proceso/confianza | **`WorkStyleItems`** (spec §5.9 — pendiente) — encaja casi exacto |
| 9 | FAQ (acordeón) | Reducir fricción | **`Faqs`** (spec §5.10 — pendiente) |
| 10 | Contacto: info + formulario | Conversión | `Profile`/`Translations.contactHeading/contactIntro` (ya implementado) + **formulario público → `ContactMessages`/Inbox** (spec §5.15, §6.9 — pendiente) |
| 11 | Footer (logo, columnas, legal) | Cierre | Ya existe (`site-footer.tsx`); ampliar columnas cuando existan Servicios/enlaces reales |

**Lectura clave:** la mayoría de las secciones de la imagen ya mapean 1:1 a
módulos que **ya estaban en el backlog del CMS** (Services, Strengths,
WorkStyleItems, Faqs, Testimonials, Inbox) — este pedido no reemplaza el
backlog de la sección "Trabajo pendiente principal" más abajo, lo confirma y
le da un destino visual concreto. La franja de logos de clientes (#3) y los
stats numéricos (#4) son lo único que no tiene un lugar obvio todavía en la
spec original; no inventar una tabla nueva sin confirmar con el usuario.

**Cómo continuar esta línea de trabajo (sesiones futuras, una cosa a la
vez):**

1. Terminar primero los módulos de contenido que la home necesita para no
   maquetar con datos inventados: **Services** → **Strengths** →
   **WorkStyleItems** → **Faqs** (mismo patrón CRUD ya usado en
   Studies/Skills; `Faqs`/`Strengths`/`WorkStyleItems` son aún más simples).
2. Implementar el endpoint público `GET /api/public/portfolio` (spec §10.7,
   §12) que agrega todo eso para que la home pública deje de tener datos
   fijos.
3. Recién ahí abordar el rediseño visual de `apps/web/src/app/page.tsx` y
   sus secciones, sección por sección, con la copy y marca propias de
   DevSure — **preguntar al usuario por la paleta/tono de marca antes de
   diseñar**, no asumirlos de la imagen de referencia.
4. El formulario de contacto (#10) y la franja de logos (#3) son decisiones
   de producto pendientes de confirmar con el usuario antes de construirlas.

## Instrucción para la siguiente IA

Continúa el desarrollo del proyecto **DevSure** desde el estado actual del
repositorio. No reinicies el proyecto, no borres implementaciones existentes y
no reviertas cambios que no hayas creado tú.

Antes de modificar archivos:

1. Lee este documento, incluida la sección "Nueva dirección visual: rediseño
   de la home pública" si vas a trabajar en `apps/web` (front público).
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
