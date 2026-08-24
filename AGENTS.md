# Guía de trabajo de DevSure

## Contexto

DevSure es un sitio corporativo y catálogo tecnológico construido como monorepo pnpm con `apps/web` (Next.js App Router) y `apps/api` (NestJS, TypeORM y SQLite).

Antes de implementar, consulta:

- `PLAN-DEVSure.md` para alcance y arquitectura.
- `ADAPTACION-TESLO-A-DEVSURE.md` si se reutiliza algún patrón de Teslo.

## Reglas persistentes

- Trabaja por vertical slices y mantén cambios pequeños y revisables.
- No copies marca, textos, activos ni composición exacta del sitio de referencia.
- No inventes tecnologías del CV; el catálogo debe ser administrable.
- Usa migraciones TypeORM y mantén `synchronize: false`.
- No expongas entidades TypeORM directamente como contrato público.
- Nunca incluyas secretos, tokens, contraseñas o hashes en código, logs o respuestas.
- SQLite es el motor del MVP; evita dependencias innecesarias del driver para permitir migrar a PostgreSQL.
- No agregues WebSockets, pagos, LMS, microservicios ni integraciones externas sin un requisito aprobado.
- Conserva cambios ajenos y no modifiques archivos fuera del slice.

## Verificación

Antes de declarar una tarea completa, ejecuta los scripts disponibles equivalentes a:

- lint
- typecheck
- pruebas unitarias e integración
- pruebas E2E del recorrido modificado
- build de producción

Si el proyecto todavía no tiene un script requerido, informa el vacío y propone añadirlo. No afirmes que una prueba pasó si no se ejecutó.

## Delegación

- Usa `devsure_architect` antes de cambios de contrato o modelo.
- Usa `devsure_backend` para `apps/api`.
- Usa `devsure_frontend` para `apps/web`.
- Usa `devsure_qa` antes de cerrar un slice.
- Evita que dos agentes editen el mismo archivo simultáneamente.
