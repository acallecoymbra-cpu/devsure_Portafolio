# Cómo iniciar DevSure y ejecutar sus agentes

## 1. Crear o elegir la carpeta real del proyecto

No desarrolles dentro de la carpeta `outputs`. Crea una carpeta nueva, por ejemplo `C:\proyectos\devsure`, y ábrela como proyecto en Codex.

Después copia a la raíz del proyecto:

```text
AGENTS.md
PLAN-DEVSure.md
ADAPTACION-TESLO-A-DEVSURE.md
.codex/
```

La estructura inicial debe verse así:

```text
devsure/
  .codex/
    config.toml
    agents/
      devsure-architect.toml
      devsure-backend.toml
      devsure-frontend.toml
      devsure-qa.toml
  AGENTS.md
  PLAN-DEVSure.md
  ADAPTACION-TESLO-A-DEVSURE.md
```

Inicia Git desde esa carpeta:

```powershell
git init
```

## 2. Hacer que Codex cargue el proyecto

Abre una tarea nueva con la carpeta `devsure` como workspace. Esto permite que Codex lea `AGENTS.md`, `.codex/config.toml` y los agentes personalizados desde el inicio.

Primer prompt de verificación:

```text
Lee AGENTS.md y la configuración de .codex. Enumera los agentes DevSure disponibles y resume cuándo usar cada uno. No modifiques archivos.
```

Los nombres para invocarlos son:

- `devsure_architect`
- `devsure_backend`
- `devsure_frontend`
- `devsure_qa`

## 3. Ejecutar el arquitecto

Usa este prompt antes de crear código:

```text
Usa el subagente devsure_architect para definir la Fase 0 de DevSure. Debe entregar la estructura exacta del monorepo, scripts, dependencias, variables de entorno, configuración TypeORM/SQLite, primera migración y criterios de aceptación. Espera su resultado y luego preséntame el plan para aprobación. No escribas código todavía.
```

## 4. Crear las fundaciones

Cuando el plan sea correcto:

```text
Implementa la Fase 0 aprobada. Crea el monorepo pnpm con apps/web en Next.js y apps/api en NestJS, configuración compartida, TypeORM con SQLite y synchronize desactivado. No implementes aún autenticación ni panel administrativo. Ejecuta instalación, lint, typecheck, pruebas disponibles y build. Resume los archivos creados y cualquier fallo real.
```

El agente principal puede hacer esta tarea. No es necesario forzar cuatro agentes para el scaffolding.

## 5. Primer vertical slice: tecnologías

### Contrato

```text
Usa devsure_architect para definir únicamente el slice Catálogo de tecnologías: entidad, migración, seed, DTOs, endpoints públicos, filtros, contrato frontend y criterios E2E. No edites archivos. Espera su resultado y resume el contrato.
```

### Backend

```text
Usa devsure_backend para implementar el backend del contrato aprobado de Catálogo de tecnologías. Limita los cambios a apps/api y packages/contracts. Crea migración, seed idempotente, endpoints, validación, OpenAPI y pruebas. Ejecuta las verificaciones del backend y devuelve evidencia.
```

### Frontend

Ejecuta este paso después de estabilizar el contrato del backend:

```text
Usa devsure_frontend para implementar la página /tecnologias usando el contrato aprobado. Incluye búsqueda, filtros, URL compartible, tarjetas y estados loading, empty y error. Verifica responsive, accesibilidad, SEO, pruebas y build. Limita cambios a apps/web y packages/contracts.
```

### QA

```text
Usa devsure_qa para revisar el slice completo de Tecnologías. Ejecuta lint, typecheck, pruebas de API, Playwright y build. Comprueba el checklist Teslo, accesibilidad, responsive, errores y seguridad. No edites código. Devuelve hallazgos por severidad y evidencia de lo que pasó.
```

Si QA encuentra defectos, pide al agente responsable corregir solo esos hallazgos y vuelve a ejecutar QA.

## 6. Orden de los siguientes slices

Repite el mismo ciclo:

```text
Arquitecto -> Backend -> Frontend -> QA
```

Orden recomendado:

1. Tecnologías.
2. Servicios.
3. Proyectos/casos de éxito.
4. Contacto y leads.
5. Autenticación administrativa.
6. CRUD del panel administrativo.
7. Media/imagenes.
8. SEO, analítica, endurecimiento y despliegue.

## 7. Cuándo usar agentes en paralelo

Paraleliza exploración, revisión o pruebas independientes. Para escritura, mantén backend y frontend secuenciales al principio. Solo ejecútalos en paralelo cuando el contrato esté cerrado y sus carpetas no se solapen.

Prompt paralelo seguro:

```text
Delega en paralelo: devsure_backend debe revisar la cobertura de apps/api y devsure_frontend debe revisar accesibilidad de apps/web. Ninguno debe editar archivos. Espera ambos resultados y consolida los hallazgos.
```

## 8. Ver actividad y controlar agentes

En la aplicación de escritorio, la actividad de los subagentes aparece dentro de la tarea; puedes abrir cada hilo para inspeccionarlo. Puedes pedir al agente principal que detenga o redirija un subagente.

En Codex CLI, usa:

```text
/agent
```

para ver y cambiar entre hilos de agentes activos.

## 9. Ejecutar la aplicación

Los comandos finales dependerán de los scripts creados en Fase 0. La convención recomendada desde la raíz será:

```powershell
pnpm install
pnpm dev
```

Y para verificar:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

No ejecutes esos comandos hasta que exista el `package.json` del monorepo. El frontend normalmente estará en `http://localhost:3000` y la API en `http://localhost:3001/api/v1`; confirma los puertos reales en `.env.example`.

## 10. Si Codex no reconoce los agentes

Comprueba:

- Estás trabajando desde la raíz correcta del proyecto.
- Los archivos están en `.codex/agents/*.toml`.
- Cada archivo contiene `name`, `description` y `developer_instructions`.
- `.codex/config.toml` tiene `agents.enabled = true`.
- Abriste una tarea nueva después de copiar la configuración.
- El nombre usado en el prompt coincide exactamente.

Prompt de diagnóstico:

```text
Inspecciona .codex/config.toml y .codex/agents. Explica por qué Codex podría no reconocer los agentes personalizados. No cambies archivos.
```
