# ADR 0001: sesión administrativa y alcance portable

- Estado: aceptado
- Fecha: 2026-09-04

## Contexto

`Portfolio/ADMIN-PORTABLE-SPEC.md` describe un CMS personal multi-tenant extraído de
Laravel/Filament. DevSure es, en cambio, un sitio corporativo cuyo primer dominio
persistido es el catálogo de tecnologías. Portar las quince áreas de Filament en un
solo cambio mezclaría conceptos no aprobados (CV personal, experiencias por owner,
blog y redes globales) y rompería la estrategia de slices pequeños del proyecto.

El panel necesita cerrar el circuito ya existente: un administrador debe poder
crear un borrador de tecnología, publicarlo y verlo en el catálogo público sin un
nuevo despliegue.

## Decisión

El primer slice del backoffice administra `Technology` y añade autenticación para
un rol `ADMIN`. No habrá registro público.

La autenticación web usa una sesión opaca revocable:

- el navegador recibe una cookie de sesión `httpOnly`, `SameSite=Lax` y `Secure`
  en producción;
- la base de datos conserva únicamente hashes de los secretos de sesión;
- las mutaciones requieren un token CSRF asociado a la sesión;
- cerrar sesión revoca la sesión persistida;
- las contraseñas se verifican con Argon2 de forma asíncrona.

El primer administrador se crea mediante una CLI local y debe cambiar su
contraseña inicial antes de gestionar tecnologías. La API aplica esta restricción;
la interfaz muestra el formulario obligatorio. El cambio de contraseña revoca las
sesiones anteriores y entrega una sesión nueva.

Login, consulta de sesión y cambio de contraseña retornan una identidad segura
con `mustChangePassword` y un `csrfToken`. El frontend conserva este último solo
en memoria y lo envía como `X-CSRF-Token` en las mutaciones. Consultar la sesión
permite recuperarlo al recargar la página, sin depender de una cookie legible por
JavaScript entre subdominios. El token CSRF se deriva del secreto de sesión y solo
su hash se persiste; consultar la sesión no lo rota, para permitir varias pestañas.
Web y API deben pertenecer al mismo sitio para usar `SameSite=Lax` y sus orígenes
deben estar configurados en la allowlist CORS.

Las rutas permanecen bajo `/api/v1`. Los contratos públicos y administrativos son
DTOs; ninguna entidad TypeORM se serializa como contrato. Los cambios de esquema
se realizan con migraciones y `synchronize` continúa desactivado.

No se adopta `owner_id` en este slice: DevSure tiene un catálogo corporativo único.
Si el producto incorpora organizaciones o múltiples equipos administradores, se
diseñará el tenant explícitamente antes de añadirlo a todas las tablas.

## Consecuencias

- El logout y la revocación son efectivos sin mantener una lista adicional de JWT.
- Cada petición autenticada consulta una sesión persistida; para el MVP de un panel
  pequeño este coste es aceptable.
- El frontend y la API deben habilitar credenciales CORS y conservar el token CSRF.
- Profile, Projects/Media, Services, Leads/Inbox y contenido editorial se entregarán
  en slices posteriores sobre la misma fundación.
- Experiences, CV personal, Blog, Networks multi-owner e i18n editorial no se
  incorporan hasta existir un requisito de producto DevSure aprobado.
