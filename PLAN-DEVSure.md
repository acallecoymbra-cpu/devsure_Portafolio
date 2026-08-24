# DevSure - Blueprint de producto y plan de construcción

## 1. Decisión de producto

DevSure será el sitio corporativo y catálogo tecnológico de una empresa de desarrollo de software. Tomará de las referencias el lenguaje visual oscuro, las tarjetas, los filtros, las llamadas a la acción y la navegación clara, pero no copiará su marca ni su modelo de cursos.

El objetivo del MVP es convertir visitas en conversaciones comerciales y demostrar capacidad técnica mediante servicios, tecnologías, proyectos y casos de éxito.

> Supuesto: el nombre definitivo es **DevSure**. La palabra `devususer` del pedido se considera un error tipográfico.

## 2. Alcance del MVP

### Navegación pública

- `/` Inicio: propuesta de valor, tecnologías destacadas, servicios, proyectos, proceso, testimonios y CTA.
- `/servicios`: desarrollo web, backend, mobile, cloud/DevOps, datos/IA, consultoría y soporte (ajustar a la oferta real).
- `/tecnologias`: catálogo filtrable por categoría, nivel y tipo de uso.
- `/proyectos`: portafolio y casos de éxito.
- `/proyectos/[slug]`: problema, solución, arquitectura, tecnologías y resultados.
- `/nosotros`: historia, principios, equipo y forma de trabajo.
- `/contacto`: formulario de contacto/cotización.
- `/privacidad` y `/terminos`.
- `/admin`: gestión protegida de contenido.

### Lo que no conviene incluir todavía

- Pagos, suscripciones, LMS, streaming de video y progreso de cursos.
- Chat en tiempo real o CRM propio.
- Microservicios. Un monolito modular es más rápido y apropiado para esta etapa.

## 3. Identidad y experiencia visual

- Estética: fondo azul-violeta muy oscuro, gradientes morado/índigo, bordes sutiles y alto contraste.
- Tipografía sugerida: Geist o Inter; títulos contundentes y texto corto.
- Componentes clave: header fijo, hero, buscador, filtros, tarjetas tecnológicas, tarjetas de proyectos, métricas, logos/clientes, testimonios, CTA y footer.
- Diseño propio: evitar reproducir logo, textos, ilustraciones o composición exacta de DevTalles.
- Accesibilidad: WCAG AA, navegación por teclado, estados de foco, etiquetas de formulario, `prefers-reduced-motion` y contraste comprobado.
- Responsive desde 360 px; objetivos adicionales: 768, 1024 y 1440 px.

## 4. Stack recomendado

### Monorepo

- `pnpm` workspaces + Turborepo.
- `apps/web`: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form y Zod.
- `apps/api`: NestJS, TypeORM, SQLite 3 y Swagger/OpenAPI.
- `packages/contracts`: DTOs/esquemas compartidos y tipos generados desde OpenAPI.
- `packages/config`: ESLint, TypeScript y configuración compartida.
- Pruebas: Vitest/Jest, Supertest y Playwright.

### Criterios importantes

- Next.js consume la API NestJS; no duplicar reglas de negocio en Server Actions.
- SQLite es correcto para desarrollo y un MVP de tráfico moderado. Mantener `synchronize: false` y usar migraciones desde el inicio, incluso durante el desarrollo compartido.
- Mantener compatibilidad con PostgreSQL: UUID, fechas ISO, evitar SQL específico de SQLite y encapsular búsquedas.
- Imágenes optimizadas con `next/image`; archivos inicialmente locales o en almacenamiento compatible con S3 en una fase posterior.

### Qué aportan los proyectos Teslo compartidos

El backend Teslo sí es una referencia útil para el estilo general de NestJS. El ZIP llamado `front` no es una aplicación de tienda ni Next.js: es un cliente demostrativo Vite/TypeScript para Socket.IO. Por lo tanto, no debe usarse como base del frontend de DevSure.

Reutilizar como patrón, adaptándolo:

- Módulos NestJS por dominio y `TypeOrmModule.forFeature`.
- DTOs con `class-validator`, `PartialType` y documentación Swagger.
- `ValidationPipe` global con allowlist estricta.
- Estrategia Passport JWT, decorador compuesto de autorización y guard de roles.
- Repositorios TypeORM, relaciones, paginación y transacciones para escrituras compuestas.
- Seed idempotente para desarrollo.
- Separación de carga/entrega de archivos en un módulo específico, solo cuando sea necesaria.

No copiar directamente:

- `synchronize: true`; DevSure debe usar migraciones.
- Columnas PostgreSQL `array: true`; SQLite requiere tablas relacionadas o `simple-json` solo para datos no consultables.
- Manejo del código PostgreSQL `23505`; normalizar errores por restricción o driver.
- Registro público de usuarios administrativos.
- `bcrypt.hashSync`/`compareSync`; preferir Argon2 asíncrono.
- Retornar el objeto usado para validar la contraseña: el login Teslo selecciona el hash y luego expande el usuario en la respuesta.
- Upload público sin autenticación, límite de tamaño ni verificación real del contenido.
- CORS abierto en WebSockets y token enviado en un header personalizado.
- Seed destructivo expuesto como endpoint en un entorno desplegado.
- WebSockets: DevSure no los necesita para el MVP.

## 5. Arquitectura

```text
Navegador
   |
   v
Next.js (UI, SSR/SEO, formularios)
   |
   v
NestJS REST API (casos de uso, validación, autorización)
   |
   v
TypeORM -> SQLite (MVP) / PostgreSQL (producción futura)
```

Estructura propuesta:

```text
devsure/
  apps/
    web/src/app/
    web/src/components/
    web/src/features/
    api/src/modules/
    api/src/common/
  packages/
    contracts/
    config/
  docs/
  .codex/agents/
```

Módulos NestJS:

- `auth`: inicio de sesión de administrador, refresh token y roles.
- `users`: usuarios administrativos.
- `technologies`: catálogo, categorías, nivel, estado destacado y orden.
- `services`: oferta comercial y tecnologías relacionadas.
- `projects`: portafolio, resultados, imágenes y relaciones tecnológicas.
- `team`: integrantes, cargos y enlaces.
- `testimonials`: testimonios aprobados.
- `leads`: contactos/cotizaciones y estado interno.
- `content`: ajustes globales, navegación, redes y SEO.
- `health`: estado de API y base de datos.

Configuración de arranque que debe mejorar la referencia Teslo:

- Prefijo versionado `/api/v1`; documentación en `/docs`, sin colisión de rutas.
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Configuración tipada y validada al iniciar; la aplicación debe fallar pronto si falta una variable.
- Helmet, CORS con orígenes configurados y límites de body.
- Filtro global de excepciones con respuesta estable y sin detalles internos.
- Cierre ordenado con `enableShutdownHooks()`.

## 6. Modelo de datos mínimo

- `User(id, email, passwordHash, role, isActive, createdAt, updatedAt)`
- `Technology(id, name, slug, category, summary, icon, level, featured, sortOrder)`
- `Service(id, title, slug, summary, body, icon, featured, published)`
- `Project(id, title, slug, summary, challenge, solution, results, coverImage, url, featured, published)`
- `TeamMember(id, name, role, bio, photo, links, sortOrder, published)`
- `Testimonial(id, author, position, company, quote, published)`
- `Lead(id, name, email, company, phone, service, budgetRange, message, status, consent, createdAt)`
- `SiteSetting(id, key, value)`
- Tablas puente: `service_technologies` y `project_technologies`.

Índices únicos para `slug` y `email`; paginación y filtros en los listados. Los campos del formulario deben validarse en frontend y API.

Para SQLite, usar `role` como enum/string si cada administrador tiene un rol. Si en el futuro se requieren varios roles o permisos, crear tablas `roles`, `permissions` y sus relaciones; no usar arrays del driver PostgreSQL.

## 7. API inicial

```text
GET    /api/v1/technologies
GET    /api/v1/services
GET    /api/v1/services/:slug
GET    /api/v1/projects
GET    /api/v1/projects/:slug
GET    /api/v1/team
GET    /api/v1/testimonials
POST   /api/v1/leads
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
CRUD   /api/v1/admin/*
GET    /api/v1/health
```

Usar DTOs con `class-validator`, `ValidationPipe` global (`whitelist` y `forbidNonWhitelisted`), rate limiting en autenticación/contacto, Helmet, CORS por allowlist y sanitización de contenido enriquecido.

Las respuestas públicas deben usar DTOs de salida y nunca serializar entidades TypeORM directamente. El contrato de login retorna identidad segura y sesión/token, jamás `passwordHash`.

## 8. Catálogo tecnológico del CV

El catálogo debe venir de la base de datos, no del código. Así se puede completar o corregir el CV desde `/admin` sin desplegar de nuevo.

Categorías sugeridas:

- Frontend
- Backend
- Mobile
- Bases de datos
- Cloud y DevOps
- Testing y calidad
- Datos e IA
- Arquitectura y herramientas

La lectura automática del PDF fue bloqueada por permisos de Windows. Antes de cargar los datos iniciales, sustituir esta sección por la lista exacta del CV o copiar el PDF al workspace. No asumir niveles de dominio únicamente por la aparición de una tecnología en el documento.

## 9. SEO, rendimiento y analítica

- Metadata por página, canonical, Open Graph y sitemap.
- JSON-LD de `Organization`, `Service` y `Article/CreativeWork` cuando corresponda.
- Objetivos Lighthouse: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95.
- Core Web Vitals y carga diferida de contenido visual.
- Analítica respetuosa con privacidad; agregarla solo después de definir proveedor y consentimiento.
- El formulario debe persistir el lead aunque falle una notificación externa.

## 10. Seguridad mínima

- Contraseñas con Argon2; nunca guardar tokens en texto plano.
- Cookies `httpOnly`, `secure` y `sameSite` cuando se use autenticación web.
- RBAC para `/admin`; el cliente nunca decide permisos.
- Sin registro público: crear el primer administrador mediante un comando/seed controlado y exigir cambio de contraseña.
- Rate limiting, límites de tamaño, protección anti-spam y honeypot en contacto.
- Variables mediante `.env`; entregar `.env.example` sin secretos.
- Dependencias auditadas y copias de seguridad antes de migraciones.
- Aviso de privacidad y consentimiento explícito para leads.
- Subidas de archivos autenticadas, con allowlist de MIME/extensión, inspección de firma, nombre generado, máximo de bytes y directorio no ejecutable.
- Seeds destructivos disponibles solo por CLI y entorno local/test, nunca mediante un controlador público.

## 11. Plan rápido por vertical slices

### Fase 0 - Fundaciones (0.5-1 día)

- Crear monorepo, lint, formato, variables, CI y Docker Compose opcional.
- Definir tokens de diseño, layout, header y footer.
- Configurar NestJS, TypeORM, migración inicial y Swagger.
- Portar de Teslo únicamente la forma modular, DTOs y autorización; escribir configuración y persistencia nuevas para SQLite.

### Fase 1 - Sitio navegable (1-2 días)

- Inicio, servicios, tecnologías, proyectos, nosotros y contacto con datos mock.
- Responsive, accesibilidad básica, loading/error/empty states.
- Criterio de salida: navegación completa y prueba Playwright del recorrido principal.

### Fase 2 - Contenido real (2-3 días)

- Entidades, migraciones, seed, endpoints públicos y conexión web-API.
- Filtros de tecnologías y páginas dinámicas de servicios/proyectos.
- Criterio de salida: cero contenido principal hardcodeado.

### Fase 3 - Conversión y administración (2-3 días)

- Leads, validación, anti-spam, autenticación y CRUD administrativo.
- SEO, Open Graph y observabilidad de errores.
- Criterio de salida: un administrador puede publicar contenido y gestionar leads.

### Fase 4 - Calidad y despliegue (1-2 días)

- Pruebas unitarias, integración, E2E, seguridad y rendimiento.
- Despliegue web/API, persistencia/backup de base de datos y smoke test.

## 12. Estrategia de agentes

Se incluyen cuatro agentes de proyecto en `.codex/agents/`, usando el formato TOML vigente de Codex:

- `devsure_architect`: contratos, modelo, ADRs y límites entre aplicaciones.
- `devsure_frontend`: UI Next.js, responsive, accesibilidad y SEO.
- `devsure_backend`: NestJS, TypeORM, seguridad y pruebas de API.
- `devsure_qa`: revisión transversal, E2E, regresiones y criterios de salida.

Forma de trabajo recomendada por cada slice:

1. Arquitectura define aceptación, contrato y migración; no implementa toda la feature.
2. Backend implementa entidad/migración/endpoint y pruebas.
3. Frontend implementa pantalla, estados y consumo del contrato.
4. QA ejecuta pruebas, informa por severidad y solo cierra con evidencia.
5. Integrar un slice antes de iniciar el siguiente; evitar ramas largas.

Los agentes pueden consultar `ADAPTACION-TESLO-A-DEVSURE.md` para distinguir patrones reutilizables de riesgos que deben corregirse.

Prompt de ejemplo:

```text
Usa el subagente devsure_architect para definir el slice “catálogo de tecnologías”.
Luego usa devsure_backend y devsure_frontend sobre el contrato acordado.
Finalmente usa devsure_qa para verificar los criterios de aceptación.
```

## 13. Plugins y herramientas

### Necesarios

Ningún plugin externo es obligatorio para construir el MVP. Codex, terminal, Git, Node.js, pnpm, navegador de pruebas y los subagentes del proyecto son suficientes.

### Opcionales

- **GitHub**: útil al crear repositorio remoto, issues, pull requests y CI colaborativo.
- **Figma**: útil si existe un diseño fuente que deba inspeccionarse o mantenerse sincronizado.
- **Canva**: útil para piezas de marketing, no para implementar la interfaz.
- **Cloudflare**: útil más adelante para dominio, DNS, seguridad perimetral o despliegue compatible.

No instalar plugins por anticipado. Conectar únicamente el servicio que entre en el flujo real y revisar sus permisos antes de usarlo.

## 14. Definition of Done por feature

- Criterios de aceptación cumplidos.
- Migración reversible y seed actualizado cuando aplica.
- Validación y manejo de errores en ambos extremos.
- Estados loading, empty, error y success.
- Responsive y accesible con teclado.
- Pruebas unitarias/integración y al menos un flujo E2E crítico.
- Sin secretos, errores de lint, tipos ni pruebas fallidas.
- Documentación OpenAPI y README actualizados.

## 15. Primer slice recomendado

Construir primero **Tecnologías** porque valida toda la arquitectura con poco riesgo:

- Backend: entidad, migración, seed, filtros y endpoint paginado.
- Frontend: página, buscador, chips de categoría, tarjetas y estados.
- Admin: puede esperar a la Fase 3; inicialmente se edita el seed.
- QA: filtro, búsqueda, URL compartible, teclado, responsive y respuesta vacía.

Después: Servicios -> Proyectos -> Contacto/leads -> Administración.
