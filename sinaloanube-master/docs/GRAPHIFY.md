# Análisis del proyecto con Graphify

Fecha: 2026-09-08. Herramienta instalada: `graphifyy==0.9.56`, mediante
`uv tool install graphifyy`, aislada en el usuario de Windows.
Paquete oficial: https://github.com/Graphify-Labs/graphify

## Punto de entrada obligatorio para IA

Leer este documento y el [informe generado](../graphify-out/GRAPH_REPORT.md)
antes de explorar código. Hacer consultas acotadas al grafo y verificar los
archivos citados antes de modificar comportamiento. La regla principal vive
en `AGENTS.md`; CLAUDE.md, GEMINI.md, Cursor y Copilot remiten a ella.
Estas instrucciones dependen de que cada asistente lea y respete sus archivos
de configuración; no son un bloqueo técnico universal.

## Resultado y alcance

- 128 archivos clasificados como código; 629 nodos, 1182 relaciones y
  61 comunidades calculadas por Graphify.
- [graph.json](../graphify-out/graph.json): grafo consultable.
- [graph.html](../graphify-out/graph.html): mapa interactivo para navegador.
- [GRAPH_REPORT.md](../graphify-out/GRAPH_REPORT.md): informe automático.
- `graphify-out/manifest.json`: inventario y huellas de la extracción.
- Extracción local AST con `--code-only`; sin llamadas a modelos externos.
  Este documento complementa el grafo con lectura del código y del documento
  de despliegue, realizada por el asistente; no es salida automática de Graphify.
- `.graphifyignore` excluye secretos, almacenamiento, dependencias, archivos
  públicos y salidas generadas. Se omitieron cuatro documentos en la extracción
  automática, archivos sin clasificación (incluido CSS) y `.npmrc` por precaución.

## Arquitectura observada

El proyecto es un sitio comercial de Sinaloa Nube con gestión de contenido y
prospectos. `composer.json` declara Laravel `^13.17`, Filament `5.7` y PHP `^8.3`.
El frontend usa vistas Blade, Tailwind CSS 4 y Vite 8 según `package.json`.
Estas son restricciones declaradas, no versiones verificadas en ejecución.

1. **Sitio público.** `routes/web.php` define portada, contacto, casos y aviso
   de privacidad. `LandingController` carga la portada. `CasoController`
   lista casos publicados, filtra por servicio y rechaza detalles no publicados.
   `AppServiceProvider` comparte ajustes y existencia de casos mediante
   compositores de vistas; no todo pasa explícitamente por los controladores.
2. **Captación.** `POST /contacto` tiene límite `throttle:6,1`.
   `StoreLeadRequest` valida, normaliza nombre/correo y añade una trampa antispam.
   `LeadController::store` guarda el prospecto antes de solicitar los avisos.
   `avisar` captura errores de despacho para no perder la captura del contacto.
3. **Notificaciones.** `NuevoLeadRecibido` implementa `ShouldQueue` y selecciona
   correo, Telegram y WhatsApp según ajustes e integraciones activadas.
   `GraciasPorContactarnos` envía el acuse. Los canales HTTP tienen límites de
   tiempo y reintentos. El comportamiento real de cola depende del entorno;
   no se comprobó entrega ni configuración de un trabajador.
4. **Panel.** `AdminPanelProvider` monta Filament en `/admin` con autenticación.
   Los recursos administran leads, clientes, casos, servicios y preguntas.
   Las páginas `AjustesDelSitio` e `Integraciones` configuran contenido y avisos.
5. **Datos compartidos.** `Ajuste::actuales` mantiene una caché de atributos
   invalidada al guardar o eliminar. `Integration` oculta sus credenciales y
   delega su cifrado a `IntegrationCredentials`, con clave independiente
   `INTEGRATIONS_ENCRYPTION_KEY`.
6. **Inicialización.** `DatabaseSeeder` crea el administrador inicial,
   contenido e integraciones desactivadas. El seeder privado de demostración
   se invoca sólo si existe su clase. Consultar también
   [DESPLIEGUE.md](DESPLIEGUE.md); no ejecutar seeders para explorar el proyecto.

## Puntos a revisar antes de cambios

- Los nodos con más conexiones son `Lead` (39), `Ajuste` (34), `Caso` y
  `Servicio` (27 cada uno), `LeadResource` (26) e `Integration` (25).
  Sus cambios pueden afectar varios módulos; usar consultas de impacto.
- `User::canAccessPanel` devuelve `true`: cualquier usuario autenticado puede
  acceder al panel. Es una decisión explícita del código, no separación por roles.
- `DatabaseSeeder` contiene una contraseña inicial fija. Antes de un despliegue
  nuevo, revisar el aprovisionamiento y cambio de contraseña. No se comprobaron
  cuentas ni credenciales de una base de datos real.
- Preservar la invalidación de caché de ajustes y el guardado del lead antes
  de los avisos. Un fallo asíncrono de cola ocurre fuera del `try/catch` del
  controlador y necesita seguimiento del trabajador.
- El informe automático redondea porcentajes: muestra 100% EXTRACTED y también
  declara tres relaciones INFERRED. Revisar la etiqueta de cada relación en
  el JSON; no interpretar el porcentaje como ausencia absoluta de inferencias.

## Consultar y regenerar

Ejecutar desde la raíz del proyecto. En Windows, si `graphify` no está en PATH,
usar el ejecutable instalado en el usuario:

```powershell
$graphifyExe = Join-Path $env:USERPROFILE '.local\bin\graphify.exe'
& $graphifyExe query 'LeadController' --budget 1800
& $graphifyExe explain 'Integration'
& $graphifyExe affected 'Ajuste'
& $graphifyExe god-nodes --top 10
```

Regenerar después de añadir, modificar o eliminar código, cambiar dependencias
declaradas o ajustar `.graphifyignore`. Ante dudas de vigencia, regenerar antes
de confiar en las relaciones:

```powershell
& $graphifyExe extract . --code-only --max-workers 2 --force
if ($LASTEXITCODE -ne 0) { throw 'Falló la extracción de Graphify' }
& $graphifyExe cluster-only . --no-label
if ($LASTEXITCODE -ne 0) { throw 'Falló la generación del informe de Graphify' }
```

Si el comando está en PATH, `graphify` sustituye a `& $graphifyExe`.
No hace falta activar Python ni instalar PHP, Composer o Boost para estos pasos.
`--no-label` evita llamadas a modelos para nombrar comunidades. La regeneración
sobrescribe los artefactos automáticos, pero no actualiza este análisis manual:
revisar su fecha, cifras y conclusiones tras cambios relevantes.
No hay vigilancia automática; no se instalaron hooks. Esta carpeta no contiene
`.git`, por lo que no se creó commit ni se vinculó la extracción a una revisión.

## Validación y límites

Se completaron la extracción y la generación de HTML/informe, y se ejecutaron
consultas reales de `LeadController` y de nodos principales. El grafo es una
ayuda de navegación estática: Blade, descubrimiento de Filament, callbacks,
facades y relaciones Eloquent pueden no quedar totalmente representados.
Las comunidades son agrupaciones del algoritmo, no módulos definidos por el equipo.

Existen pruebas de contacto, casos, contenido, panel e integraciones en
`tests/Feature`. No se ejecutaron pruebas de Laravel ni se arrancó el sitio:
el alcance acordado es Graphify y análisis estático, sin instalar dependencias
de la aplicación. Esto no constituye una auditoría exhaustiva de seguridad ni
una comprobación de producción.
