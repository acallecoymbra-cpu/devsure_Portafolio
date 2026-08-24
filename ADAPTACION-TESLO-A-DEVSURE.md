# Adaptación de Teslo Shop a DevSure

## Propósito

Este documento registra qué se aprendió de los dos ZIP compartidos y cómo usar ese aprendizaje sin convertir DevSure en una copia de una tienda o de un ejercicio de curso.

## Diagnóstico de las referencias

### Backend `nest-teslo-shop-fin-seccion-15`

Es una API NestJS modular con:

- NestJS 11, TypeORM 0.3 y PostgreSQL.
- Productos e imágenes con relaciones TypeORM.
- Autenticación JWT, Passport, decoradores y roles.
- DTOs, validación global, Swagger y paginación.
- Subida/entrega de archivos locales.
- Seed destructivo.
- Gateway Socket.IO autenticado con JWT.
- Docker Compose para PostgreSQL.

### Front `-nest-teslo-shop-front-main`

Es una demostración Vite + TypeScript sin framework de UI. Su único propósito es conectarse al gateway Socket.IO, mostrar clientes conectados y enviar mensajes. No contiene catálogo, navegación, autenticación web completa, diseño reutilizable ni patrones de Next.js.

Conclusión: crear `apps/web` desde cero con Next.js. Conservar el cliente Socket.IO únicamente como material de aprendizaje; no incluir tiempo real en el MVP.

## Mapeo de conceptos

```text
Teslo Product             -> DevSure Technology / Service / Project
Teslo ProductImage        -> DevSure ProjectMedia
Teslo User                -> DevSure AdminUser
Teslo PaginationDto       -> DevSure PageQueryDto
Teslo Auth decorator      -> DevSure @Auth(...roles)
Teslo Seed                -> DevSure seed local idempotente
Teslo Files               -> DevSure Media (fase posterior)
Teslo MessagesWs          -> Sin equivalente en el MVP
```

No convertir una sola entidad `Product` en un modelo genérico para todo. `Technology`, `Service` y `Project` tienen ciclos de vida y campos distintos; deben ser módulos separados con relaciones explícitas.

## Patrones que sí se conservan

### Módulos por dominio

Cada feature mantiene `module`, `controller`, `service`, `dto` y `entities`. `common` debe contener infraestructura transversal pequeña, no lógica de dominio.

### DTOs y validación

- DTO de entrada por operación.
- `PartialType` para actualizaciones cuando todas las reglas parciales sean correctas.
- Transformación explícita de query params.
- DTO de salida para impedir fugas de columnas privadas.
- Swagger derivado del contrato real.

### Autorización declarativa

Conservar la idea de un decorador `@Auth(...roles)` que compone autenticación y RBAC. Mejorar la semántica de errores: ausencia/invalidación de identidad es `401`; identidad válida sin rol suficiente es `403`.

### Transacciones

Conservar transacciones en operaciones con varias tablas, por ejemplo actualizar un proyecto y reemplazar su galería/tecnologías. Liberar el query runner en `finally` para cubrir todos los caminos.

## Cambios obligatorios

### Persistencia

- Cambiar PostgreSQL por SQLite en el MVP.
- `synchronize: false`; generar migración inicial.
- Reemplazar arrays de roles/tags/sizes por string enum, `simple-json` no consultable o, preferentemente, relaciones.
- No basar errores en `23505`; crear un adaptador o revisar restricciones conocidas.
- Búsquedas case-insensitive compatibles con ambos motores; aislar cualquier diferencia.
- Seed idempotente con `upsert`, no “borrar todo” salvo test aislado.

### Autenticación

- No exponer `POST /auth/register` públicamente.
- Crear administrador mediante comando local o migración/seed seguro.
- Hash y comparación asíncronos con Argon2.
- Nunca retornar la entidad seleccionada con `passwordHash`.
- Tokens cortos; si hay refresh token, rotarlo y almacenar solo su hash.
- Para el panel web, preferir cookie `httpOnly` segura en vez de almacenamiento accesible desde JavaScript.
- Rate limit y auditoría de intentos de login sin registrar contraseñas/tokens.

### Archivos

No son parte del primer slice. Al incorporarlos:

- Proteger el endpoint con rol administrativo.
- Limitar tamaño y cantidad.
- Verificar MIME, extensión y firma del archivo.
- Generar nombre independiente del usuario.
- Guardar metadatos y limpiar archivos huérfanos.
- Abstraer almacenamiento para poder pasar de disco a S3/R2.

### Configuración HTTP

- `/api/v1` para API y `/docs` para Swagger.
- `transform: true` en `ValidationPipe`.
- CORS con allowlist, Helmet y límite de body.
- Configuración validada al arrancar.
- Error envelope consistente, por ejemplo `{ statusCode, code, message, requestId }`.

### WebSockets

No agregarlos hasta tener un caso de negocio verificable. Si después se implementa soporte/chat, autenticar en el handshake estándar, restringir origen, validar cada evento y definir rate limiting.

## Secuencia de migración práctica

1. Crear el monorepo nuevo; no descomprimir Teslo dentro de `apps/api`.
2. Copiar conceptualmente la separación de módulos, no archivos completos.
3. Configurar `ConfigModule`, SQLite y migraciones.
4. Implementar `technologies` con DTOs de entrada/salida, seed y pruebas.
5. Implementar `auth` nuevo aplicando las correcciones anteriores.
6. Añadir `services`, `projects` y relaciones.
7. Crear Next.js desde cero y consumir contratos versionados.
8. Incorporar media únicamente cuando el CRUD textual esté estable.

## Checklist para revisar código portado

- No queda ninguna referencia `Product`, `Teslo`, tienda, precio, stock, género o talla.
- No queda `synchronize: true`.
- No hay columnas `array: true`.
- No hay código dependiente de `23505`.
- No hay endpoints públicos de registro, seed o upload administrativo.
- Ninguna respuesta contiene `password` o `passwordHash`.
- No se copió Socket.IO sin un criterio de aceptación.
- Cada endpoint tiene validación, autorización apropiada y pruebas.
- El frontend es Next.js y no depende del demo Vite.
