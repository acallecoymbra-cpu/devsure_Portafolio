# Plan de implementación: tecnologías y casos de éxito de DevSure

## 1. Propósito

Este documento define cómo convertir la portada provisional de DevSure en una
presentación comercial basada en evidencia que muestre:

- todas las tecnologías confirmadas por el CV, con nombre e icono;
- los desarrollos realizados por DevSure;
- una ficha completa por proyecto con problema, solución, participación,
  arquitectura publicable, tecnologías, resultados verificables e imágenes;
- contenido administrable desde la API y, en una fase posterior, desde
  `/admin`, sin tener que modificar el código para cada cambio editorial.

El primer proyecto documentado es **AKIKB**. El usuario indicó que existen dos
proyectos, pero todavía no proporcionó la identidad ni la ficha del segundo.
No se inventará un proyecto, cliente, tecnología, resultado ni captura para
completar el diseño.

> Decisión editorial pendiente: confirmar si la marca pública se escribe
> `AKIKB`, `AKKIB` o de otra forma. En este plan se usa provisionalmente
> **AKIKB** porque es la grafía predominante en el informe técnico recibido.

## 2. Resultado esperado

Al finalizar todos los slices:

1. La portada `/` presenta la propuesta de valor real de DevSure.
2. La sección **Tecnologías que manejamos** muestra las 41 tecnologías y
   prácticas confirmadas, agrupadas y ordenadas desde la API.
3. La sección **Proyectos destacados** muestra únicamente proyectos publicados.
4. Cada tarjeta abre `/proyectos/[slug]`.
5. El detalle de AKIKB explica el proyecto con contenido público seguro y una
   galería de capturas reales del dashboard.
6. El segundo proyecto aparece solamente después de recibir y aprobar su ficha.
7. Un administrador puede crear, editar, ordenar, destacar, publicar y
   despublicar tecnologías y proyectos sin un nuevo despliegue.
8. Ninguna respuesta pública expone entidades TypeORM, borradores, claves de
   almacenamiento ni información sensible.

## 3. Estado actual del repositorio

- `apps/web` está en Fase 0 y la portada contiene contenido provisional
  hardcodeado: principios, ruta y estado.
- El header solo enlaza a las anclas de esa portada provisional.
- `apps/api` solo contiene la fundación y el endpoint de salud.
- `packages/contracts` solo define salud y el contrato público de error.
- TypeORM ya está configurado con SQLite, migraciones y `synchronize: false`.
- Todavía no existen los módulos `technologies`, `projects`, `media`, `auth` ni
  `admin`.
- La prueba web llamada E2E es un smoke test con `node:test` que se omite si el
  servidor no está iniciado; todavía no existe un recorrido Playwright real.
- La metadata usa un dominio de ejemplo y no existen sitemap, JSON-LD ni
  metadata dinámica por proyecto.

No se debe modificar la migración de fundación existente. Cada cambio de modelo
se añadirá mediante una migración TypeORM nueva y reversible.

## 4. Alcance funcional

### 4.1 Portada `/`

Orden recomendado:

1. Hero con propuesta de valor y CTA comercial aprobados.
2. Tecnologías que manejamos.
3. Proyectos destacados / casos de éxito.
4. Proceso o capacidades de DevSure, solo si existe contenido real.
5. CTA final de contacto.

Las secciones provisionales actuales se reemplazarán o reescribirán; no deben
condicionar la composición final.

### 4.2 Tecnologías en la portada

La portada mostrará **todas las tecnologías publicadas**, no solo una selección.
Para que 41 elementos sigan siendo legibles:

- se agrupan por categoría;
- cada elemento usa una tarjeta compacta con icono y nombre;
- el modo inicial es `Todas` y no oculta registros;
- los filtros por categoría son una mejora de exploración, no la única forma de
  acceder al contenido;
- no se utilizará un carrusel automático;
- una futura `/tecnologias` podrá añadir búsqueda, filtros y explicaciones más
  extensas reutilizando el mismo contrato.

La API conservará paginación por consistencia con el blueprint. El servicio de
Next.js solicitará un límite suficiente para las 41 entradas y, si
`meta.total` supera ese límite, recorrerá las páginas restantes. El criterio de
aceptación es que cada tecnología publicada aparezca exactamente una vez.

### 4.3 Proyectos

- `/proyectos` lista todos los proyectos publicados.
- `/proyectos/[slug]` presenta el detalle completo.
- La portada consume `featured=true`; no busca AKIKB por nombre ni mantiene una
  lista hardcodeada.
- Un proyecto incompleto permanece en estado `draft` y no aparece en endpoints
  públicos, sitemap ni metadata indexable.
- Hasta verificar resultados medibles, la interfaz usará **Proyectos
  destacados**. La etiqueta **Casos de éxito** se usará únicamente cuando el
  resultado público pueda sostenerse con evidencia.

### 4.4 Detalle de proyecto

Cada ficha incluye:

1. Breadcrumb y título.
2. Resumen y portada.
3. Reto o problema de negocio.
4. Solución desarrollada.
5. Participación y responsabilidades de DevSure.
6. Funcionalidades principales.
7. Arquitectura e integraciones que puedan hacerse públicas.
8. Tecnologías relacionadas.
9. Resultados verificables, sin cifras inventadas.
10. Galería de dashboard con pie de imagen y texto alternativo.
11. CTA final y regreso al portafolio.

### 4.5 Administración

El resultado final debe permitir:

- listar, crear, editar, ordenar, destacar, publicar y despublicar tecnologías;
- crear y editar proyectos como borrador;
- relacionar tecnologías con proyectos;
- registrar detalles técnicos ordenados;
- subir una portada y capturas de dashboard;
- reordenar la galería y escribir `altText` y pies de imagen;
- bloquear la publicación mientras falten campos obligatorios;
- despublicar en lugar de borrar cuando exista contenido relacionado.

No habrá registro público de administradores. La primera cuenta se crea mediante
un comando o seed controlado.

## 5. Inventario confirmado de tecnologías

Este inventario se toma literalmente de la información suministrada. No se
asignan niveles de dominio porque no fueron proporcionados.

### Lenguajes de programación — 6

- Java
- C#
- PHP
- Python
- JavaScript
- TypeScript

### Automatización de pruebas web y mobile — 7

- Selenium WebDriver
- Appium
- Cypress
- Playwright
- Serenity BDD
- Robot Framework
- WinAppDriver

### RPA y low-code — 2

- Robocorp
- Microsoft Power Automate

### Backend y frameworks — 5

- Laravel — experiencia indicada en v10+.
- Vue.js — relacionado con la integración indicada para Laravel.
- NestJS
- Next.js
- Node.js

### CMS y comercio electrónico — 2

- WordPress — capacidades confirmadas: Headless, desarrollo de plugins y Dokan
  Marketplace.
- WooCommerce

### Arquitectura y prácticas — 5

- Microservicios
- APIs RESTful
- Principios SOLID
- Clean Code
- Model Context Protocol (MCP)

### DevOps y CI/CD — 4

- Jenkins Pipelines
- GitHub Actions
- Docker
- Azure DevOps

### Observabilidad y cloud — 2

- New Relic
- Cloudflare Essentials

### Pruebas de rendimiento — 3

- k6
- JMeter
- Artillery

### Metodologías y herramientas — 5

- Scrum
- Jira Agile
- Estándares ISTQB
- Git
- Postman

**Total confirmado: 41 elementos.** `Dokan Marketplace` se registra como una
capacidad de WordPress y no como una tecnología independiente. Laravel y Vue.js
sí se muestran como elementos separados para que cada uno tenga nombre e icono
claros.

Antes de generar el seed se aprobará una matriz auditable con las columnas
`texto original`, `fuente/página`, `nombre público`, `categoría`, `iconKey` y
`observaciones`. Mientras el CV no esté disponible como archivo, la fuente se
registrará como “lista proporcionada por el usuario” y la página quedará
pendiente; esto evita presentar una inferencia como dato extraído del CV.

## 6. Política de iconos

- La base de datos guarda `iconKey`, nunca SVG o HTML arbitrario.
- `apps/web` resuelve la clave mediante un registro permitido
  `TechnologyIconRegistry`.
- Se usarán SVG locales o una colección cuya licencia y marcas hayan sido
  revisadas; no se copiarán activos del sitio de referencia.
- Los productos con marca pueden usar su icono oficial dentro de las reglas de
  uso de la marca.
- Conceptos como SOLID, Clean Code, APIs RESTful, Scrum o microservicios usarán
  iconos genéricos propios; no se inventará un logo oficial.
- Una clave desconocida muestra un fallback neutro y mantiene visible el nombre.
- Si el nombre acompaña al icono, el SVG es decorativo y usa `aria-hidden`.
- La información nunca dependerá solamente del color o de un tooltip.
- No se aceptarán URLs de iconos ni SVG editables desde el panel administrativo.

Antes de implementar se creará una matriz `tecnología -> iconKey -> fuente ->
licencia/restricción`. Esta revisión forma parte del contenido, no es opcional.

## 7. Ficha pública propuesta para AKIKB

El informe técnico recibido contiene información suficiente para preparar un
borrador, pero la publicación exige aprobación editorial y capturas seguras.

### Identidad

- **Título provisional:** AKIKB
- **Slug provisional:** `akikb`
- **Subtítulo:** Plataforma digital para el arriendo de bodegas de
  autoalmacenamiento en Chile.
- **Participación pública recomendada:** desarrollo del backend e integraciones
  del flujo de arriendo.

### Resumen de tarjeta

> Backend para una plataforma chilena de arriendo online de bodegas que conecta
> reservas, pagos, contratos electrónicos y gestión operativa en un solo flujo.

Este texto es un borrador. No se debe afirmar propiedad completa del producto ni
participación full-stack si esa atribución no está confirmada.

### Reto

Digitalizar un proceso que dependía de visita física, papeleo y coordinación
manual, manteniendo sincronizados el pago, el contrato y el alta operativa del
arrendatario.

### Solución

Un backend Laravel que atiende la API pública y el panel administrativo, y que
coordina servicios externos para permitir que el cliente explore, reserve,
pague, reciba un contrato para firma y quede registrado en el sistema de
gestión.

### Funcionalidades publicables

- selección y reserva temporal de bodegas;
- pago online mediante Webpay Plus de Transbank;
- generación de documentos y flujo de firma electrónica;
- sincronización con SiteLink mediante SOAP/WSDL;
- gestión administrativa de sucursales, bodegas, clientes, descuentos,
  usuarios, roles y permisos;
- API REST para el recorrido de compra.

### Arquitectura y stack verificados por el informe

- PHP 8.1 y Laravel 10;
- arquitectura de monolito backend con API REST y panel Blade;
- MySQL;
- Laravel Fortify y Sanctum;
- Spatie Laravel Permission;
- Transbank Webpay Plus;
- SiteLink mediante SOAP/WSDL;
- SignAPIs para firma electrónica;
- PHPWord, Api2Pdf y DOMPDF para documentos;
- Vite 5 y Axios para assets y consumo HTTP;
- Laravel Mail mediante SMTP.

Las dependencias específicas de este proyecto no se añadirán automáticamente al
catálogo general de competencias. Solo se incorporarán allí si el usuario las
confirma expresamente como tecnologías que desea mostrar.

### Resultado publicable

Se puede afirmar que la solución digitaliza y conecta el ciclo de arriendo. No
se publicarán porcentajes, ahorros, cantidad de clientes, transacciones ni la
frase “de días a minutos” hasta contar con una fuente aprobada.

### Contenido interno que no debe aparecer en el portafolio

- credenciales, tokens, hashes, códigos de comercio o variables de entorno;
- endpoints internos, nombres de servidores o rutas administrativas sensibles;
- datos de clientes o arrendatarios;
- detalles explotables de seguridad;
- el inventario de deuda técnica del informe;
- métricas o resultados no demostrados.

La deuda técnica puede alimentar un backlog interno de mejora, pero no forma
parte de la narrativa comercial pública.

## 8. Ficha requerida para el segundo proyecto

No se creará una tarjeta `Proyecto 2` en producción. Antes de implementarlo se
debe completar:

- nombre público y slug;
- autorización para mencionar cliente y marca;
- resumen de una o dos frases;
- problema de negocio;
- solución desarrollada;
- participación exacta de DevSure;
- funcionalidades principales;
- arquitectura publicable;
- tecnologías confirmadas;
- integraciones publicables;
- resultados verificables;
- portada y capturas reales;
- `altText` y pie de imagen para cada captura;
- URL externa, solo si es pública y se desea enlazar;
- aprobación final para publicar.

Hasta completar esta ficha, el segundo proyecto puede existir únicamente como
una tarea editorial, no como seed, entidad ni placeholder visible.

## 9. Modelo de datos propuesto

Tecnologías y proyectos conservan ciclos de vida distintos. No se creará una
entidad genérica `Product`.

### `Technology`

- `id`: UUID generado por la aplicación.
- `name`: nombre visible.
- `slug`: único.
- `category`: texto normalizado.
- `summary`: explicación breve opcional.
- `iconKey`: clave del registro permitido de frontend.
- `featured`: destacado.
- `sortOrder`: orden administrable.
- `publicationStatus`: `draft | published`, almacenado como `varchar`.
- `publishedAt`, `createdAt`, `updatedAt`.

### `Project`

- `id`: UUID.
- `title` y `slug` único.
- `summary`: texto para tarjeta.
- `challenge`: problema o reto.
- `solution`: solución desarrollada.
- `contribution`: participación de DevSure.
- `description`: relato complementario en texto plano.
- `technicalOverview`: explicación técnica publicable.
- `resultSummary`: opcional y basado en evidencia.
- `externalUrl`: opcional y validada.
- `featured`, `sortOrder`.
- `publicationStatus`: `draft | published`.
- `publishedAt`, `createdAt`, `updatedAt`.

No se aceptará HTML arbitrario en los campos editoriales del MVP. El frontend
renderizará texto estructurado para reducir XSS y evitar una sanitización frágil.

### Relaciones y medios

- `project_technologies(project_id, technology_id, sort_order)`.
- `project_features(id, project_id, description, sort_order)` para las
  funcionalidades principales; no se persisten como un array del driver.
- `project_technical_details(id, project_id, label, value, sort_order)`.
- `media_assets(id, storage_key, mime_type, width, height, size_bytes, checksum,
  review_status, reviewed_at, reviewed_by_admin_id, created_at)`.
- `project_media(id, project_id, media_asset_id, role, alt_text, caption,
  sort_order)`.
- `role` se valida como `cover | dashboard` y se almacena como `varchar`.
- `review_status` se valida como `pending | approved | rejected` y se almacena
  como `varchar`.

Reglas de dominio:

- un proyecto publicado requiere resumen, reto, solución, contribución,
  explicación técnica, al menos una funcionalidad, una tecnología, una portada
  y `altText` en cada imagen informativa;
- cada proyecto tiene una sola portada;
- una actualización de proyecto, tecnologías, detalles y medios es
  transaccional;
- el slug se bloquea después de publicar para no romper URLs, canonical ni SEO;
- una tecnología relacionada no se elimina: se despublica o primero se retira
  la relación;
- la API pública solo selecciona contenido `published` y medios `approved`;
- un medio pendiente se guarda fuera del árbol público y no es accesible por URL
  directa;
- aprobar un medio exige `reviewedAt`, revisor autenticado y evidencia editorial
  asociada; la publicación se bloquea si falta cualquiera de ellos;
- las respuestas convierten fechas a ISO 8601;
- no se usan `array: true`, SQL específico de SQLite ni códigos de error propios
  de PostgreSQL.

### Migraciones previstas

1. `CreateTechnologies`.
2. `CreateProjectsAndRelations`.
3. `CreateMediaAssetsAndProjectMedia`.
4. `CreateAdminUsersAndSessions`, cuando comience el slice administrativo.

Los nombres finales y agrupación pueden ajustarse al implementar, pero nunca se
modificará `InitialFoundation` ni se activará `synchronize`.

## 10. Contratos y API

Los DTOs de entrada/salida de NestJS son distintos de las entidades TypeORM.
`packages/contracts` publica los tipos seguros que consume Next.js y refleja el
OpenAPI real.

### Endpoints públicos

```text
GET /api/v1/technologies
    ?featured=&page=1&limit=50&category=&search=

GET /api/v1/projects
    ?featured=true&page=1&limit=6

GET /api/v1/projects/:slug

GET /api/v1/media/:id
```

Los listados usan:

```ts
type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
```

Contratos públicos mínimos:

```ts
type TechnologyCard = {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary?: string;
  iconKey: string;
  sortOrder: number;
};

type TechnologyReference = Pick<
  TechnologyCard,
  'id' | 'name' | 'slug' | 'iconKey'
>;

type PublicImage = {
  url: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

type ProjectCard = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: PublicImage;
  technologies: TechnologyReference[];
};

type ProjectDetail = ProjectCard & {
  challenge: string;
  solution: string;
  contribution: string;
  description?: string;
  technicalOverview: string;
  features: string[];
  resultSummary?: string;
  technicalDetails: Array<{ label: string; value: string }>;
  dashboardImages: PublicImage[];
  externalUrl?: string;
};
```

Orden público: `sortOrder ASC` y luego nombre o título. El backend fuerza el
estado publicado; el cliente público no puede solicitar borradores. Un slug que
no existe o no está publicado responde `404` con `PublicErrorResponse`.

### Endpoints administrativos

```text
GET/POST          /api/v1/admin/technologies
GET/PATCH/DELETE  /api/v1/admin/technologies/:id

GET/POST          /api/v1/admin/projects
GET/PATCH/DELETE  /api/v1/admin/projects/:id

POST              /api/v1/admin/media/images
DELETE            /api/v1/admin/media/:id
```

Todos requieren identidad válida y rol `ADMIN`. Errores esperados: `400`,
`401`, `403`, `404` y `409`, usando el envelope público ya existente.

Los esquemas administrativos de entrada/salida y sus límites de colecciones se
cerrarán en el Slice 0 antes de implementar. No se reutilizará una entidad como
DTO por conveniencia.

## 11. Límite entre Next.js y NestJS

NestJS es responsable de:

- publicación, orden, paginación y filtros;
- validación y autorización;
- reglas para relacionar tecnologías y medios;
- transacciones;
- persistencia y resolución de URLs públicas de medios;
- impedir la fuga de borradores o campos internos.

Next.js es responsable de:

- composición visual, responsive, accesibilidad y SEO;
- consumo de DTOs públicos mediante un cliente tipado;
- Server Components para inicio, índice y detalle;
- `notFound()` para proyectos inexistentes o no publicados;
- metadata dinámica basada en `ProjectDetail`;
- validación de formularios administrativos como ayuda de experiencia, sin
  reemplazar la validación de NestJS.

La portada solicita tecnologías y proyectos en paralelo y usa límites de error
independientes. El fallo de una sección no debe derribar la otra. No se creará
todavía un endpoint agregador `/homepage`.

Durante el MVP, las lecturas públicas de tecnologías y proyectos usarán
`cache: 'no-store'` para que publicar o despublicar contenido sea visible sin un
nuevo despliegue ni una invalidación externa. Si el tráfico justifica caché, una
ADR posterior definirá TTL o revalidación por tags y sus pruebas.

## 12. Estructura frontend prevista

```text
apps/web/src/
  app/
    page.tsx
    proyectos/page.tsx
    proyectos/[slug]/page.tsx
  components/
    section-heading.tsx
  features/
    technologies/
      api/
      components/technology-grid.tsx
      components/technology-tile.tsx
      components/technology-icon.tsx
      icon-registry.tsx
    projects/
      api/
      components/project-grid.tsx
      components/project-card.tsx
      components/project-gallery.tsx
      components/project-media-figure.tsx
```

Las páginas componen; los features encapsulan acceso a API y componentes
reutilizables. La galería inicial será una cuadrícula semántica. No se añadirá
un lightbox ni un componente cliente hasta que exista un requisito aprobado.

## 13. Diseño responsive y accesibilidad

### Responsive

- 360 px: hero y proyectos en una columna; tecnologías en dos columnas si la
  tarjeta contiene solo icono y nombre; navegación móvil accesible.
- 768 px: tecnologías en tres columnas y proyectos en dos.
- 1024 px: tecnologías en cuatro columnas y texto de proyecto limitado a una
  línea de lectura cómoda.
- 1440 px: `max-width` estable, cinco o seis columnas de tecnologías y galería
  de dos columnas.
- Las secciones usan `scroll-margin-top` por el header sticky.

### Accesibilidad

- enlace “Saltar al contenido”;
- un solo `h1` y jerarquía consistente;
- `section` con `aria-labelledby`, listas para grids y `article` para proyectos;
- enlace principal de cada tarjeta en el título, sin enlaces anidados;
- controles y destinos táctiles de al menos 44 × 44 px;
- foco visible y recorrido completo por teclado;
- menú móvil con `aria-expanded`, `aria-controls`, cierre con Escape y retorno de
  foco;
- capturas con texto alternativo específico y explicación textual equivalente;
- WCAG AA y respeto de `prefers-reduced-motion`;
- ningún contenido esencial depende de hover, color o animación.

### Estados de interfaz

- `loading`: skeletons de tamaño estable;
- `empty`: mensaje editorial neutro, nunca registros ficticios;
- `error`: mensaje seguro y reintento;
- `success`: contenido ordenado y navegación funcional;
- icono o imagen desconocida: fallback estable;
- detalle no publicado o inexistente: 404.

## 14. Imágenes, privacidad y almacenamiento

Las imágenes deben ser capturas reales proporcionadas o aprobadas por el
usuario. No se generarán dashboards ficticios para presentarlos como evidencia.

Checklist previo a cada publicación:

- autorización para usar marca, logo y material visual;
- datos de demostración o redacción de nombres, correos, teléfonos,
  identificadores, transacciones y notificaciones;
- ocultar tokens, claves, URLs internas, IPs y rutas administrativas;
- revisar también barras laterales, avatares, breadcrumbs y datos pequeños;
- eliminar EXIF y metadatos;
- nombre de archivo generado, sin datos sensibles;
- `altText`, pie, orden, ancho y alto registrados;
- revisión visual en resolución original antes de publicar.

Upload del MVP:

- autenticado y limitado al rol administrativo;
- PNG, JPEG, WebP o AVIF; no SVG subido por usuarios;
- validación de extensión, MIME y firma real;
- límite explícito de bytes, dimensiones y cantidad;
- almacenamiento fuera de directorios ejecutables;
- nombres no controlados por el usuario;
- sin hotlinks ni URLs arbitrarias;
- logs sin nombres sensibles, contenido ni credenciales.

Cada upload entra como `pending` a un área privada. La revisión incluye redacción
visual y eliminación automática de metadatos; solo después cambia a `approved`.
`GET /api/v1/media/:id` entrega el archivo únicamente si el medio está aprobado
y relacionado con un proyecto publicado. Al despublicar el proyecto o rechazar
el medio, el acceso directo vuelve a responder `404`; no habrá rutas estáticas
predecibles que eviten esta regla.

Para los medios iniciales cargados por seed, un manifiesto versionado registra
revisor, fecha, permiso, checksum, `altText` y resultado de redacción. El seed no
puede marcar un archivo como aprobado si esa evidencia está incompleta.

La base de datos guarda `storageKey`, no una URL absoluta. Un adaptador genera la
URL autorizada para disco local en el MVP y permite cambiar a S3/R2 en el futuro
sin migrar los registros. Ese cambio futuro no autoriza una integración cloud
ahora.

## 15. SEO y rendimiento

- Sustituir `https://devsure.example` por el dominio real antes de producción.
- Metadata y canonical para `/`, `/proyectos` y cada slug publicado.
- `generateMetadata` usa el DTO público del proyecto.
- Open Graph usa una portada aprobada y dimensiones conocidas.
- JSON-LD `Organization` en inicio y `CreativeWork` más `BreadcrumbList` en
  detalles; `SoftwareApplication` solo si describe correctamente el proyecto.
- `sitemap.ts` incluye únicamente proyectos publicados.
- `robots.ts` y `noindex` para administración y borradores.
- `next/image`, dimensiones explícitas, `sizes` y relación de aspecto estable.
- Portada prioritaria; capturas bajo el pliegue con lazy loading.
- Objetivos del blueprint: Lighthouse Performance >= 90, Accessibility >= 95,
  Best Practices >= 95 y SEO >= 95.

## 16. Vertical slices

### Slice 0 — Inventario, contrato y aprobación editorial

**Objetivo:** dejar datos y decisiones listos antes de programar.

Este slice tiene tres compuertas independientes:

- **Catálogo, obligatoria para el Slice 1:** aprobar la matriz auditable de las
  41 tecnologías, iconos y licencias.
- **AKIKB, obligatoria para publicar AKIKB:** confirmar grafía, atribución,
  textos, portada, capturas, privacidad, derechos, `altText` y pies.
- **Segundo proyecto, obligatoria solo para publicarlo:** completar su ficha y
  aprobar sus medios; su ausencia no bloquea catálogo ni AKIKB.

También se cierran DTOs públicos y administrativos, límites de colecciones,
orden, paginación, reglas de publicación y errores.

**Salida:** la compuerta del catálogo queda aprobada sin contenido inventado. Las
compuertas de proyecto pueden seguir abiertas y sus proyectos permanecen
ausentes o como borradores no públicos.

### Slice 1 — Tecnologías públicas de extremo a extremo

- entidad y migración TypeORM;
- seed idempotente con los 41 elementos;
- DTOs y contratos públicos;
- endpoint con búsqueda, categoría, destacado y paginación;
- cliente tipado y sección completa en la portada;
- registro seguro de iconos y fallback;
- loading, empty, error y success;
- infraestructura Playwright real que levanta la aplicación y prueba este primer
  recorrido de UI sin omisiones silenciosas;
- pruebas unitarias, integración y recorrido web.

**Criterio de salida:** las 41 tecnologías publicadas aparecen una vez, en orden,
desde la API; funcionan en 360, 768, 1024 y 1440 px y no hay contenido principal
hardcodeado en el componente.

### Slice 2 — Índice, tarjetas y portada de proyectos

- entidades `Project`, relaciones y medios, con sus migraciones;
- registro inicial de una portada aprobada mediante seed/fixture controlado; el
  upload administrativo todavía no forma parte de este slice;
- DTO de tarjeta y endpoint paginado;
- seed de AKIKB como `draft` hasta aprobar el contenido;
- `/proyectos` y sección de portada con componentes compartidos;
- filtros `published` y `featured` aplicados siempre en servidor;
- estados y navegación por teclado.

**Criterio de salida:** solo proyectos completos y publicados aparecen. No existe
un placeholder público para el segundo proyecto.

### Slice 3 — Detalle y galería de proyecto

- endpoint público por slug;
- página Server Component `/proyectos/[slug]`;
- narrativa, funcionalidades, detalles técnicos, tecnologías y galería usando el
  modelo de medios creado en el Slice 2;
- portada y capturas optimizadas;
- 404, metadata dinámica y Open Graph;
- pruebas de borradores, slug inválido y galería.

**Criterio de salida:** AKIKB puede publicarse cuando su ficha y capturas superen
la revisión. El detalle no filtra claves internas ni contenido privado.

### Slice 4 — Autenticación administrativa

- usuario administrativo y migración;
- creación inicial por CLI o seed controlado;
- Argon2 asíncrono;
- login sin registro público;
- cookie segura `httpOnly`, rotación/expiración según contrato;
- protección CSRF en escrituras, flags `secure`/`sameSite` y CORS con
  credenciales limitado a orígenes aprobados;
- autorización declarativa `@Auth(ADMIN)`;
- rate limiting y auditoría sin secretos.

**Criterio de salida:** ausencia de identidad responde `401`, rol insuficiente
`403` y ninguna respuesta o log contiene contraseña, hash o token.

### Slice 5A — Administración de tecnologías

- listado y formularios;
- crear, editar, ordenar, destacar, publicar y despublicar;
- validación de slug e `iconKey`;
- conflictos y cambios sin guardar;
- pruebas de autorización y validación.

**Criterio de salida:** un cambio publicado aparece en la portada sin modificar
código ni desplegar de nuevo.

### Slice 5B — Administración de proyectos y medios

- edición compuesta transaccional;
- relación y orden de tecnologías;
- detalles técnicos;
- upload seguro, portada y galería;
- validación de campos obligatorios y privacidad;
- publicar y despublicar.

**Criterio de salida:** un administrador puede completar ambos proyectos, subir
medios seguros y publicarlos sin tocar el código.

### Slice 6 — SEO, accesibilidad, E2E y endurecimiento

- sitemap, robots, canonical, JSON-LD y metadata final;
- ampliar la base Playwright creada en el Slice 1 con todos los recorridos;
- navegación por teclado y menú móvil;
- contraste, reduced motion y responsive;
- límites y casos negativos de upload;
- migraciones up/down y compatibilidad SQLite;
- Lighthouse y build de producción.

**Criterio de salida:** cumple la Definition of Done del repositorio con evidencia
de cada comando ejecutado.

## 17. Pruebas y verificación

### API

- creación y consulta de tecnologías;
- filtros, orden, paginación y búsqueda;
- slugs duplicados y validación de DTOs;
- borradores ausentes de endpoints públicos;
- proyecto con relaciones y actualización transaccional;
- 404 para slug no publicado;
- `401`, `403` y `409` administrativos;
- flags de cookies, CSRF, rotación y rechazo de reutilización de refresh token;
- rate limiting de login, upload y escrituras, CORS y límite de body;
- upload con tipo, firma, tamaño o dimensiones inválidos;
- prohibición de una segunda portada;
- medios pendientes o de proyectos borrador inaccesibles por URL directa;
- ausencia de PII, credenciales, tokens y claves de almacenamiento en logs;
- respuestas sin columnas internas ni `storageKey`.

### Web

- cada una de las 41 tecnologías aparece exactamente una vez;
- fallback de icono desconocido;
- estados loading, empty, error y success;
- ambas tarjetas abren su slug cuando los dos proyectos estén publicados;
- detalle presenta narrativa, stack y capturas;
- 404 para slug inválido;
- navegación completa por teclado, nombres accesibles, foco visible, Escape y
  devolución de foco en el menú móvil;
- destinos de 44 × 44 px, contraste AA y `prefers-reduced-motion`;
- capturas a 360, 768, 1024 y 1440 px;
- ausencia de overflow horizontal en los cuatro tamaños;
- metadata, canonical, sitemap y JSON-LD incluyen publicados y excluyen
  borradores.

### Comandos obligatorios antes de cerrar cada slice

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

Cuando aplique un cambio de base de datos:

```powershell
pnpm db:migration:show
pnpm db:migration:run
pnpm db:migration:revert
pnpm db:migration:run
```

Además, la integración usa una SQLite temporal vacía para probar la cadena
completa `up/down/up`, restricciones únicas, claves foráneas y ejecución
idempotente del seed. Probar solo contra una base existente no valida una
instalación limpia.

No se considerará suficiente el E2E actual si se omite por falta de servidor. El
slice debe añadir un flujo que falle de forma visible cuando la aplicación no
pueda probarse.

## 18. Secuencia de agentes y propiedad

Para cada slice:

1. `devsure_architect` cierra contrato, migración, aceptación y ADR si aplica.
2. `devsure_backend` implementa `apps/api`, migraciones y pruebas de API.
3. `devsure_frontend` implementa `apps/web`, responsive, accesibilidad y SEO.
4. `devsure_qa` revisa el slice y ejecuta las verificaciones antes de cerrarlo.

`packages/contracts` tendrá un propietario a la vez. Backend y frontend no deben
editar simultáneamente el mismo contrato o archivo compartido.

## 19. Decisiones de arquitectura

### Aceptadas

- Catálogo y proyectos provienen de NestJS/SQLite, no de arrays hardcodeados.
- `Technology` y `Project` son dominios separados.
- La publicación usa `draft | published`.
- Los iconos se resuelven mediante claves permitidas en frontend.
- Los medios guardan `storageKey` y usan un adaptador de almacenamiento.
- Next.js consume DTOs públicos y no contiene reglas de publicación.
- La galería inicial es una cuadrícula semántica, no un carrusel automático.
- No se publican resultados sin evidencia ni capturas con datos sensibles.

### ADR necesaria al comenzar media

Documentar **“Persistir claves de almacenamiento y resolver URLs mediante un
adaptador”**. Las alternativas que debe registrar son:

1. rutas acopladas a `public/` de Next.js;
2. URLs absolutas persistidas;
3. `storageKey` independiente — opción recomendada.

### Fuera de alcance

- WebSockets;
- pagos o ejecución de integraciones de AKIKB desde DevSure;
- microservicios para el sitio corporativo;
- editor HTML libre;
- comentarios públicos, testimonios inventados o reconstrucción de dashboards;
- almacenamiento cloud hasta que exista un requisito aprobado;
- analítica sin proveedor y consentimiento definidos;
- copiar marca, textos, activos o composición del sitio de referencia.

## 20. Dependencias para comenzar

Se puede iniciar el Slice 1 con la lista de 41 tecnologías ya recibida. Antes de
publicar proyectos hacen falta:

1. confirmación de la grafía y atribución pública de AKIKB;
2. imágenes originales de AKIKB con permiso de publicación;
3. ficha completa del segundo proyecto;
4. imágenes originales del segundo proyecto;
5. dominio, CTA y datos reales de DevSure para SEO;
6. aprobación de la matriz de iconos y sus licencias.

La ausencia del segundo proyecto no bloquea la arquitectura ni el catálogo. Sí
bloquea el criterio final de mostrar los dos desarrollos reales en producción.
