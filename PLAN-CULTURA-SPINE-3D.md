# Plan de implementación: columna vertebral 3D en `/cultura`

## 0. Cómo continuar este plan (leer primero)

Este documento existe para que el trabajo sobreviva a un corte de contexto o de
tokens: **cualquier sesión/IA que retome este trabajo debe leer primero la
sección 3 (Estado actual / progreso) antes de tocar código.**

Reglas para quien continúe:

1. No reabrir decisiones ya cerradas en la sección 2 sin que el usuario lo pida
   explícitamente. Si algo de la sección 2 resulta imposible en la práctica,
   documenta por qué en la sección 3 antes de desviarte.
2. Trabaja **un slice a la vez** (sección 4). No adelantes trabajo de un slice
   posterior mientras el actual no cumpla su criterio de salida.
3. Antes de terminar la sesión (por límite de tokens, o porque el slice quedó
   listo), **actualiza la tabla de la sección 3**: estado, fecha, qué se hizo,
   qué falta, y cualquier decisión nueva que haya que registrar en la sección 2
   o en "Decisiones abiertas" de la sección 5.
4. Verifica con los comandos de la sección 6 antes de marcar un slice como
   hecho. Un slice no está "hecho" si `pnpm typecheck` o los tests del slice
   fallan.
5. No commitees a menos que el usuario lo pida explícitamente (regla general
   del proyecto, no específica de este plan).

## 1. Contexto y referencia

El usuario compartió una grabación de pantalla de
`activetheory.net/work` (estudio creativo conocido por experiencias WebGL).
Frames extraídos y analizados en la sesión que originó este plan muestran:

- Una **columna vertical de bloques/segmentos en 3D** (la "columna vertebral")
  fija al centro de la pantalla mientras la cámara avanza con el scroll.
- **Tarjetas de proyecto en 3D** que aparecen alternando izquierda/derecha a
  lo largo de esa columna, con perspectiva y rotación.
- Un **glitch de textura y texto** (RGB split, bloques, ruido) al entrar/salir
  cada tarjeta.
- Todo corre en **WebGL** con una cámara que se mueve con el scroll (no es
  CSS/JS simple).

Ya existe en este repo una **versión CSS/JS ligera** de esta idea, shippeada
antes de este plan, en:

- `apps/web/src/features/culture/components/culture-spine.tsx`
- `apps/web/src/features/culture/culture.module.css` (clases `.spine*`)

Esa versión usa `useInView` (`apps/web/src/lib/use-in-view.ts`) para revelar
cada `cultureStory` (de `apps/web/src/features/culture/culture-content.ts`)
alternando lado, con un glitch de texto (`text-shadow`) y de imagen
(`clip-path` + `filter`) al entrar en viewport. **Es accesible, indexable por
SEO, no requiere WebGL y ya pasa sus tests.**

Este plan **no la reemplaza todavía**: la usa como *fallback* obligatorio
(sección 2.4) mientras se construye la versión 3D fiel al video, por etapas.

## 2. Decisiones cerradas (no reabrir sin pedirlo el usuario)

### 2.1 Librería 3D: Three.js "a pelo", sin React Three Fiber

Se usa `three` importado e instanciado imperativamente dentro de un
`useEffect`, **no** `@react-three/fiber`/`@react-three/drei`.

Por qué: el repo ya tiene un patrón establecido para efectos imperativos
ligados al scroll —`apps/web/src/components/parallax-background.tsx`— que
usa un `ref`, un `useEffect`, y GSAP ScrollTrigger, manteniendo React solo
para estructura/SSR. Meter R3F encima añadiría un segundo modelo de
renderizado reactivo (el de R3F) superpuesto al de React, más
`@react-three/fiber` + `@react-three/drei` + probablemente
`@react-three/postprocessing` como dependencias nuevas, para una escena que
no necesita un grafo de escena declarativo reutilizable: es una coreografía
de cámara+objetos hecha a medida y ligada 1:1 al scroll de una sola sección.

### 2.2 Progreso de scroll: listener nativo con medición fresca, sin caché (revisado)

**Decisión original (Slice 2), luego revisada en el Slice 7:** se empezó
usando un `ScrollTrigger` de GSAP (`scrub: true`), igual que
`parallax-background.tsx`. Un usuario real reportó que la cámara nunca se
movía al escrolear, aunque la columna sí se veía. La causa más probable:
`ScrollTrigger` mide la posición de su `trigger` contra el documento en el
momento en que se crea, y solo la vuelve a medir en sus propios eventos de
resize/refresh — si algo por encima de la sección cambia de tamaño después
de esa medición (fuentes, cualquier reflow tardío) antes del primer scroll
del usuario, sus límites `start`/`end` quedan apuntando a coordenadas
viejas. Se probó primero un `ScrollTrigger.refresh()` forzado en
`load`/`document.fonts.ready`, pero para no depender de adivinar cuándo ya
es "seguro" medir, se cambió a algo más simple y imposible de dejar
desincronizado: **un listener de `scroll`/`resize` en `window` (pasivo,
con throttle a `requestAnimationFrame`) que en cada tick llama a
`container.getBoundingClientRect()` y calcula el progreso al vuelo,
siempre a partir del layout actual, nunca de un valor cacheado.**

`gsap`/`ScrollTrigger` siguen instalados y `parallax-background.tsx` los
sigue usando sin problema (ese caso no depende de nada por encima que
pueda desplazarlo de forma tardía) — este cambio es específico del motor
del spine, no una desinstalación general de GSAP del proyecto.

El progreso se escribe en una variable/closure que el `render()` de
Three.js lee en el mismo tick — **nunca** un `setState` de React por cada
evento de scroll.

### 2.3 El texto real vive en el DOM, siempre

Kicker, título y descripción de cada `cultureStory` deben seguir existiendo
como HTML real (no solo dibujados en un canvas/textura), por accesibilidad
(lectores de pantalla) y SEO (crawlers no ejecutan WebGL). El canvas WebGL es
una capa decorativa (`aria-hidden="true"`) que se apoya visualmente sobre o
junto al texto real. La forma exacta de posicionar ese texto junto a la
tarjeta 3D queda abierta en la sección 5 (es una decisión de diseño del
Slice 3, no de arquitectura general).

### 2.4 Fallback obligatorio: la versión CSS ya construida

El canvas 3D **solo se monta** si, en el cliente:

- `prefers-reduced-motion: reduce` es falso, **y**
- WebGL está disponible (`canvas.getContext('webgl2' || 'webgl')` no es
  `null`), **y**
- una heurística barata de gama del dispositivo pasa (a definir en el
  Slice 5; por ejemplo `navigator.hardwareConcurrency` y ancho de viewport).

Si cualquiera de esas condiciones falla, se renderiza
`<CultureSpine stories={cultureStories} />` (la versión CSS actual) sin
cambios. Esto significa que `CultureSpine` **no se borra**: pasa a ser el
fallback permanente, no un paso intermedio a eliminar.

### 2.5 Carga perezosa obligatoria

El motor Three.js (y su bundle) solo debe cargarse para quien realmente va a
ver la versión 3D. Se monta vía `next/dynamic` con `ssr: false` desde un
componente que decide primero (sección 2.4) si monta el motor 3D o el
fallback CSS, para que el bundle de Three.js no llegue nunca a quien recibe
el fallback.

## 2.6 Adición del Slice 7: la columna es un sprite de cuadros licenciados, no geometría procedural

**Esto reemplaza la descripción de la columna en la sección 1 y en el
Slice 1 — leer esta sección como la fuente de verdad actual, no aquéllas.**

Durante la revisión en vivo del Slice 7, el usuario pidió que la columna
girara de verdad (como en un video de referencia) y proporcionó 300
capturas de un clip de una columna vertebral rotando (efecto de
visualización de datos, estilo médico/partículas). **El usuario confirmó
explícitamente tener licencia/derechos para usar ese material
comercialmente en el sitio de DevSure** — sin esa confirmación no se
habría incrustado el asset en el repositorio.

Se construyó un atlas de sprites con `ffmpeg` a partir de esas 300
capturas: cada 3ª imagen (100 en total), reducidas a 200×113, ordenadas en
una grilla 10×10, exportadas como un único `.webp`
(`apps/web/public/culture/spine-frames-atlas.webp`, ~550 KB). La columna
procedural (icosaedros/cajas del Slice 1) **se eliminó por completo** de
`spine-engine.ts`; en su lugar, `createSpineSprite()` crea un solo
`THREE.Mesh` con un plano cuyo `THREE.Texture` usa `offset`/`repeat`
(propiedad nativa de Three.js, no un shader nuevo) para mostrar un cuadro
del atlas a la vez, recortado a la franja central de cada celda
(`ATLAS_CROP_X_FRACTION`) para que se vea como una columna vertical, no
como una imagen apaisada con relleno oscuro a los lados.

Esto obligó a rediseñar cómo se relacionan el scroll, la cámara y las
tarjetas (ver también la revisión de §2.2 sobre el mecanismo de scroll,
que sigue vigente sin cambios):

- **La cámara ya no viaja.** Antes recorría una columna de ~12.6 unidades
  de alto; ahora el sprite es un solo plano de altura fija
  (`SPINE_HEIGHT`), así que la cámara se encuadra una vez
  (`fitCameraToScene`) y se queda fija. El progreso de scroll ya no mueve
  `camera.position.y`.
- **El progreso ahora controla dos cosas directamente:** (1) qué cuadro
  del atlas muestra el sprite (`spine.setFrame(progress * (cuadros - 1))`
  — escrolear toda la sección hace un ciclo completo de giro), y (2) en
  qué punto de su banda de entrada/reposo/salida está cada tarjeta
  (`restAmountForLocalT`). Cada historia sigue teniendo un tercio del
  scroll total (`bandSize = 1 / stories.length`), igual que antes, pero
  ahora la tarjeta se desliza desde afuera de cuadro hacia una posición de
  reposo junto al sprite (en vez de estar fija en una altura Y de la
  columna que la cámara visitaba).
- El glitch por tarjeta (Slice 4) ahora se activa durante la
  entrada/salida del deslizamiento (`1 - restAmount`) en vez de la
  distancia cámara↔tarjeta — mismo shader, mismo `uIntensity`, solo cambia
  qué alimenta ese valor.
- `SCENE_HALF_WIDTH`/el encuadre de cámara ahora se basan en el ancho del
  sprite + una tarjeta en reposo, no en el ancho de la columna + tarjeta.
- Ya no hacen falta luces de escena (`keyLight`/`rimLight`/`AmbientLight`):
  la columna procedural era el único objeto de la escena que respondía a
  luces (`MeshStandardMaterial`); el sprite y las tarjetas usan materiales
  no iluminados (`MeshBasicMaterial` / el `ShaderMaterial` del glitch), así
  que las luces se eliminaron del archivo — ya no tenían ningún efecto.

## 2.7 Adición del Slice 9: la columna es fondo fijo detrás de 3 secciones más, no solo de sus propias tarjetas

El usuario pidió explícitamente (tras ver el resultado del Slice 8) que la
columna se viera más grande, se pareciera más a
`videos muestra/ezgif-45046542574f79a8-jpg/ezgif-frame-001.jpg` (partículas +
anillos orbitando, no solo cromado liso), y que se extendiera para ocupar
"Lo que cuidamos", "Nuestra medida" y "Confianza compartida" — no solo su
propia sección de historias.

**Decisión cerrada, consultada explícitamente con el usuario:** esas 3
secciones **mantienen su contenido/layout actual sin rediseñar** (grid de
principios, cita, carrusel de empresas) — la columna pasa a ser un **fondo
fijo** detrás de ellas (técnica CSS grid-overlap: `spineBackgroundRegion` /
`spineStickyLayer` / `spineForegroundLayer` en `culture.module.css`), no se
convierten en tarjetas 3D como las historias. Si se quisiera esa alternativa
más adelante, es un cambio grande y debe volver a consultarse, no asumirse.

El motor ahora separa **dos progresos** (ver `spine-engine.ts`): uno crudo
sobre *todo* el rango combinado (rotación de columna + curva de cámara,
Slice 8.1/8.2, sin cambios de lógica) y uno derivado
(`storyProgress`) que solo cubre la sub-porción dedicada a las 3 tarjetas
(medido en fresco vía `computeStoryFraction`, mismo espíritu que §2.2), se
satura en 1 y se queda ahí el resto del scroll. Esto es lo que permite que
la columna se vea "viva" (rotando) detrás de contenido que ya no tiene
tarjetas propias.

## 3. Estado actual / progreso

**Actualizar esta tabla antes de terminar cualquier sesión de trabajo.**

| Slice | Nombre | Estado | Última actualización | Notas |
|---|---|---|---|---|
| 0 | Setup y spike | ✅ Hecho | 2026-09-10 | Cubo placeholder mostrado detrás de la condición de capacidades; fallback CSS intacto |
| 1 | Geometría estática de la columna | ✅ Hecho | 2026-09-10 | Columna real (icosaedros/cajas facetados) encuadrada en los 4 breakpoints; cubo placeholder eliminado |
| 2 | Scroll → progreso → cámara | ✅ Hecho | 2026-09-10 | Cámara viaja en Y con `ScrollTrigger scrub:true`; verificado con valores reales, no solo capturas |
| 3 | Tarjetas 3D alternadas + copy real | ✅ Hecho | 2026-09-10 | 3 tarjetas con imagen real, caption HTML visible (opción 2 de la decisión abierta) |
| 4 | Shader de glitch | ✅ Hecho | 2026-09-10 | Shader propio por tarjeta (RGB split + bandas); `GlitchPass` evaluado y descartado |
| 5 | Fallback, capacidades y accesibilidad | ✅ Hecho | 2026-09-10 | 4 escenarios de capacidad + teclado (Tab/PageDown) verificados con Playwright, no a ojo |
| 6 | Rendimiento, code-splitting, tests | ✅ Hecho | 2026-09-10 | Bundle separado confirmado (build real), 8 ciclos de navegación sin fugas, suite e2e corregida |
| 7 | Decisión de despliegue final | 🚧 En progreso | 2026-09-10 | Usuario decidió subir a fidelidad real (Slice 8) antes de cerrar esto |
| 8.1 | Columna: reflexión/refracción real | ✅ Hecho | 2026-09-10 | Implementado por otra herramienta (Codex/Copilot CLI), revisado y verificado por Claude |
| 8.2 | Cámara por curva spline (además de la rotación) | ✅ Hecho | 2026-09-10 | Implementado directamente por Claude (el usuario pegó el prompt en el chat en vez de en Codex/Copilot) |
| 8.3 | Composite de transición a pantalla completa | ✅ Hecho | 2026-09-10 | Implementado directamente por Claude (el usuario dijo "hazlo tu tambien"); render-target chain propia, sin `EffectComposer` |
| 8.4 | Tarjetas: fresnel + ondulación idle | ✅ Hecho | 2026-09-10 | Implementado directamente por Claude, continuando el plan sin pedido explícito nuevo del usuario ("continúa con lo que estabas haciendo") |
| 9.1 | Escala: columna y tarjetas más grandes | ✅ Hecho | 2026-09-10 | Margen de cámara 1.35→1.12, `CARD_WIDTH` 2→2.4; pedido explícito del usuario |
| 9.2 | Material tipo partículas + anillos (parecido a la referencia) | ✅ Hecho | 2026-09-10 | Nuevo `spine-particles.ts`/`spine-rings.ts`, superpuesto al material de refracción del Slice 8.1 (no lo reemplaza) |
| 9.3 | Fondo fijo extendido sobre "Lo que cuidamos"/"Nuestra medida"/"Confianza compartida" | ✅ Hecho | 2026-09-10 | Grid CSS con capas superpuestas (`spineBackgroundRegion`); usuario eligió esta opción explícitamente sobre rediseñar esas secciones como tarjetas 3D |
| 9.4 | Tarjetas en órbita (no deslizamiento lateral) + movimiento más fluido + fondo atenuado al bajar | ✅ Hecho | 2026-09-11 | Pedido explícito del usuario con referencias visuales; incluye un bug real encontrado y corregido (superposición de textos en 360px) |
| 9.5 | Partículas con deriva aleatoria (gravedad cero) + columna un poco más grande | ✅ Hecho | 2026-09-11 | Usuario confirmó el Slice 9.4 ("super bonito") antes de pedir este ajuste |
| 9.6 | Fondo extendido hasta el hero ("Cultura DevSure") | ✅ Hecho | 2026-09-11 | Incluye un segundo bug real encontrado y corregido (caption superpuesto con el H1 del hero) |

Estados posibles: ⏳ Pendiente · 🚧 En progreso · ✅ Hecho · 🔴 Bloqueado (anota
por qué y qué se necesita para desbloquear).

### Bitácora (agregar una entrada nueva arriba cada vez que se trabaja algo)

- **2026-09-11 — Slice 9.6 completado (el usuario probó el Slice 9.5 y
  pidió que la columna esté de fondo también desde más arriba, desde el
  hero "Cultura DevSure"). Implementado directamente por Claude.**
  - **Restructuración:** el hero (`.hero`, "Cultura DevSure"/"Personas
    curiosas...") y la sección `storiesSection` (el encabezado "Quiénes
    somos", sin las tarjetas) ya no son secciones sueltas antes de
    `CultureSpineScene` en `app/cultura/page.tsx` — ahora se pasan como un
    nuevo prop `header` que viaja `page.tsx` → `CultureSpineScene` →
    `CultureSpine3D`, renderizado dentro de `.spineForegroundLayer` **antes**
    de `storySpacerRef` (mismo mecanismo de fondo fijo del Slice 9.3, solo
    que ahora arranca más arriba en el documento). En modo fallback CSS,
    `CultureSpineScene` simplemente renderiza `header` antes de
    `<CultureSpine>`, sin ningún truco de superposición.
  - **CSS:** `.hero` tenía un `linear-gradient` casi opaco
    (`rgba(20,27,54,0.82)`) pensado para un fondo de página plano — se
    aligeró a `0.3` y se quitó el `border-bottom` para que la columna se
    vea detrás, mismo criterio ya aplicado a `.principlesSection`/
    `.companiesSection` en el Slice 9.3.
  - **Segundo bug real de superposición de texto, encontrado y corregido
    (misma familia que el del Slice 9.4, pero en el otro extremo del
    rango):** con el hero ahora *antes* de `storySpacer` en el flujo, el
    caption de la historia activa (que se muestra mientras `activeIndex >=
    0`) aparecía **desde el primerísimo scroll de la página** — porque
    `storyProgress` ya vale 0 (su reposo natural) incluso con el hero
    todavía llenando la pantalla, y el código anterior trataba "progress <
    1" como "hay una tarjeta activa, mostrar su caption" sin exigir que el
    header ya hubiera pasado. Resultado visible en captura: el texto "01 ·
    Entender / Escuchamos antes de construir" superpuesto directamente
    sobre la última línea del `<h1>` del hero.
    - **Corrección:** `computeStoryProgress` se renombró a
      `computeStoryState` y ahora también devuelve `headerClearAmount` —
      un valor 0..1 suavizado (`THREE.MathUtils.smoothstep(-spacerRect.top,
      0, 120)`) que mide cuánto ha terminado de pasar el `storySpacer`'s
      *top* por encima del viewport (es decir, cuánto del header ya
      desapareció de pantalla). Tanto la aparición de las tarjetas
      (`fadeOut` ahora se multiplica por `headerClearAmount`, no solo por
      el smoothstep de salida) como el caption
      (`nextActiveIndex = headerClearAmount >= 1 && storyProgress < 1 ?
      frontIndex : -1`) quedan condicionados a que el header ya haya
      terminado de pasar — no solo la sección de historias en sí, sino
      también el hero que ahora la precede.
  - **Verificación:** `pnpm --filter @devsure/web typecheck`,
    `eslint src/features/culture src/app/cultura` y `node --test
    tests/*.test.mjs` (17/17) limpios. Con un script Playwright ad hoc
    (creado, corrido y borrado) contra el `pnpm dev` del usuario:
    - Captura en scroll `0` (tope de página): la columna con partículas y
      anillos se ve claramente detrás del `<h1>` del hero, sin ningún
      caption ni tarjeta superpuestos.
    - Barrido automatizado de 18 posiciones de scroll (cada 150px, de 0 a
      2600px) × 2 anchos (1440px y 360px), comparando las cajas
      delimitadoras del caption contra el `<h1>` del hero y el `<h2>` de
      "Quiénes somos" en cada punto: **cero solapamientos** en ambos
      anchos.
    - Captura adicional a media altura del hero: el encabezado "Quiénes
      somos" y el pie del hero ("La cultura no es una frase...") se leen
      con claridad sobre la columna, sin interferencia.
  - **Pendiente:** correr la suite e2e completa cuando el puerto quede
    libre (seguimos sin poder correrla por el mismo motivo que en 9.3/9.4:
    el `pnpm dev` del usuario ocupa el puerto 3000); que el usuario
    confirme en su propio navegador.
  - No se hizo commit (regla general del repo).

- **2026-09-11 — Slice 9.5 completado (el usuario probó el Slice 9.4 en su
  propio navegador — "ya lo probe en mi navegador esta super bonito" — y
  pidió dos ajustes puntuales: que las partículas se muevan de forma
  aleatoria con sensación de gravedad cero, y que la columna sea un poco
  más grande). Implementado directamente por Claude.**
  - **Partículas con deriva aleatoria:** `three/spine-particles.ts` ganó un
    método `update(elapsedSeconds)`. Cada partícula guarda su posición
    "base" (la muestreada al crear la nube, sin cambios) más una
    frecuencia y fase aleatorias **por partícula y por eje** (x/y/z
    independientes); en cada frame, `update()` recalcula la posición viva
    como `base + sin(elapsed * frecuencia + fase) * amplitud` y marca
    `positionAttribute.needsUpdate = true`. Como la deriva se recalcula
    siempre desde la posición base (nunca se acumula sobre sí misma), no
    hay riesgo de que una partícula se aleje para siempre — es un
    bamboleo lento y acotado alrededor de su lugar, no un paseo aleatorio
    sin límite. Al tener cada una su propia frecuencia/fase (aleatorias),
    2200 partículas nunca se mueven en sincronía — se lee como
    movimiento independiente/aleatorio, no como una sola ola. Conectado en
    `spine-engine.ts`: `particles.update(elapsed)` en el mismo loop
    continuo que ya alimenta `rings.update`/`uTime` (Slice 8.4/9.4).
  - **Columna un poco más grande:** en `three/spine-geometry.ts`, nueva
    constante `SPINE_SCALE = 1.15`. Las vértebras ahora viven en un
    sub-grupo interno `bones` (con `bones.scale.setScalar(SPINE_SCALE)`),
    separado del grupo externo `group` que `spine-engine.ts` sigue
    rotando y donde cuelga las partículas. `SPINE_HEIGHT`/`SPINE_HALF_WIDTH`
    (exportados, consumidos por `spine-engine.ts` para el encuadre de
    cámara y por `spine-particles.ts` para el radio de la nube) se
    multiplican por el mismo `SPINE_SCALE`, para que el aura de partículas
    crezca en proporción con la malla real en vez de quedar chica alrededor
    de una columna ahora más grande.
    - **Bug evitado, no solo corregido:** la primera idea (escalar
      directamente el `group` que se retorna) habría escalado el mismo
      factor **dos veces** sobre las partículas — una vez porque ya se
      usa `SPINE_HALF_WIDTH` ajustado para calcular su radio, y otra vez
      por heredar la transformación del `group` padre (las partículas se
      agregan como hijas de ese grupo en `spine-engine.ts`). Se detectó
      antes de verificar visualmente, solo con seguir el flujo de datos, y
      se resolvió con el sub-grupo `bones` separado.
  - **Por qué agrandar la columna es un lever distinto al zoom de cámara
    del Slice 9.1:** `fitDistanceForScene` siempre encuadra automáticamente
    toda la escena — si se agranda la geometría de la columna sin más, la
    cámara simplemente se aleja la misma proporción y el tamaño en pantalla
    no cambia. Escalar la malla de las vértebras específicamente, sin que
    eso mueva el punto de referencia que usa el encuadre por ancho
    (`SCENE_HALF_WIDTH`, que depende de `ORBIT_RADIUS`, no de
    `SPINE_HALF_WIDTH`, desde el Slice 9.4), es lo que permite que la
    columna se vea más grande de verdad sin que la cámara lo cancele.
  - **Verificación:** `pnpm --filter @devsure/web typecheck` y
    `eslint src/features/culture` limpios; `node --test tests/*.test.mjs`
    17/17 (sin cambios de estructura que afectaran esos tests). Con un
    script Playwright ad hoc contra el `pnpm dev` del usuario: capturas de
    la columna sin errores de consola; 3 capturas de una zona recortada
    alrededor de la columna, separadas 900ms cada una, **todas distintas
    entre sí** sin haber escroleado — confirma que la deriva de partículas
    realmente anima el render por el paso del tiempo, no solo que el
    código corre. Revisé también 360px y 768px de ancho: la columna más
    grande no se recorta ni distorsiona en ninguno de los dos.
  - **Pendiente:** que el usuario confirme en su propio navegador que la
    amplitud/velocidad de la deriva (`driftAmplitude = halfWidth * 0.22`,
    frecuencias entre 0.08 y 0.3) y el nuevo tamaño (`SPINE_SCALE = 1.15`)
    se sienten bien — son constantes de una línea cada una si hace falta
    ajustar.
  - No se hizo commit (regla general del repo).

- **2026-09-11 — Slice 9.4 completado (pedido explícito del usuario con
  referencias visuales: dos capturas de `activetheory.net` mostrando
  tarjetas orbitando alrededor de la columna en distintos ángulos/planos,
  más el pedido de que el giro/flotado se sienta más fluido y que la
  columna se atenúe al bajar a las demás secciones). Implementado
  directamente por Claude.**
  - **Tarjetas en órbita, no deslizamiento lateral:** en
    `three/spine-engine.ts` se eliminó por completo el sistema de bandas
    (`restAmountForLocalT`, `CARD_REST_OFFSET`, `CARD_TRAVEL`, `CARD_GAP`,
    `CARD_LEAN_RADIANS`). Cada tarjeta ahora tiene un ángulo base
    (`(index / stories.length) * 2π`, repartido en partes iguales) y órbita
    sobre un anillo de radio fijo (`ORBIT_RADIUS = 2.6`) mientras
    `storyProgress` avanza (`ORBIT_TURNS = 1`, una vuelta completa a lo
    largo del sub-rango de historias). `mesh.rotation.y = angle` hace que
    cada tarjeta "mire hacia afuera" en su posición orbital — como
    consecuencia gratuita, una tarjeta al otro lado de la columna queda con
    su cara alejada de la cámara y el backface-culling por defecto de
    Three.js la oculta solo, sin lógica extra. La tarjeta "activa" (para el
    caption HTML y el disparo del glitch de transición) es la que tiene
    mayor `frontAmount = (cos(angle)+1)/2` en cada instante, no un índice de
    banda fijo. `SCENE_HALF_WIDTH` pasó a basarse en `ORBIT_RADIUS` en vez
    de `CARD_REST_OFFSET`.
  - **Movimiento más fluido + flotado lento tipo espacio:** se fusionaron
    el loop de scroll (antes con su propio rAF-throttle llamando a
    `applyProgress`) y el loop idle del Slice 8.4 en **un solo loop
    continuo** (`frame()`). Cada frame mide el progreso crudo
    (`progressFromLayout()`, siempre en fresco) y lo suaviza hacia un
    `smoothedProgress` con `THREE.MathUtils.damp` (`PROGRESS_DAMPING =
    4.5`, independiente del framerate) antes de aplicarlo — esto es lo que
    hace que la rotación de la columna y la órbita de cámara se sientan
    fluidas en vez de saltar 1:1 con cada tick de scroll. Además, cada
    tarjeta tiene un balanceo vertical lento e independiente
    (`Math.sin(elapsed * CARD_FLOAT_SPEED + index * 2.1) *
    CARD_FLOAT_AMPLITUDE`) atado al reloj de pared, no al scroll — de ahí
    el "flotando en el espacio" pedido.
  - **Consecuencia arquitectónica de fusionar los loops:** como el loop
    continuo ya mide `getBoundingClientRect()` en cada frame, **se eliminó
    el listener de `scroll`** por completo (ya no hace falta, nunca puede
    quedar "atrasado" de un evento). Solo queda el listener de `resize`
    (cambia el tamaño real del canvas/render targets, sigue siendo un
    evento genuino, no algo para medir cada frame). Esto es una evolución
    más de la filosofía de "nunca cachear, medir siempre en fresco" del
    §2.2 — ahora ni siquiera depende de que el navegador dispare el evento
    de scroll correctamente.
  - **Fondo atenuado al bajar (el pedido de "un fondo más claro"):** nuevo
    elemento `scrim` (prop `scrim: HTMLElement` en `SpineEngineElements`,
    `scrimRef`/`.spineScrim` en `culture-spine-3d.tsx`/`culture.module.css`)
    — un overlay con gradiente oscuro dentro de `.spineStickyLayer`, cuya
    opacidad el motor sube (`THREE.MathUtils.smoothstep(storyProgress,
    0.82, 1) * 0.72`) a medida que `storyProgress` se acerca a 1. **Nota de
    interpretación:** el usuario pidió un fondo "más claro"; dado que todo
    el sitio usa texto claro sobre fondo oscuro, aclarar literalmente el
    fondo (a blanco/gris claro) rompería el contraste con el texto — se
    interpretó como "que la columna moleste menos/se vea más calma", que en
    un tema oscuro se logra oscureciendo/atenuando la escena 3D, no
    aclarándola. **Marcado explícitamente para que el usuario confirme si
    esta interpretación es la correcta** al verlo en su propio navegador;
    si en realidad quería un fondo literalmente claro, es un cambio de
    color en `.spineScrim`, no de mecanismo.
  - **Bug real encontrado y corregido durante la verificación (no un
    problema menor):** la primera versión de `storyProgress` (Slice 9.3)
    calculaba una fracción aproximada (`spacerHeight / wrapperHeight`), que
    resultó ser una aproximación con margen de error real — un
    script de Playwright ad hoc en 360px de ancho capturó el caption de la
    historia ("La calidad se demuestra") **superpuesto en el mismo lugar de
    pantalla** que el encabezado real de "Lo que cuidamos", ilegibles ambos
    a la vez. Causa: la fracción aproximada no correspondía exactamente al
    momento en que el contenido real (`principlesSection`) empieza a
    aparecer en pantalla — hay una diferencia de hasta un `viewportHeight`
    completo de scroll entre ambas definiciones. Se corrigió con
    `computeStoryProgress()`, que mide directamente la posición real del
    `storySpacer` (`storySpacer.getBoundingClientRect()`) en vez de
    comparar alturas de otros elementos — reemplaza el primer intento
    (`-rect.top / rect.height`, que **también** resultó insuficiente,
    todavía dejaba solapamiento porque no restaba `innerHeight`) por
    `(rect.height - rect.bottom) / (rect.height - innerHeight)`, que llega
    a 1 exactamente cuando el fondo del spacer alcanza el fondo del
    viewport (el instante justo antes de que cualquier píxel del contenido
    real pueda aparecer). Verificado con un script que compara las cajas
    delimitadoras (`boundingBox()`) del caption y del encabezado de
    principios en 11 puntos de scroll × 3 anchos (360/768/1440px): **cero
    solapamientos** tras el fix.
  - **Verificación:** `pnpm --filter @devsure/web typecheck`,
    `eslint src/features/culture src/app/cultura
    tests/culture-structure.test.mjs` y `node --test tests/*.test.mjs`
    (17/17) limpios — se actualizó `tests/culture-structure.test.mjs`
    porque ya no hay listener de `scroll` que verificar (ahora exige
    `requestAnimationFrame`/`cancelAnimationFrame` en su lugar). Verificado
    con capturas reales contra el `pnpm dev` del usuario en el puerto 3000
    (no se corrió la suite e2e completa por la misma razón de puertos que
    en el Slice 9.3): las tarjetas se ven claramente rotando/orbitando
    alrededor de la columna en distintos ángulos (de frente, de perfil, en
    diagonal) en vez de deslizarse lateralmente; dos capturas separadas
    900ms en el mismo punto de scroll son distintas (confirma el flotado
    idle); la columna se ve visiblemente atenuada/oscurecida al llegar a
    "Nuestra medida"; sin recorte en 360/768/1440px; cero errores de
    consola relevantes en ningún caso.
  - **Pendiente:** correr la suite e2e completa cuando el puerto quede
    libre; que el usuario confirme en su propio navegador si el
    atenuado/oscurecido logra lo que pedía con "fondo más claro" (ver nota
    de interpretación arriba), y si `ORBIT_RADIUS`/`PROGRESS_DAMPING`/las
    velocidades de flotado necesitan ajuste fino.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slices 9.1/9.2/9.3 completados (pedido explícito del
  usuario tras ver el resultado del Slice 8: "la columna se ve muy chica",
  compartió `videos muestra/ezgif-45046542574f79a8-jpg/ezgif-frame-001.jpg`
  como referencia de look, y pidió que el fondo 3D se extendiera sobre "Lo
  que cuidamos"/"Nuestra medida"/"Confianza compartida"). Implementado
  directamente por Claude.**
  - **Decisión consultada al usuario antes de tocar el layout** (única
    parte genuinamente ambigua del pedido): ¿la columna pasa a ser un
    **fondo fijo detrás del contenido ya existente** de esas 3 secciones
    (sin rediseñarlas), o esas 3 secciones se **rediseñan como tarjetas
    3D** igual que las historias? El usuario eligió la primera opción
    (fondo fijo, menor riesgo, no toca el grid de principios/la cita/el
    carrusel de empresas que ya funcionan bien).
  - **9.1 — Escala:** `fitDistanceForScene` en `spine-engine.ts` bajó su
    margen de `1.35` a `1.12` (la cámara auto-encuadra toda la escena
    siempre, así que agrandar la geometría por sí sola no cambia el
    tamaño en pantalla — la única palanca real es acercar la cámara,
    reduciendo el margen de aire alrededor de la escena). `CARD_WIDTH` sub
    de `2` a `2.4`. Combinado, la columna y las tarjetas ocupan
    notablemente más del cuadro.
  - **9.2 — Material tipo partículas + anillos:** dos archivos nuevos,
    ambos capas *adicionales* sobre la columna procedural + material de
    refracción del Slice 8.1 (no lo reemplazan):
    - `three/spine-particles.ts`: una nube de ~2200 puntos
      (`THREE.Points`, `AdditiveBlending`) en teal/coral/blanco dispersos
      en una cáscara cilíndrica alrededor de la columna — el "polvo de
      datos" de la imagen de referencia. Es hija de `spine.group`, así que
      rota junto con la columna sin lógica propia.
    - `three/spine-rings.ts`: 3 anillos finos (`THREE.Line`), inclinados
      en ángulos distintos, cada uno girando a su propia velocidad
      (algunos en sentido contrario) alrededor de su propio eje Y,
      alimentados por el mismo reloj de pared del loop idle (Slice 8.4:
      `runIdleLoop` ahora también llama `rings.update(elapsed)`) — no
      dependen del scroll, así que siguen girando en reposo. Se agregan
      directo a la escena (no a `spine.group`), para que su rotación no se
      componga con la de la columna.
    - Ninguno de los dos necesitó tocar `spine-refraction.ts`: al no ser
      `spine.group`, aparecen en ambas pasadas del render de refracción
      (la oculta y la visible) igual que las tarjetas, sin caso especial.
  - **9.3 — Fondo fijo extendido:** el cambio más grande, en 4 archivos:
    - `culture.module.css`: `.spineScrollWrapper`/`.spine3dCanvas` se
      renombraron a `.spineBackgroundRegion` (contenedor `display: grid`
      de una columna) y `.spineStickyLayer`; ambos hijos comparten la
      misma celda de grid (`grid-area: 1 / 1`) en vez de ser
      wrapper+sticky-child anidados — el truco estándar de "fondo sticky
      detrás de contenido que se sigue desplazando encima", porque ahora
      el contenido que se desplaza (`.spineForegroundLayer`, con un nuevo
      spacer `.spineStorySpacer` de `240vh` seguido de las 3 secciones
      reales) necesita ocupar la MISMA celda que la capa fija, no ser un
      hermano posterior. Se le quitaron el fondo opaco y el borde a la
      capa sticky (ya no tiene sentido con contenido semi-transparente
      encima durante un tramo de scroll mucho más largo), y se aligeraron
      los fondos de `.principlesSection` (a `transparent`) y
      `.companiesSection` (gradiente mucho más tenue) para que la columna
      se vea detrás.
    - `three/spine-engine.ts`: `SpineEngineElements` ganó `storySpacer`
      (el elemento marcador de cuánto del rango combinado de scroll
      pertenece a las 3 tarjetas). Nueva `computeStoryFraction()` (medida
      en fresco cada tick, mismo principio de "nunca cachear" que
      `progressFromLayout`) = altura del spacer / altura total del
      wrapper. `applyProgress` ahora separa dos progresos: el crudo
      (`rawProgress`, 0..1 sobre TODO el rango combinado) sigue moviendo
      la rotación de la columna y la curva de cámara — así el fondo sigue
      "vivo" mientras se escrollea "Lo que cuidamos"/"Nuestra
      medida"/"Confianza compartida" —, y uno derivado
      (`storyProgress = min(1, rawProgress / storyFraction)`) que alimenta
      las bandas/posiciones de las 3 tarjetas, se satura en 1 al terminar
      su sub-rango y se queda ahí (todas las tarjetas completamente
      "salidas") durante el resto del scroll. `onActiveIndexChange` ahora
      puede recibir `-1` (ninguna historia activa) una vez pasado ese
      punto. También subió `SPINE_ROTATION_CYCLES` (nueva constante, 2.5)
      porque un solo giro de 2π ya no alcanza para un rango de scroll
      mucho más largo. `CARD_TRAVEL` subió de 3 a 5 tras un hallazgo
      visual (ver verificación abajo).
    - `components/culture-spine-3d.tsx`: acepta un nuevo prop `foreground`
      (las 3 secciones reales) además de `children` (el overlay de
      caption, sin cambios de rol); ahora renderiza
      `.spineBackgroundRegion` con las dos capas superpuestas y el nuevo
      `storySpacerRef`.
    - `components/culture-spine-scene.tsx`: acepta `children` (las 3
      secciones, pasadas desde `page.tsx`) y se los pasa a
      `CultureSpine3D` como `foreground`; en modo fallback (CSS) los
      renderiza normal, sin ningún truco de superposición, justo después
      de `<CultureSpine>`. `activeIndex === -1` ahora oculta el caption
      overlay (`activeStory = null`).
    - `app/cultura/page.tsx`: `storiesSection` ahora contiene *solo* el
      encabezado ("Una forma de trabajar…"); `CultureSpineScene` pasó a
      ser un hermano posterior (ya no anidado dentro de `storiesSection`)
      que envuelve las 3 secciones (`principlesSection`,
      `manifestoSection`, `companiesSection`) como children — necesario
      para que el truco de grid-overlap funcione (esas 3 secciones deben
      compartir contenedor con la capa sticky) sin romper el test e2e que
      cuenta encabezados `h3` dentro de `#nuestra-forma-de-trabajar` (ver
      abajo).
    - `tests/e2e/culture-spine-3d.spec.ts`: `spineScrollWrapper` →
      `spineBackgroundRegion` en el locator del wrapper; el conteo de
      `h3` que antes se acotaba a `#nuestra-forma-de-trabajar` (que ya no
      contendría solo el caption, sino también los `h3` de
      `principlesGrid` una vez anidados) se movió a acotar por
      `[class*="spineCaptionOverlay"]` en su lugar — más específico y
      correcto independientemente de dónde viva el caption en el DOM.
  - **Verificación:** `pnpm --filter @devsure/web typecheck` y
    `eslint src/features/culture src/app/cultura
    tests/e2e/culture-spine-3d.spec.ts` limpios; `node --test
    tests/*.test.mjs` 17/17. La suite e2e completa
    (`playwright test tests/e2e/culture.spec.ts
    tests/e2e/culture-spine-3d.spec.ts`) **no se corrió esta vez** — el
    `pnpm dev` propio del usuario ya estaba corriendo en el puerto 3000, y
    el webServer de Playwright necesita ese mismo puerto libre; no se
    detuvo el servidor del usuario para no interrumpir su sesión. **Queda
    pendiente correrla** en cuanto el puerto esté libre.
    - **Verificación real hecha en su lugar:** un script Playwright ad hoc
      (creado, corrido y borrado, junto con sus capturas) apuntando
      directo al `pnpm dev` del usuario en `localhost:3000` (en vez de al
      webServer propio de Playwright) — forzó WebGL
      (`--use-gl=swiftshader`), montó el canvas, y capturó pantalla en 3
      puntos del rango combinado (≈2%, 55%, 92% de `spineBackgroundRegion`,
      que midió ~4625px de alto total). Confirmó con capturas reales (no
      solo por inspección de código): (1) la columna se ve notablemente
      más grande, con la nube de partículas y los anillos orbitando,
      bastante más parecida a la referencia que el cromado liso del Slice
      8; (2) al 55% del rango — dentro de "Lo que cuidamos"/"Nuestra
      medida" — la columna es visible *detrás* de las tarjetas de
      principios y del texto de la cita, confirmando que el truco de fondo
      fijo funciona; (3) al 92% — cerca del final de "Confianza
      compartida" — el pin se libera correctamente y `closingSection`
      aparece debajo sin ninguna capa 3D residual. Cero errores de consola
      relevantes (`WebGLProgram`/`VALIDATE_STATUS`/`GL_INVALID`/"feedback
      loop"/"incomplete framebuffer") en ningún punto.
    - **Bug real encontrado y corregido durante esa misma verificación:**
      la primera pasada mostró una tarjeta "salida" (ya debería estar
      completamente fuera de cuadro) asomando como una miniatura
      glitcheada en una esquina durante la fase de fondo — el margen de
      cámara más ajustado (9.1) dejaba el borde del frustum más cerca de
      `CARD_REST_OFFSET + CARD_TRAVEL` de lo que dejaba el margen viejo.
      Subir `CARD_TRAVEL` de 3 a 5 lo resolvió; reconfirmado con una
      segunda pasada de capturas en el mismo punto de scroll, sin la
      miniatura.
  - **Pendiente/no calibrado:** `SPINE_ROTATION_CYCLES = 2.5`, el margen
    de cámara `1.12`, y el ancho de tarjeta `2.4` son una primera pasada,
    no ajustados a ojo junto con el usuario todavía — si al verlo en su
    propio navegador pide más/menos giro o más/menos zoom, son constantes
    de una sola línea cada una. También falta correr la suite e2e completa
    (ver arriba) y que el usuario confirme el resultado en su propio
    navegador antes de dar esto por cerrado.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 8.4 completado (hecho directamente por Claude — el
  usuario dijo "continúa con lo que estabas haciendo" al retomar la sesión,
  sin repetir el pedido puntual; se interpretó como "sigue con el siguiente
  slice pendiente del plan", que era 8.4, siguiendo la regla de la sección 0
  de trabajar un slice a la vez).**
  - **Decisiones tomadas (el plan las dejaba abiertas para quien
    implementara este slice, ver §4.1/Slice 8.4):**
    - El fresnel/ondulación quedó **siempre activo, independiente de
      `uIntensity`** (el glitch existente) — no solo mientras la tarjeta
      está en reposo. Razón: el criterio de salida pide que las tarjetas
      "se sientan vivas incluso cuando no están en su transición de
      entrada/salida", que es exactamente el período en que `uIntensity`
      es alto (transición) o cero (reposo) — atarlo a `restAmount` habría
      dejado a la tarjeta "muerta" visualmente en algún tramo.
    - Esto **introduce el primer loop de `requestAnimationFrame` continuo
      y permanente en `spine-engine.ts`** (documentado inline en el
      código): la ondulación idle necesita una fuente de tiempo de reloj
      de pared que siga corriendo aunque el usuario no escrolee, algo que
      ningún mecanismo existente ofrecía (el motor solo renderizaba en
      eventos de scroll/resize, más el loop transitorio y acotado de
      8.3). Es seguro porque `CultureSpineScene` ya condiciona el montaje
      completo de este motor a `canRender3DSpine()` (WebGL + sin
      reduced-motion + no gama baja) — un usuario que cae al fallback CSS
      nunca paga este costo.
    - Como consecuencia, se **quitó la llamada a `render()` dentro de
      `onScrollOrResize`**: con el loop idle ya renderizando cada frame,
      renderizar también ahí duplicaba el costo (dos pasadas extra de
      render target por el pipeline de refracción) en cada tick de
      scroll sin beneficio visual — ahora ese callback solo actualiza
      `applyProgress` y deja que el loop idle lo recoja en su próximo
      frame (retraso máximo de ~16ms, imperceptible).
  - **Archivos tocados:**
    - `three/glitch-card-material.ts`: vertex shader reescrito para
      desplazar la posición a lo largo de la normal local según dos senos
      superpuestos (`uTime`, con fase por tarjeta vía el `uSeed` que ya
      existía para el glitch); fragment shader con un término de fresnel
      (`pow(1 - dot(normal, viewDir), 2.5)`) sumado como resplandor de
      borde con el color de acento del sitio (`#3cd8c5`), siempre activo.
      Nuevo uniform `uTime`.
    - `three/spine-engine.ts`: `PlaneGeometry` de cada tarjeta ahora tiene
      subdivisiones (`CARD_SEGMENTS_X=12`, `CARD_SEGMENTS_Y=18`) — sin
      vértices interiores el desplazamiento de vértices solo mecía toda
      la tarjeta rígida alrededor de sus 4 esquinas, no se veía como una
      ondulación de superficie. Nuevo `THREE.Clock` + `runIdleLoop()` que
      alimenta `uTime` a las 3 materials y renderiza cada frame; se
      cancela en `dispose()` igual que los otros rAF del motor.
  - **Verificación:** `pnpm --filter @devsure/web typecheck` y
    `eslint src/features/culture/three` limpios; `node --test
    tests/*.test.mjs` 17/17; `pnpm --filter @devsure/web exec playwright
    test tests/e2e/culture.spec.ts tests/e2e/culture-spine-3d.spec.ts` →
    11/12 (el único fallo sigue siendo el bug preexistente y ajeno del
    `<nav>` a 768px). Los 4 tests de `culture-spine-3d.spec.ts` pasan,
    incluyendo el que compara píxeles entre 3 ángulos de scroll — prueba
    de que este cambio no rompió el pipeline de refracción/composite
    existente.
    - **Verificación específica de este slice, con números, no a ojo**
      (la extensión de Chrome de esta sesión no estaba conectada, así
      que no hubo verificación visual manual en un navegador real esta
      vez — pendiente, ver nota abajo): un script Playwright ad hoc
      (creado, corrido y borrado — no quedó en el repo), calcado del
      patrón ya usado en `culture-spine-3d.spec.ts` (capturas con
      `page.screenshot({ clip })`, no `canvas.toDataURL()`, que resultó
      no ser fiable para esto — el primer intento con `toDataURL` dio
      frames idénticos incluso con el loop corriendo, probablemente por
      cómo Chromium headless maneja el backbuffer sin
      `preserveDrawingBuffer` fuera del mismo tick de render；
      `page.screenshot()` opera a nivel de compositor y sí lo capturó
      bien), dejó el scroll fijo en un punto intermedio (sin más scroll)
      y comparó 3 capturas espaciadas 900ms entre sí: **los 3 frames son
      distintos entre sí** pese a que nada más cambia (mismo progreso de
      scroll, misma cámara, misma rotación de columna) — confirma que el
      loop idle sí anima el fresnel/ondulación por el paso del reloj, no
      solo que el uniform existe. Cero errores de consola relevantes
      (`WebGLProgram`/`VALIDATE_STATUS`/`GL_INVALID`/"feedback
      loop"/"incomplete framebuffer").
  - **Pendiente de re-confirmar visualmente por el usuario en su propio
    navegador** (o por una sesión con la extensión de Chrome conectada):
    esta vez la verificación fue solo numérica/automatizada, no hubo
    inspección visual real de que la ondulación y el resplandor de fresnel
    *se vean bien* (proporciones, intensidad, si compite visualmente con
    el glitch existente) — dejé el servidor de desarrollo corriendo en
    segundo plano (`pnpm --filter @devsure/web dev`, puerto 3000) para
    facilitar esa revisión. Si el efecto se ve demasiado sutil o
    demasiado fuerte, ajustar las constantes del shader (amplitud de
    onda `0.05`/`0.03`, exponente de fresnel `2.5`, intensidad del
    resplandor `0.6`) es un cambio de una sola línea cada una, no
    estructural.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 8.3 completado (hecho directamente por Claude —
  el usuario dijo "hazlo tu tambien", continuando el mismo patrón del
  8.2).**
  - Archivos nuevos: `three/transition-composite-material.ts` (shader de
    quad de pantalla completa: banda radial + jitter de UV por ruido +
    split de canal RGB, todo escalado por `uProgress`; en `uProgress = 0`
    los tres canales muestrean el mismo UV, así que es un pass-through
    limpio de `uScene` cuando está inactivo, sin rama "limpia" separada)
    y `three/transition-composite.ts` (dueño del render target
    intermedio + el quad; expone `trigger()`, `isActive()`, `resize()`,
    `blit()`, `dispose()`; `uProgress` decae linealmente en 550ms desde
    `trigger()` usando `performance.now()` — reloj de pared, no scroll,
    así una transición que arranca a mitad de scroll termina igual
    aunque el usuario deje de scrollear).
  - `three/spine-refraction.ts`: `render()` ahora acepta un
    `outputTarget` opcional (default `null` = canvas). Antes siempre
    renderizaba la escena completa directo al canvas; ahora, cuando se le
    pasa el target intermedio del composite, la escena completa
    (refracción/reflexión incluida) se renderiza ahí primero y el
    composite la vuelve a dibujar sobre el canvas real después —
    encadenando dos render targets a mano en vez de usar
    `THREE.EffectComposer`, para mantener consistencia con el patrón ya
    usado en la refracción del Slice 8.1.
  - `three/spine-engine.ts`: se instancia `transition` junto a
    `refraction`; `render()` ahora llama
    `refraction.render(scene, camera, spine.group, transition.sceneTarget())`
    seguido de `transition.blit()`. En `applyProgress`, cuando cambia el
    índice de tarjeta activa se llama `transition.trigger()` y se arranca
    `runTransitionFrames()` (un loop de `requestAnimationFrame` acotado
    por `transition.isActive()`, para no dejar un rAF corriendo para
    siempre). `resize`/`dispose` de `transition` están enganchados junto
    a los de `refraction`.
  - **Verificación:** `tsc --noEmit` y `eslint src/features/culture/three`
    limpios; `node --test tests/*.test.mjs` 17/17;
    `culture-spine-3d.spec.ts` 4/4 (sin errores de WebGL ni de
    feedback-loop de framebuffer, que es justo el riesgo de encadenar
    render targets a mano); `culture.spec.ts` 7/8 (el mismo bug de
    overflow del `<nav>` a 768px, previo y fuera de alcance). Además se
    hizo una verificación manual con un script Playwright ad-hoc
    (`__scratch_check_transition.mjs`, ya borrado) capturando el estado
    antes/durante/después de la transición: el frame "asentado" (700ms
    después del trigger) coincide con un estado completamente decaído,
    confirmando que el mecanismo de decaimiento funciona.
  - **Nota de ajuste (no es bug):** el `smoothstep(0.0, 0.65, ...)` de la
    "banda" radial en el shader es bastante ancho, así que visualmente el
    efecto se lee más como un flash de pantalla completa que como un
    anillo de barrido angosto. Funciona y decae correctamente; si se
    quiere un efecto más parecido a un "wipe" ceñido habría que angostar
    ese rango (por ejemplo `smoothstep(0.0, 0.25, ...)`) — queda como
    posible pulido futuro, no como algo pendiente de esta slice.

- **2026-09-10 — Slice 8.2 completado (hecho directamente por Claude —
  el usuario copió el prompt pensado para Codex/Copilot CLI y lo pegó
  en este chat en su lugar; se interpretó como pedido de ejecutarlo aquí
  mismo).**
  - `three/spine-engine.ts`: `fitCameraToScene` se renombró a
    `fitDistanceForScene` (ahora *devuelve* la distancia en vez de
    asignarla directamente a `camera.position.z`) y se agregó
    `buildCameraPath(distance)`: una `THREE.CatmullRomCurve3` abierta de 6
    puntos de control, con desplazamientos laterales/verticales/de
    profundidad como fracciones de esa distancia (10%/5%/8%) — pequeños a
    propósito para quedarse bien dentro del margen de 1.35× que ya usaba
    el encuadre, y no recortar ni la columna ni las tarjetas en ningún
    punto del recorrido.
  - En `applyProgress`: además de la rotación de la columna del Slice 8.1
    (sin tocar, tal como pidió el usuario), ahora
    `camera.position` sigue `cameraPath.getPointAt(value)` y
    `camera.lookAt(...)` apunta mayormente al origen (donde está la
    columna) sesgado levemente hacia el punto siguiente de la curva
    (`getPointAt(value + 0.02)`), para que los giros se sientan como que
    la cámara "dobla" en esa dirección en vez de solo deslizarse de
    costado.
  - `cameraPath` se reconstruye en `handleResize` (con la nueva
    `fitDistanceForScene` recalculada para el aspect ratio actual) y se
    vuelve a aplicar vía `onScrollOrResize()`, igual patrón que ya existía
    para la refracción del Slice 8.1.
  - **Verificación:** `typecheck`/`eslint` limpios; `node --test
    tests/*.test.mjs` 17/17; `culture-spine-3d.spec.ts` 4/4 (incluye el
    test que compara píxeles entre 3 puntos de scroll y el que verifica
    que no hay errores de WebGL/recortes en los 4 breakpoints tras
    resize); `culture.spec.ts` 7/8 (el único fallo sigue siendo el bug
    preexistente y ajeno del `<nav>` a 768px). Además, verificación visual
    manual propia (no solo la del test automatizado): capturé pantallas en
    los 4 breakpoints del proyecto (360/768/1024/1440) en 3 puntos de
    scroll cada uno (inicio/medio/final) — la columna y las tarjetas se
    ven completas, sin recortes, en las 12 combinaciones. También lo vi
    en vivo en Chrome escroleando de verdad: el encuadre cambia de forma
    perceptible entre dos capturas separadas por poco scroll (no es un
    cambio sutil), confirmando que la cámara realmente se mueve por la
    curva y no quedó una ilusión óptica como pasó una vez en el Slice 2.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 8.1 completado (implementado por otra herramienta
  de IA vía CLI — Codex CLI o Copilot CLI, el usuario decide cuál usar en
  cada turno —, revisado y verificado a fondo por Claude).**
  - Este es el primer sub-slice del Slice 8 hecho por una herramienta
    distinta de la que escribió el plan, tal como se planteó explícitamente
    (turnos, no simultaneidad, para no pisarse sobre `spine-engine.ts`).
    **La herramienta que lo hizo no actualizó esta bitácora** — Claude la
    completa ahora, después de revisar el código línea por línea y
    correr toda la verificación, para que el hand-off al siguiente
    sub-slice (8.2) tenga contexto real y no quede un hueco.
  - **Archivos nuevos:**
    - `three/spine-geometry.ts`: geometría procedural de una columna
      vertebral real (13 "vértebras": un cuerpo octogonal biselado —
      4 anillos triangulados — más procesos laterales y un proceso
      posterior por segmento, con offset/rotación/escala determinísticos
      por segmento para que cada ángulo tenga una silueta distinta, no un
      cilindro liso). Exporta `SPINE_HEIGHT`/`SPINE_HALF_WIDTH` para que
      `spine-engine.ts` siga calculando el encuadre de cámara y la
      posición de reposo de las tarjetas igual que antes.
    - `three/spine-refraction.ts`: dueño del `THREE.WebGLRenderTarget`
      de refracción y del ciclo de dos pasadas por frame — (1) ocultar la
      columna, renderizar la escena al render target; (2) restaurar
      visibilidad y renderizar la escena completa al canvas real, con el
      material de la columna muestreando ese render target. `resize()`
      recrea el target al tamaño del canvas y dispone el anterior (sin
      fugas); usa `try/finally` para garantizar que la visibilidad de la
      columna se restaura incluso si el render de la primera pasada
      lanzara un error.
    - `three/spine-refraction-material.ts`: `ShaderMaterial` propio
      (no copiado de `SpineShader.glsl` de Active Theory — reimplementado
      desde cero con el mismo espíritu) con fresnel en view-space,
      muestreo del render target desplazado por la normal en
      screen-space (el "vidrio distorsionado"), un término de reflexión
      adicional, y un tinte iridiscente (`iridescence()`, coseno de 3
      fases) mezclado según el fresnel. Incluye `#include
      <tonemapping_fragment>`/`<colorspace_fragment>` — los chunks
      estándar de Three.js para que la salida respete el tonemapping/espacio
      de color configurado del renderer incluso en un `ShaderMaterial` a
      medida.
  - **Decisión de diseño que se desvía un poco del plan original de la
    sección 4.1:** en vez de mover la cámara por una curva (eso es
    formalmente el Slice 8.2), esta implementación hace que **la columna
    misma rote sobre su eje Y** en `applyProgress`
    (`spine.group.rotation.y = value * Math.PI * 2 + 0.3`), con la cámara
    fija (encuadrada una sola vez). Es una simplificación razonable y
    efectiva: ya resuelve el reclamo original del usuario ("que se vea
    girar") de forma inequívoca, es más simple/robusta que animar la
    cámara por una spline, y no impide hacer 8.2 después — de hecho puede
    quedar como el movimiento "base" mientras 8.2 agrega además un
    recorrido de cámara por curva encima. **Anotado para quien haga 8.2:**
    decidir con el usuario si la rotación de la columna se mantiene tal
    cual (y 8.2 solo agrega movimiento de cámara adicional) o si se
    reemplaza por completo por el enfoque de curva spline original.
  - **Bugs/mejoras que esta implementación corrigió respecto a lo que
    Claude había dejado en el Slice 7 (sin que se le pidiera explícitamente,
    buena señal de calidad):**
    - Guard `disposed` explícito en el listener de scroll y dentro del
      callback de `requestAnimationFrame` — evita que un
      `requestAnimationFrame` ya en vuelo aplique progreso/renderice
      después de que `dispose()` ya corrió.
    - `createCards` ahora recibe un callback `onTextureLoaded` (el propio
      `render`) para volver a renderizar en cuanto una textura de tarjeta
      termina de cargar, en vez de esperar al próximo tick de scroll.
    - `handleResize` vuelve a llamar `renderer.setPixelRatio(...)` (por si
      cambia el DPR, ej. mover la ventana a otro monitor) y a
      `refraction.resize()`.
  - **El atlas de sprites del Slice 7
    (`apps/web/public/culture/spine-frames-atlas.webp`, ~1.95 MB) ya no se
    usa** — confirmado con `grep` en todo `src/`, cero referencias. Se
    dejó el archivo sin borrar (tal como pedía el propio plan en la
    sección 4.1, "por si hay que volver atrás"). **Pendiente para más
    adelante:** decidir si se borra una vez que el Slice 8 se sienta
    estable, o si se documenta como intencionalmente conservado.
  - **Un test roto real, corregido por Claude (no un bug de la app):** el
    nuevo `culture-spine-3d.spec.ts` (mucho más riguroso que antes — ver
    abajo) tenía `expect.poll(...).toBeCloseTo(0, 0)` esperando que el
    canvas pegado (`sticky`) quedara exactamente en `y=0` al hacer scroll;
    en la práctica queda en `y≈1` porque `.spine3dCanvas` tiene
    `border-block: 1px solid var(--line)` desde el Slice 7 (intencional).
    Corregido a un rango tolerante (`y` entre -0.5 y 1.5) en vez de forzar
    exactamente 0.
  - **La expansión de `culture-spine-3d.spec.ts` en sí es un salto de
    calidad real, vale la pena que 8.2/8.3/8.4 sigan este nivel:** ahora
    incluye (además de los tests que ya existían) — (a) un test que
    escrolea a 3 fracciones distintas dentro del tramo "pinned", capturando
    un recorte de pantalla de la columna en cada una y verificando que los
    3 frames **no son idénticos** (prueba real de que algo visualmente
    distinto ocurre, no solo que una variable interna cambió), más
    aserciones de que no hay requests al atlas viejo y que no aparecen en
    consola errores típicos de WebGL mal configurado
    (`WebGLProgram`/`VALIDATE_STATUS`/`GL_INVALID`/"feedback loop"/"incomplete
    framebuffer" — exactamente la clase de error que un render-target mal
    manejado produciría); (b) verificación de que el buffer de dibujo del
    canvas coincide con `boundingClientRect × devicePixelRatio` en los 4
    breakpoints tras resize; (c) un test de ciclo de vida real: navegar
    fuera y volver 3 veces, confirmando exactamente 1 canvas cada vez que
    se vuelve a `/cultura` y 0 en `/` — el chequeo de fugas que antes solo
    se hacía a mano ahora es parte de la suite.
  - Verificación hecha por Claude tras la revisión: `pnpm --filter
    @devsure/web typecheck` y `eslint` limpios; `culture-structure.test.mjs`
    sigue pasando; `culture-spine-3d.spec.ts` **4/4** (tras el fix del
    test); `culture.spec.ts` **7/8** (el único fallo es el bug preexistente
    y ajeno del `<nav>` a 768px, ya documentado, no relacionado). Verificado
    también a ojo en Chrome real: la columna se ve genuinamente
    cromada/iridiscente con reflejos de color que cambian por segmento y
    rotan al escrolear — un salto visual real respecto al sprite plano del
    Slice 7.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Investigación: cómo construye Active Theory el efecto real
  (sin cambios de código todavía — esto es solo contexto para decidir el
  próximo paso con el usuario).**
  - El usuario pidió visitar `activetheory.net/work` en vivo y analizar una
    carpeta `C:\Users\aliva\activetheory.net` que había descargado de un
    repo de GitHub creyendo que era el código fuente del sitio.
  - **Aviso importante dado al usuario:** esa carpeta **no es el código del
    sitio**. La raíz está llena de archivos con nombres de rutas típicas de
    herramientas de reconocimiento/escaneo de seguridad (`admin.php`,
    `dana-na`, `CFIDE`, `owa`, `ise`, `magento_version`, artefactos de sondas
    de `Nmap` como la carpeta `"nice ports,"`, etc. — un wordlist clásico de
    fuerza bruta de directorios). Se confirmó que todos esos archivos son
    **bit a bit idénticos** entre sí (`cmp` no encontró diferencias): son
    copias repetidas del *shell* HTML de fallback de la SPA (el sitio
    devuelve esa misma página para cualquier ruta no reconocida), guardadas
    bajo cientos de nombres de wordlist por la herramienta que generó ese
    "archive". No tiene relación real con cómo Active Theory construye el
    efecto.
  - **Lo que sí es real y útil, dentro de `assets/`:** ahí sí hay contenido
    genuino (confirmable porque son rutas de archivos estáticos reales, no
    fallback de SPA):
    - `assets/geometry/spine/spine.bin` — la columna es un **mesh 3D real**
      (geometría binaria, probablemente GLTF/buffer), no un sprite ni una
      forma procedural genérica.
    - `assets/geometry/work/splines_anim4-SPLINES.json` — un array de
      puntos `(x,y,z)` que forma una **curva spline 3D** con giros reales
      (no una línea recta) — casi seguro la trayectoria de cámara/objetos
      de la página "work" atada al scroll. Esto explica por qué su cámara
      se siente mucho más dinámica que la nuestra (que solo traslada en Y).
    - `assets/shaders/compiled.vs` / `.fs` — un bundle de shaders GLSL
      concatenados con su propio formato de chunks (`{@}NombreDelShader{@}`).
      Adentro:
      - **`SpineShader.glsl`**: material de la columna con reflexión +
        refracción (`tBaseColor`, `tRefraction`, normal map, muestreo de UV
        en screen-space distorsionado por la normal) — un look
        vidrioso/metálico iridiscente, no una imagen plana. Coincide
        exactamente con lo que se ve en el sitio real (columna con reflejos
        de color, no una foto).
      - **`WorkItemShader.glsl`**: el material de cada tarjeta de proyecto —
        también con fresnel/reflexión/refracción, blend con video
        (`tVideo`), distorsión reactiva al mouse (`uMouse`, `uHover`), y una
        ondulación idle por vértice (`sin(time * 0.5 + ...)`). Mucho más
        rico que nuestro plano con shader de glitch simple.
      - **`WorkComposite.fs`**: un post-proceso de pantalla completa para
        las transiciones entre proyectos (wipe circular con ruido FBM,
        bloom, RGB shift) — el "glitch" real de Active Theory es un
        composite de pantalla completa en las transiciones, no (solo) un
        shader por tarjeta como el nuestro.
    - Confirmado visualmente entrando al sitio real (tras ~40s de
      precarga pesada — el preloader llega hasta ~100 assets): la columna
      se ve exactamente como el shader sugiere: un objeto 3D real,
      cromado/iridiscente, con reflejos de color cambiantes, muy distinto
      a nuestra imagen 2D girando.
  - **Conclusión para decidir con el usuario, no tomada unilateralmente:**
    replicar esto con fidelidad real implicaría: modelar o conseguir un
    mesh 3D de columna, animar una cámara por una curva spline en vez de
    una traslación lineal, escribir un material de refracción/reflexión
    con un render target adicional (renderizar la escena a una textura y
    volver a muestrearla — "screen-space refraction"), y un post-proceso de
    composición de pantalla completa para las transiciones. Es un salto de
    complejidad de varios órdenes de magnitud sobre lo construido hasta
    ahora (que ya cumple razonablemente el pedido original de "columna que
    gira mientras escroleo" con una técnica mucho más simple y liviana).
    Nada de esto se implementó todavía — queda para que el usuario decida
    si quiere subir la apuesta de fidelidad (y cuánto) o si la versión
    actual (atlas de sprites + tarjetas con glitch) es suficiente para el
    propósito de la página de cultura de DevSure.

- **2026-09-10 — Scroll "pinned" de varias pantallas + atlas en alta
  resolución (Slice 7, dos pedidos del usuario en un mismo mensaje).**
  - **Pedido 1 — "la imagen rotando tiene que durar durante todo el scroll
    hacia abajo":** el `100vh` del cambio anterior seguía siendo solo una
    pantalla; el usuario quiere que el giro se mantenga durante un tramo
    largo de scroll, como en el video de referencia original. Se
    implementó el patrón estándar para esto: un contenedor alto
    (`.spineScrollWrapper`, `height: 300vh`) envolviendo un elemento
    `position: sticky; top: 0; height: 100vh` (`.spine3dCanvas`, que
    conserva su nombre pero ahora es el elemento *pegado*, no el
    full-bleed — ese rol pasó al wrapper). Mientras el navegador scrollea
    el wrapper, el elemento sticky se queda anclado al viewport hasta que
    el wrapper se termina, dando ~200vh extra de scroll con el canvas fijo
    en pantalla.
    - `spine-engine.ts`: `mountSpineEngine` ahora recibe `{ scrollTrigger,
      canvasMount }` en vez de un solo elemento. `progressFromLayout()`
      mide `scrollTrigger` (el wrapper alto) — medir el elemento sticky en
      su lugar habría dado siempre `top: 0` una vez pegado, un cálculo de
      progreso degenerado. `canvasMount` (el div sticky interno) es donde
      vive el `<canvas>` real y de donde se leen las dimensiones para
      `renderer.setSize`/`camera.aspect`.
    - **Verificado con medición directa, no a ojo:** en un punto de scroll
      con el wrapper ya desplazado (`wrapperTop = -124.6px`), el canvas
      seguía en `canvasTop = 0` — confirma que el sticky funciona (el
      wrapper se mueve por debajo, el canvas se queda quieto en pantalla).
    - El caption ahora se renderiza *dentro* del área sticky, como un
      overlay (`.spineCaptionOverlay`, con un degradado oscuro abajo para
      legibilidad) en vez de debajo del canvas en el flujo normal —
      `CultureSpine3D` acepta `children` para esto; `CultureSpineScene` le
      pasa el caption envuelto en `.spineCaptionOverlay`.
    - `culture-spine-3d.spec.ts` actualizado: el `aria-hidden="true"` y el
      `<canvas>` ahora se buscan en `.spineCanvasMount` (el div interno),
      no en `.spine3dCanvas` (que ya no es aria-hidden, porque ahora
      también contiene el caption real).
  - **Pedido 2 — "mejora las imágenes ¿o hacer un video? la calidad está
    muy baja":** el usuario preguntó directamente por mi recomendación
    entre subir la resolución del atlas de sprites o cambiar a una
    textura de video (`<video>` + `VideoTexture`, buscando por
    `currentTime`). **Recomendación aplicada: subir la resolución del
    atlas, no cambiar a video.** Razón: un `<video>` escrubeado por scroll
    tiene un problema conocido de *seek lag* — cambiar `currentTime`
    muchas veces por segundo no siempre es instantáneo en todos los
    navegadores, lo que puede verse como micro-tirones al escrolear rápido
    (el problema clásico de "video con scroll" que varios sitios famosos
    resuelven con técnicas mucho más elaboradas). El mecanismo de atlas ya
    estaba probado y funcionando; subir su resolución es un cambio de una
    sola constante, de riesgo mucho menor. Si en el futuro la nitidez
    sigue sin convencer incluso a esta resolución, ahí sí vale la pena
    reconsiderar video — dejar anotado como decisión abierta, no cerrada
    para siempre.
    - Reconstruido con `ffmpeg`: mismo comando que antes pero
      `scale=400:225` en vez de `200:113` (el doble de resolución lineal,
      4× los píxeles), calidad WebP 82. Atlas final: 4000×2250 px, ~1.95
      MB (dentro del límite de tamaño de textura de ~4096px que soportan
      prácticamente todos los navegadores/GPUs, incluyendo móviles
      modestos). `ATLAS_CELL_ASPECT` en `spine-engine.ts` actualizado a
      `400 / 225` para que coincida exactamente.
  - Verificación: `typecheck`, `eslint` limpios; `culture-structure.test.mjs`
    pasa sin cambios; `culture-spine-3d.spec.ts` (2/2) y `culture.spec.ts`
    (7/8, el único fallo es el bug preexistente y ajeno del `<nav>` a
    768px) pasan vía `pnpm --filter @devsure/web exec playwright test`.
    Verificación visual en Chrome real confirmando el sticky (medido) y la
    nitidez notablemente mejor del atlas.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Canvas a pantalla completa (100vh), pedido del usuario
  tras confirmar que el giro sí se ve.**
  - `.spine3dCanvas` en `culture.module.css`: `height` pasó de `75vh` a
    `100vh` (`width: 100vw` ya estaba desde antes). El usuario pidió que
    ocupara "todo el ancho y alto de la página" como en el video de
    referencia original.
  - Verificado con medición directa (no capturas — a esta escala las
    capturas de la herramienta vienen re-escaladas y engañan a ojo, ya
    pasó antes en este plan): `getBoundingClientRect().height` del
    contenedor es exactamente igual a `window.innerHeight` en tiempo real.
  - `culture-structure.test.mjs` sigue pasando (no depende de la altura
    concreta). No se hizo commit.

- **2026-09-10 — Columna reemplazada por sprite de cuadros licenciados
  (Slice 7, pedido explícito del usuario, ver §2.6 para el detalle
  técnico completo).**
  - El usuario confirmó tener licencia para el material de origen (300
    capturas de un clip de columna vertebral rotando) antes de que se
    incrustara nada — no se procedió sin esa confirmación.
  - Preparación del asset: `ffmpeg` con `select='not(mod(n\,3))'` para
    tomar 100 de las 300 capturas, `scale=200:113`, `tile=10x10`, salida
    `libwebp` calidad 78 → `apps/web/public/culture/spine-frames-atlas.webp`
    (~550 KB, un solo archivo en vez de 28 MB en 300 JPGs sueltos).
  - `spine-engine.ts` reescrito: se eliminó `createSpineColumn()` (crystal
    procedural) y toda la iluminación de escena; nuevo `createSpineSprite()`
    (un plano + `texture.offset`/`repeat` para elegir cuadro del atlas,
    recortado a la franja central de cada celda). `createCards()` ya no
    calcula posiciones Y fijas contra un rango de viaje de cámara — ahora
    cada tarjeta se mueve en X según `restAmountForLocalT(localT)` (una
    función "entra-descansa-sale" con mesetas en 20%/80% de su banda de
    scroll). El glitch por tarjeta ahora se activa en esa misma transición
    de entrada/salida en vez de por distancia a una cámara que ya no viaja.
  - Verificación: `typecheck`, `eslint`, `culture-structure.test.mjs`
    limpios; confirmé en Chrome real, escroleando la sección completa, que
    el sprite muestra cuadros claramente distintos de la rotación conforme
    se escrolea (no solo "distinto encuadre de cámara" como antes — ahora
    es literalmente una imagen distinta cada vez), y que las 3 tarjetas
    entran, se detienen junto al sprite, y salen en el orden y lado
    correctos, sincronizadas con el caption HTML de abajo. Sin errores de
    consola propios de la app.
  - **Pendiente de re-confirmar por el usuario en su propio navegador**
    (igual que el fix anterior) — no asumir cerrado hasta que lo vea.
  - No se hizo commit (regla general del repo). Los archivos de origen
    (300 JPGs, ~28 MB, y el .mp4 de referencia) siguen en `videos
    muestra/`, fuera de `apps/web` — no se movieron ni se agregaron al
    repo del proyecto; solo el atlas ya procesado vive dentro de
    `apps/web/public`.

- **2026-09-10 — Segunda corrección: se abandonó GSAP ScrollTrigger para
  este motor (Slice 7 en curso, aún sin confirmar por el usuario).**
  - El usuario probó el primer fix (`ScrollTrigger.refresh()` en
    `load`/fonts-ready) y **sigue sin ver la columna moverse**. Mandó
    capturas propias confirmando que ve la columna 3D real (no el
    fallback), quieta.
  - En vez de seguir adivinando cuándo GSAP considera "seguro" volver a
    medir, se **eliminó la dependencia de `ScrollTrigger` para este motor
    por completo** (ver §2.2, revisado). Ahora `spine-engine.ts` tiene su
    propio listener de `scroll`/`resize` en `window` (pasivo, con throttle
    manual a `requestAnimationFrame` vía una bandera `scrollTicking`), y en
    cada tick llama a `progressFromLayout()`, que mide
    `container.getBoundingClientRect()` **en ese momento**, sin ningún
    valor cacheado de una medición anterior. Matemáticamente hace lo mismo
    que el `'top bottom'`/`'bottom top'` de GSAP
    (`progress = (innerHeight - rect.top) / (innerHeight + rect.height)`,
    recortado a `[0,1]`), pero no hay ningún momento en el que pueda quedar
    desincronizado del layout real, porque nunca guarda una medición vieja.
  - También se limpió una variable (`progress`) que había quedado de
    escritura-only tras el cambio (ya no hacía falta cachear el último
    valor para el resize, porque `handleResize` ahora vuelve a medir del
    layout en vez de reaplicar un progreso guardado).
  - `culture-structure.test.mjs` se actualizó: ya no exige
    `ScrollTrigger.create`/`scrollTrigger.kill()`, ahora exige
    `getBoundingClientRect`, `addEventListener('scroll'` y
    `removeEventListener('scroll'`.
  - Verificado: `typecheck`, `eslint`, `culture-structure.test.mjs`
    limpios, y volví a confirmar en Chrome (esta sesión) que la cámara se
    sigue moviendo con scroll real — pero **esto no reemplaza la
    confirmación del usuario en su propio navegador**, que sigue
    pendiente. Si el usuario reporta que TAMPOCO esto lo resuelve, el
    problema no es GSAP/caché de ningún tipo (ya se eliminó esa variable
    por completo) — habría que pedir la consola del navegador del usuario
    y no seguir adivinando a ciegas.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Corrección durante la revisión en vivo (Slice 7 en curso).**
  - El usuario vio la versión 3D en su propio navegador (no en el Chrome de
    esta sesión) y reportó: ve la columna de cristales, pero **no se mueve
    al escrolear**. Confirmó explícitamente que no es el fallback (ve la
    columna 3D real).
  - **Causa probable:** `ScrollTrigger.create()` mide la posición de
    `container` contra el documento en el momento en que se crea. Si algo
    arriba de la sección cambia de tamaño/posición *después* de esa
    medición (fuentes terminando de cargar, cualquier reflow tardío), los
    límites `start`/`end` quedan apuntando a coordenadas viejas — la cámara
    sigue reaccionando a un "progreso" que ya no corresponde a la posición
    real del scroll, y en el peor caso (límites degenerados) puede
    percibirse como que no reacciona en absoluto. Esto no lo detecté antes
    porque en todas mis pruebas dejaba pasar tiempo (`waitUntil:
    'networkidle'` + esperas) antes de escrolear, dándole a GSAP margen de
    sobra para que sus propios listeners de resize lo corrigieran solo.
  - **Fix aplicado en `three/spine-engine.ts`:** después de crear el
    `ScrollTrigger`, se agrega un `ScrollTrigger.refresh()` disparado por
    `document.fonts.ready` y por el evento `load` de `window` (o
    inmediatamente si `document.readyState === 'complete'` ya para
    entonces, ya que el montaje del motor 3D pasa por un
    `next/dynamic`+chequeo de capacidades que puede llegar tarde respecto a
    `load`). Es el fix estándar recomendado por GSAP para triggers cuya
    posición puede cambiar por contenido async por encima; barato y sin
    efecto si en realidad no hacía falta.
  - **No confirmado al 100% todavía** que esta fuera la causa exacta en el
    navegador del usuario (no tengo acceso a esa sesión) — es la explicación
    más probable dado el síntoma descrito, y el fix es de bajo riesgo, pero
    **queda pendiente que el usuario confirme si esto lo resolvió** después
    de recargar. Si sigue sin moverse tras un refresh forzado
    (Ctrl+Shift+R), el siguiente paso es pedirle la consola del navegador
    (errores) y la versión de navegador/SO, no asumir que ya está
    resuelto.
  - Verifiqué que el fix no rompe nada: `typecheck`, `eslint`,
    `culture-structure.test.mjs` limpios, y volví a confirmar visualmente en
    Chrome (esta sesión) que la cámara sigue moviéndose con el scroll igual
    que antes del cambio.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 6 completado.**
  - **Corrección importante a lo asumido en los Slices 0 y 5:** en esta
    máquina (Windows), el Chromium headless de Playwright **sí tiene
    WebGL2 por defecto, sin ningún flag especial** (probablemente vía
    ANGLE/D3D11). Lo que en el Slice 0/5 parecía "sin flags = sin WebGL =
    cae al fallback" en realidad dependía de que la espera usada en esos
    scripts ad hoc (500-800 ms) no le daba tiempo al motor 3D de montar en
    ese momento — no de una ausencia real de WebGL. Confirmado esta vez con
    medición directa: `canvas.getContext('webgl2')` da `true` por defecto,
    y con solo 200 ms de espera el canvas ya monta. **Esto no invalida el
    trabajo de los Slices 0-5** (la mecánica de capacidades sigue siendo
    correcta y la reduje motion/low-end siguen ganando cuando corresponde,
    verificado de nuevo abajo), pero sí significa que **la suite
    automatizada no puede asumir "sin flags = fallback"** — hay que forzarlo
    explícitamente. Si otra sesión retoma este plan y ve comportamiento
    "raro" de WebGL en pruebas automatizadas, que revise esto primero antes
    de suponer que es un bug nuevo.
  - **Code-splitting confirmado con evidencia real, no solo por diseño:**
    corrí `npm run build` (producción). `/cultura` da **115 kB de First
    Load JS** — prácticamente el mismo baseline que cualquier otra ruta
    simple del sitio (`/tecnologias` 113 kB, `/casos-de-exito` 107 kB); si
    `three` estuviera en el bundle inicial, este número sería mucho mayor
    (la librería sola pesa varios cientos de KB). Encontré el chunk real
    del motor 3D con `grep -l "IcosahedronGeometry" .next/static/chunks/*.js`
    → `1629039a.87e494f9ae6b4ee0.js` (≈197 KB) — y confirmé leyendo
    `.next/app-build-manifest.json` que ese chunk **no aparece** en la
    lista de scripts que Next.js sirve para `/cultura/page`. Solo se
    pide en tiempo real, vía el `next/dynamic({ ssr: false })` del
    Slice 0, cuando `canRender3DSpine()` da `true`.
  - **Chequeo de fugas, ahora automatizado y contra el build de
    producción** (no solo navegación manual en Chrome como en slices
    anteriores): script Playwright con WebGL forzado
    (`--use-gl=swiftshader`) que hizo 8 ciclos `/cultura` → `/` → `/cultura`
    contra `next start`, verificando en cada ciclo exactamente 1 canvas en
    `/cultura` y 0 en `/`, y sin mensajes de consola de "demasiados
    contextos" o "contexto perdido" (sí aparecen mensajes benignos de
    rendimiento del renderer de software, `"GPU stall due to ReadPixels"`,
    que no son señal de fuga — quedaron filtrados explícitamente del
    chequeo). Los 8 ciclos pasaron limpio.
  - **Tests de estructura** (`culture-structure.test.mjs`): ahora exige
    también `culture-spine-3d.tsx`, `culture-spine-scene.tsx`, y los tres
    archivos de `three/`. Nuevas aserciones de contenido: la página usa
    `CultureSpineScene` (ya no solo `CultureSpine`), la escena usa
    `canRender3DSpine` y `next/dynamic({ ssr: false })` y sigue teniendo
    `<CultureSpine ` como fallback; `culture-spine-3d.tsx` tiene
    `aria-hidden="true"`; `capabilities.ts` chequea `hardwareConcurrency` y
    `prefers-reduced-motion`; `spine-engine.ts` usa `ScrollTrigger.create`,
    llama `scrollTrigger.kill()` y `renderer.dispose()` al desmontar.
  - **Tests e2e — dos problemas reales encontrados y corregidos, más uno
    nuevo agregado:**
    1. `apps/web/tests/e2e/culture.spec.ts`: dado el hallazgo de arriba
       (WebGL disponible por defecto en esta máquina), sus tests ya no
       pueden asumir que corren el fallback solo porque no piden flags
       especiales. Se agregó un `test.beforeEach` con
       `page.addInitScript(...)` que parchea
       `HTMLCanvasElement.prototype.getContext` para devolver `null` en
       `'webgl'`/`'webgl2'` — fuerza el camino del fallback de forma
       determinística sin importar el soporte real de WebGL de la máquina
       donde corra la suite.
    2. **Archivo nuevo `apps/web/tests/e2e/culture-spine-3d.spec.ts`**
       (separado de `culture.spec.ts` a propósito: Playwright no permite
       `test.use({ launchOptions })` dentro de un `describe`, porque eso
       fuerza un worker nuevo — tiene que ir a nivel de archivo). Usa
       `--use-gl=swiftshader` para forzar WebGL real y prueba: el canvas
       monta (`toHaveCount(1)`), el wrapper tiene `aria-hidden="true"`,
       solo hay **un** `h3` visible dentro de la sección de historias (a
       diferencia del fallback, que muestra las 3 a la vez) — y que
       `PageDown` sigue moviendo `window.scrollY` (sin scroll-jacking).
       También repite, ahora como test permanente, la verificación de que
       reduced-motion gana aunque haya WebGL disponible.
    3. Al escribir el test de arriba encontré un bug real en mi propio
       test (no en la app): contaba `getByRole('heading', {level:3})` en
       **toda la página** en vez de solo en la sección de historias — la
       página tiene otros `h3` (`culturePrinciples`, la tarjeta de
       empresa) que no tienen nada que ver con el spine. Corregido
       acotando a `#nuestra-forma-de-trabajar`.
  - **Hallazgo colateral, fuera de alcance de este plan — no se tocó:**
    para poder correr la suite completa de e2e en este sandbox hubo que
    invocar Playwright vía `pnpm --filter @devsure/web exec playwright test
    ...` en vez de `npx playwright test ...` directo — sin `npm_execpath`
    seteado (como pasa al invocar `npx` fuera de un script de pnpm), el
    bootstrap de la API (`tests/start-e2e-api.mjs`) cae a una rama que
    lanza `cmd.exe /d /s /c pnpm.cmd ...` que en este entorno no arranca
    bien. **Anotado para quien retome este plan:** usar siempre `pnpm
    --filter @devsure/web exec playwright test ...` en esta máquina, no
    `npx` directo. Una vez resuelto eso, la suite completa corrió y
    reveló un bug real pero **completamente ajeno a este plan**: a 768px
    de ancho, el `<nav class="primary-navigation">` del header desborda
    horizontalmente — reproducido también en `/` (la portada), nada que
    ver con `/cultura` ni con el spine. Es un test que ya existía antes de
    este plan (`git log` lo ubica en el commit inicial `f8b2180`), y
    aparentemente nunca se había corrido con éxito en este sandbox hasta
    ahora. **No se tocó** — es responsabilidad del header/nav del sitio,
    no de este plan; si el usuario quiere que se arregle, es una tarea
    aparte.
  - Verificación final: `pnpm --filter @devsure/web typecheck`, `eslint`,
    `node --test tests` (16/17 pasan; el único que falla —
    `admin-technologies` por un spec e2e faltante— ya fallaba antes de
    empezar este plan, ver la primera respuesta de esta sesión), y
    `pnpm --filter @devsure/web exec playwright test tests/e2e/culture.spec.ts
    tests/e2e/culture-spine-3d.spec.ts` → **9/10 pasan**, el único que falla
    es el bug de navegación ajeno descrito arriba.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 5 completado.**
  - No se tocó código de producción en este slice: `capabilities.ts`
    (`hasWebGL`, `prefersReducedMotion`, `isLowEndDevice`,
    `canRender3DSpine`) y el `aria-hidden="true"` en el wrapper del canvas
    ya habían quedado bien desde el Slice 0. Este slice fue **verificar
    formalmente** esas cuatro condiciones y el comportamiento de teclado,
    en vez de asumir que "ya deberían funcionar".
  - Se decidió **no** agregar una heurística adicional de ancho de viewport
    (el plan la dejaba como opción en §2.4/§5): `isLowEndDevice()` ya cubre
    el caso que importa (`hardwareConcurrency < 4`), y un límite de ancho
    por sí solo no es un buen proxy de capacidad de GPU (un teléfono gama
    alta también tiene viewport angosto). Si en el futuro aparece evidencia
    de que hace falta, se puede agregar sin tocar el resto del gate.
  - Verificación con un script Playwright ad hoc (creado, corrido y
    borrado; no quedó en el repo) que cubrió los 4 escenarios reales,
    lanzando Chromium con distintas condiciones en vez de suponerlas:
    1. **Sin WebGL** (Chromium headless por defecto, sin flags de
       software rendering): `canvasCount = 0`, encabezado de la primera
       historia del fallback visible. ✅
    2. **Con WebGL (`--use-gl=swiftshader`) pero `reducedMotion:
       'reduce'` emulado:** `canvasCount = 0` — la condición de movimiento
       reducido gana aunque WebGL esté disponible. ✅
    3. **Con WebGL pero `navigator.hardwareConcurrency` forzado a 2**
       (vía `page.addInitScript` con `Object.defineProperty`, ya que
       Playwright no tiene un emulador nativo para esto): `canvasCount = 0`
       — la condición de gama baja gana. ✅
    4. **Con WebGL, sin reduced-motion, con cores suficientes:**
       `canvasCount = 1` (el canvas 3D monta). ✅
  - **Dentro del escenario 4**, además:
    - **Teclado — PageDown:** `window.scrollY` pasó de `0` a `630` tras
      `page.keyboard.press('PageDown')`. Esto **resuelve formalmente la
      duda que quedó abierta en la bitácora del Slice 2** (ahí no pude
      confirmar el scroll por teclado con la extensión de Chrome de esta
      sesión y lo dejé anotado como limitación de esa herramienta, no como
      bug). Con Playwright (eventos de teclado reales, no simulados por la
      extensión) queda confirmado: **no hay scroll-jacking, el teclado
      funciona igual que en la versión CSS.**
    - **Teclado — orden de Tab:** 12 `Tab` consecutivos desde el tope de la
      página, revisando en cada paso si `document.activeElement` cae
      dentro de `[class*="spine3dCanvas"]` (`.closest(...)`). Ninguno cayó
      ahí — el foco nunca queda atrapado en la capa 3D decorativa; se
      mueve normalmente por los enlaces reales de la página (los 12
      resultaron ser todos `<a>`, consistente con que la navegación del
      header/skip-link ocupan los primeros tabs de `/cultura`).
  - `pnpm --filter @devsure/web typecheck` y `node --test
    tests/culture-structure.test.mjs` limpios (sin cambios de código, solo
    para confirmar que nada se rompió durante la verificación).
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 4 completado + pedido del usuario: el canvas ahora
  ocupa 3/4 de la página.**
  - **Tamaño del canvas** (pedido explícito del usuario, no parte original
    del Slice 4): `.spine3dCanvas` en `culture.module.css` pasó de
    `height: min(48rem, 85vh)` (una caja dentro del `shell`, con bordes
    redondeados) a `height: 75vh; width: 100vw; margin-inline: calc(50% -
    50vw)` — ahora es *full-bleed* (ancho completo de la ventana, no solo el
    ancho del contenido) y ocupa el 75% del alto del viewport. Se apoya en
    que `html`/`body` ya tienen `overflow-x: hidden`/`clip` en
    `globals.css` (línea ~577), que es justamente lo que hace seguro usar el
    truco `100vw` sin generar scroll horizontal. El caption
    (`.spineCaption`) se queda dentro del `shell` de siempre — solo la parte
    visual 3D es full-bleed, el texto sigue con los márgenes normales de la
    página.
  - **Shader de glitch:** nuevo archivo
    `three/glitch-card-material.ts` con un `THREE.ShaderMaterial`
    (`createGlitchCardMaterial`) que hace RGB-split + desplazamiento por
    bandas horizontales pseudo-aleatorias (`hash()` a partir de un `uSeed`
    distinto por tarjeta, para que no glitcheen todas exactamente igual), a
    partir de un uniform `uIntensity` (0 = imagen limpia exacta, 1 = glitch
    completo). También se agregó `createFallbackTexture()`: un
    `THREE.DataTexture` de 1×1 con el color de respaldo, compartido por las
    3 tarjetas mientras cargan sus imágenes reales (antes se usaba
    `MeshBasicMaterial({ color })`; ahora que el material es un
    `ShaderMaterial` con un `sampler2D` obligatorio, hace falta darle
    siempre alguna textura válida).
  - **Evaluación de `GlitchPass`:** se consideró antes de escribir el shader
    propio, tal como pedía el plan. Se descartó porque es un post-proceso de
    pantalla completa (`EffectComposer` sobre el render final); no hay forma
    directa de limitarlo a una sola tarjeta sin renderizar esa tarjeta a un
    render target aparte y componerla — mucho más complejo que un
    `ShaderMaterial` por tarjeta para este caso.
  - `spine-engine.ts`: `createCards()` ahora devuelve también `materials:
    GlitchCardMaterial[]` (antes solo `positions`). `applyProgress()`
    recorre esas materials cada vez que se llama (o sea, cada `onUpdate`
    del scroll, igual cadencia que ya existía) y les asigna `uIntensity =
    glitchIntensityForDistance(distance)`, con `distance = |posiciónY de la
    tarjeta − Y de la cámara|`. `glitchIntensityForDistance` es una función
    de "bump" (triángulo): 0 en `distance = 0` (tarjeta centrada, limpia),
    sube a 1 en `distance = GLITCH_PEAK_DISTANCE` (≈2 unidades), vuelve a 0
    en `distance = GLITCH_PEAK_DISTANCE + GLITCH_WIDTH` (≈3.6 unidades).
  - **Cómo se verificó (de nuevo con números, no solo capturas — las
    tarjetas se ven muy chicas en el canvas ahora tan ancho para juzgar el
    shader a ojo en una captura de pantalla):** instrumenté temporalmente
    `applyProgress` con `window.__debugSpineIntensity = cards.materials.map(m
    => m.uniforms.uIntensity.value)` (revertido antes de cerrar el slice).
    Con scroll real de rueda confirmé valores como `[0, 0.36, 0]`, `[0.87,
    0.67, 0]`, `[0.80, 0.35, 0]` en distintos puntos — la intensidad sí
    cambia con la posición de scroll, sí llega a 0 para tarjetas lejanas, y
    sube a valores altos (>0.8) para la tarjeta más próxima al punto de
    "entrada/salida". Con zoom sobre la tarjeta con intensidad alta
    (`0.87`), la imagen se veía visiblemente fragmentada/con bandas de color
    corridas, distinta a como se veía limpia en la verificación del Slice 3
    — confirma que el shader efectivamente altera el render, no solo que el
    uniform cambia de valor.
  - **Nota de entorno, no de la app:** igual que en el Slice 2,
    `window.scrollTo(...)` programático desde la consola de depuración no
    siempre dispara el `onUpdate` de GSAP en este entorno de automatización
    (hay que usar scroll real de rueda/`computer` para que se refleje); no
    afecta a usuarios reales, ya lo dejamos anotado como limitación de la
    herramienta de verificación, no del código.
  - Sin errores de consola propios de la app al navegar y escrollear (solo
    el ruido ya conocido de extensiones del navegador).
  - `pnpm --filter @devsure/web typecheck`, `eslint`, y `node --test
    tests/culture-structure.test.mjs` limpios.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 3 completado.**
  - `three/spine-engine.ts`: `mountSpineEngine` ahora recibe `stories:
    SpineCardInput[]` (`{ id, imageSrc }`, un tipo mínimo propio del motor —
    no importa `CultureStory` completo, para no acoplar el motor 3D al shape
    exacto del contenido) y un `onActiveIndexChange?: (index: number) =>
    void` opcional. `createCards()` construye un `THREE.PlaneGeometry` por
    historia (`CARD_WIDTH = 2`, alto derivado del aspect ratio real de las
    imágenes de `culture-content.ts`, 1672×941), cargado con
    `THREE.TextureLoader`; mientras carga (o si falla) muestra
    `CARD_FALLBACK_COLOR` (un color liso, no un texto — el `alt` real vive en
    el HTML del caption, no hace falta duplicarlo en WebGL). Cada tarjeta se
    ubica alternando lado (par=izquierda, impar=derecha) a
    `±CARD_CENTER_OFFSET` en X, con una leve rotación en Y
    (`CARD_LEAN_RADIANS`) para que "mire" hacia el centro, igual que en el
    video de referencia.
  - Las 3 tarjetas quedan repartidas evenly a lo largo del rango de viaje de
    la cámara (`travelHalfRange`), en el punto medio de cada tercio de
    scroll. `applyProgress()` ahora también calcula `nearestCardIndex(y)` y
    llama a `onActiveIndexChange` **solo cuando el índice activo cambia**
    (como mucho `stories.length - 1` veces en todo el recorrido) — nunca en
    cada tick de scroll, para no forzar renders de React de más.
  - `fitCameraToColumn` se renombró a `fitCameraToScene` y ahora usa
    `SCENE_HALF_WIDTH` (columna + una tarjeta sobresaliendo) en vez de solo
    el ancho de la columna, para que las tarjetas tampoco se recorten en
    móvil. **Trade-off aceptado y anotado, no resuelto:** esto aleja la
    cámara más que en el Slice 1/2 (la columna se ve algo más chica en
    pantallas angostas) porque el encuadre sigue intentando mostrar todo el
    ancho de la escena a la vez. El video de referencia probablemente hace
    zoom dinámico por tarjeta en vez de un encuadre estático de toda la
    escena; **si el resultado visual no convence, vale la pena revisar esto
    como una mejora futura (cámara con FOV/distancia que varía según la
    tarjeta activa)** en vez de mantener el encuadre estático actual.
  - `culture-spine-3d.tsx`: recibe `stories`/`onActiveIndexChange` como
    props y los pasa al motor. El efecto de montaje depende de ambos
    (`[stories, onActiveIndexChange]`) — es seguro porque `stories` viene de
    `cultureStories` (constante de módulo, misma referencia siempre) y
    `onActiveIndexChange` está envuelto en `useCallback(..., [])` en
    `CultureSpineScene`, así que ninguno de los dos cambia entre renders y el
    motor no se remonta de más.
  - `culture-spine-scene.tsx`: se **eliminó** `CultureStoriesTranscript`
    (el shim `sr-only` del Slice 1/2). En su lugar,
    `CultureSpineCaption` renderiza kicker/h3/descripción **visibles** (no
    `sr-only`) de la historia cuya tarjeta está más cerca de la cámara
    (`activeIndex`, estado de React actualizado por
    `onActiveIndexChange`). Esto de hecho mejora la accesibilidad respecto al
    parche anterior: antes se volcaban las 3 historias de una sola vez sin
    relación con el scroll; ahora el texto visible coincide con lo que
    cualquier usuario (con mouse, teclado o lector de pantalla que dispara
    scroll real) está viendo en ese momento, porque todos comparten el mismo
    `ScrollTrigger`.
  - Estilo nuevo `.spineCaption` en `culture.module.css` (kicker/h3/párrafo,
    mismos tokens que el resto del archivo) con un fade-in corto
    (`spineCaptionFadeIn`, 420ms) al cambiar de historia; desactivado bajo
    `prefers-reduced-motion` por consistencia con el resto del archivo
    (aunque en la práctica este componente solo se monta cuando
    reduced-motion ya es `false`, por el gate de `capabilities.ts`).
  - **Corrección de una fuga real, no solo teórica:** si el componente se
    desmonta antes de que una textura termine de cargar (navegar rápido
    fuera de `/cultura`), el callback `onLoad` de `THREE.TextureLoader`
    puede llegar después de `dispose()`. Se agregó una bandera `disposed`
    cerrada sobre el callback: si ya se llamó a `dispose()`, la textura que
    llega tarde se descarta (`texture.dispose()`) en vez de asignarse a un
    material que ya no existe.
  - Verificación visual en Chrome real: escrolleando la sección completa se
    ven las 3 imágenes reales cargadas, alternando lado
    (izquierda/derecha/izquierda = listen/quality/evolve, como en
    `culture-content.ts`), y el caption debajo del canvas cambia en orden
    "01 · Entender" → "02 · Verificar" → "03 · Evolucionar" exactamente
    cuando cada tarjeta queda más cerca de la cámara — sin saltos ni
    desincronización. Sin errores de consola propios de la app (solo el
    ruido ya conocido de extensiones del navegador). Repetí navegar fuera y
    volver a `/cultura`: sin warnings de contexto WebGL colgado.
  - `pnpm --filter @devsure/web typecheck`, `eslint`, y `node --test
    tests/culture-structure.test.mjs` limpios.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 2 completado.**
  - `three/spine-engine.ts`: se agregó `ensureGsapRegistered()` +
    `ScrollTrigger.create({ trigger: container, start: 'top bottom', end:
    'bottom top', scrub: true, onUpdate })`, igual patrón que
    `parallax-background.tsx`. `onUpdate` llama a `applyProgress(self.progress)`
    (mueve `camera.position.y` entre `+travelHalfRange` y `-travelHalfRange`,
    con `camera.lookAt(0, y, 0)` para mirar siempre a la misma altura) y
    renderiza. `camera.position.z` (la distancia calculada por
    `fitCameraToColumn`) **no cambia** con el scroll — solo se traslada en Y,
    a propósito, para que sea un desplazamiento puro sin "zoom".
  - `handleResize` ahora también llama a `applyProgress(progress)` (variable
    guardada en closure) después de recalcular el encuadre, para que un
    resize a mitad de scroll no deje la cámara en una altura vieja.
  - `dispose()` ahora también hace `scrollTrigger.kill()` antes de lo demás.
  - **Cómo se verificó (importante, porque a simple vista es engañoso):**
    inicialmente creí ver un "zoom" distinto entre dos capturas tomadas en
    puntos de scroll distintos (una con ~4 segmentos grandes, otra con ~10
    chicos). Medí antes de descartarlo como bug: confirmé por JS que el
    contenedor tiene una altura constante en todo momento
    (`getBoundingClientRect().height` igual en ambos puntos), así que no era
    un resize. La diferencia real era que en la primera captura solo una
    fracción del canvas (que es más alto que el viewport en varios
    breakpoints) estaba dentro de la ventana visible — es decir, eran dos
    *recortes* de página distintos del mismo canvas, no dos framings
    distintos. Para confirmarlo con números y no a ojo, instrumenté
    temporalmente el motor con un `window.__debugSpine = { progress,
    cameraY, cameraZ }` dentro de `onUpdate` (revertido antes de terminar el
    slice, no quedó en el código). Con eso confirmé en el navegador real: a
    `progress = 0.5826`, `cameraY = -0.8176` — coincide con el valor
    calculado a mano a partir de la fórmula (`travelHalfRange ≈ 4.95` con 14
    segmentos de 0.9; `travelHalfRange - 0.5826 · travelHalfRange · 2 ≈
    -0.817`) — y `cameraZ = 18.24` se mantuvo igual que en el Slice 1 (no
    cambia con el scroll). Con esto quedó descartado el "bug" percibido: la
    matemática de la cámara es correcta.
  - Confirmé además que el scroll nativo con rueda del mouse sigue
    funcionando con normalidad en todos los puntos probados (nada de
    `position: fixed`/pin, nada de `preventDefault`). **No pude confirmar
    Page Down/flechas de teclado** con la herramienta de automatización de
    este entorno (el evento de teclado no movió `window.scrollY` en la
    prueba, incluso después de hacer click en la página primero) — como el
    código no agrega ningún listener de teclado ni de scroll que pueda
    interferir, esto se interpretó como una limitación de la herramienta de
    automatización usada en esta sesión, no como una regresión real, pero
    **queda pendiente confirmarlo con una prueba de teclado real (a mano, o
    Playwright con `page.keyboard.press('PageDown')`) como parte de la
    "Auditoría de teclado" que ya pide el Slice 5**, antes de dar esto por
    cerrado del todo.
  - Navegué repetidas veces `/cultura` → `/` → `/cultura` en Chrome real: sin
    warnings de contexto WebGL perdido/duplicado en consola.
  - Verificación hecha: `pnpm --filter @devsure/web typecheck`, `eslint`, y
    `node --test tests/culture-structure.test.mjs` limpios.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 1 completado.**
  - `three/spine-engine.ts` reescrito: `createSpineColumn()` genera 14
    segmentos apilados (icosaedros y cajas alternados, `flatShading`,
    ligeras rotaciones/tamaños aleatorios) en vez del cubo del Slice 0; cada
    5º segmento usa el material de acento (`#3cd8c5`). `fitCameraToColumn()`
    calcula la distancia de cámara en `z` a partir del FOV vertical/horizontal
    para que la columna completa entre en el encuadre sin importar el
    aspect ratio del contenedor, y se recalcula en cada resize.
  - La escena ya **no tiene loop de `requestAnimationFrame` continuo**: es
    estática a propósito (el Slice 1 pide "quieta"); se renderiza una vez al
    montar y de nuevo en cada resize. El Slice 2 va a tener que añadir un
    loop de render otra vez cuando la cámara empiece a moverse con el scroll.
  - Se resolvió la nota pendiente del Slice 0 sobre duplicación visual:
    `culture-spine-scene.tsx` ya no renderiza `CultureSpine` (CSS) visible al
    mismo tiempo que el 3D. Cuando el 3D está activo, en su lugar se monta
    `CultureStoriesTranscript` (nuevo, definido en el propio
    `culture-spine-scene.tsx`): un `<div class="sr-only">` con artículos
    simples (kicker/h3/descripción) por cada historia, solo para lectores de
    pantalla/SEO — sin imágenes ni la maquinaria de reveal de `CultureSpine`.
    **Esto es un parche temporal**: el Slice 3 lo reemplaza por un overlay
    HTML visible posicionado junto a cada tarjeta 3D.
  - `.spine3dCanvas` en `culture.module.css` ahora es `height: min(48rem,
    85vh)` en vez de una caja fija de `20rem` (pensado para una columna
    vertical, no para el bloque pequeño del spike).
  - Verificación hecha:
    - `pnpm --filter @devsure/web typecheck` y `eslint` limpios sobre los
      archivos tocados.
    - `node --test tests/culture-structure.test.mjs` sigue pasando.
    - Verificación visual en los 4 breakpoints del proyecto (360, 768, 1024,
      1440 — los mismos que usa `culture.spec.ts`) usando Playwright
      lanzado con `--use-gl=swiftshader --enable-webgl
      --ignore-gpu-blocklist` (necesario para que Chromium headless tenga
      WebGL2 real; sin esos flags cae al fallback, que es correcto pero no
      prueba la rama 3D). En los 4 tamaños la columna se ve completa, sin
      recorte ni distorsión, sin errores de consola.
    - Confirmé que el texto accesible sigue en el DOM con el 3D activo: los
      3 `h3` de las historias aparecen vía `getByRole('heading', { level: 3
      })` aunque estén dentro del `sr-only`, y el contenedor del canvas tiene
      `aria-hidden="true"`.
    - **Hallazgo para tener en cuenta en Slice 6 (tests):** el mount del
      canvas 3D en Chromium headless con software rendering tarda
      perceptiblemente más que en un navegador real con GPU (hubo que subir
      la espera de la prueba ad hoc de ~600ms a ~1000ms+ y usar
      `page.waitForSelector` en vez de un `waitForTimeout` fijo). Cualquier
      test de Playwright que valide la rama 3D debe esperar el selector del
      canvas explícitamente, no un timeout corto.
  - No se hizo commit (regla general del repo).

- **2026-09-10 — Slice 0 completado.**
  - Se agregó `three` (^0.186.0) y `@types/three` (three no trae tipos
    propios en esta versión) a `apps/web/package.json` vía
    `pnpm --filter @devsure/web add three` / `add -D @types/three`.
  - Archivos nuevos: `apps/web/src/features/culture/three/capabilities.ts`
    (`hasWebGL`, `prefersReducedMotion`, `isLowEndDevice`,
    `canRender3DSpine`), `apps/web/src/features/culture/three/spine-engine.ts`
    (motor imperativo con el cubo placeholder, resize y `dispose()`),
    `apps/web/src/features/culture/components/culture-spine-3d.tsx` (wrapper
    React que monta/desmonta el motor), y
    `apps/web/src/features/culture/components/culture-spine-scene.tsx` (el
    "gate": decide 3D vs. fallback, `next/dynamic({ ssr: false })` sobre
    `CultureSpine3D`).
  - `apps/web/src/app/cultura/page.tsx` ahora usa `CultureSpineScene` en vez
    de `CultureSpine` directamente. `CultureSpine` (CSS) sigue existiendo sin
    cambios y sigue siendo lo único que se renderiza cuando la condición de
    capacidades falla.
  - Estilo nuevo `.spine3dCanvas` en `culture.module.css`: por ahora una caja
    fija de `20rem` de alto — **no es el layout final**, solo contenedor para
    el spike. El Slice 1 decide las dimensiones/posicionamiento reales
    (probablemente ocupando toda la altura de la sección, no un bloque fijo
    encima de las tarjetas CSS).
  - Verificación hecha:
    - `pnpm --filter @devsure/web typecheck` limpio.
    - `node --test tests/culture-structure.test.mjs` pasa sin cambios (el
      regex `/CultureSpine/` sigue matcheando `CultureSpineScene`).
    - Verificación visual en Chrome real (extensión claude-in-chrome): el
      cubo aparece y gira dentro de la sección "Quiénes somos", encima de las
      tarjetas CSS existentes (que siguen intactas debajo, ver nota abajo).
    - Verificación de fallback con un script Playwright ad hoc
      (`chromium.launch()` + `newContext({ reducedMotion: 'reduce' })`
      contra `localhost:3000/cultura`): tanto con reduced-motion como sin él,
      el Chromium headless de Playwright no expone WebGL real, así que
      `hasWebGL()` da `false` y **ambos casos cayeron correctamente al
      fallback** (0 canvas, heading de la primera historia visible). Esto
      confirma la rama "sin WebGL → fallback" pero no ejercita la rama "con
      WebGL → 3D" (esa se confirmó a ojo en Chrome real). Pendiente para
      Slice 6: decidir cómo probar la rama 3D con Playwright (¿lanzar
      Chromium con `--use-gl=swiftshader` / `--enable-webgl-software-rendering`?
      ¿o aceptar que esa rama solo se verifica manualmente?).
  - **Nota importante para Slice 1:** actualmente `CultureSpineScene` muestra
    el cubo 3D **y** las tres tarjetas CSS completas, una debajo de la otra
    (duplicación visual intencional y temporal, solo para el spike). Antes de
    avanzar a Slice 1 hay que decidir el layout real: lo más probable, según
    el plan, es que la escena 3D pase a ocupar toda la sección y las
    tarjetas CSS queden solo como fallback (no visibles a la vez que el 3D).
  - No se instaló `@react-three/fiber` ni `@react-three/drei` (decisión
    cerrada en §2.1).
  - No se hizo commit de estos cambios (regla general del repo: no commitear
    sin que el usuario lo pida).

## 4. Slices (etapas verticales)

Cada slice debe dejar el repo en un estado que compila, tipa y pasa sus
propios tests antes de pasar al siguiente. Ningún slice debe romper el
fallback CSS ni los tests que ya existen para `/cultura`
(`apps/web/tests/culture-structure.test.mjs`,
`apps/web/tests/e2e/culture.spec.ts`).

### Slice 0 — Setup y spike

**Objetivo:** demostrar que un canvas Three.js puede vivir dentro de
`/cultura` sin romper SSR, sin fugar memoria al desmontar, y respetando las
condiciones de la sección 2.4, antes de dibujar nada definitivo.

Tareas:

- Añadir `three` (y `@types/three` si la versión de `three` no trae tipos
  propios) como dependencia de `apps/web`.
- Crear la carpeta `apps/web/src/features/culture/three/` para el código del
  motor (aislado de los componentes React "normales").
- Helper de capacidades, por ejemplo `three/capabilities.ts`, con
  `hasWebGL()` y el chequeo de `prefers-reduced-motion` (puede envolver el
  `matchMedia` que ya usa `use-in-view.ts` para no duplicar el string de la
  media query).
- Componente `culture-spine-3d.tsx` cargado con `next/dynamic({ ssr: false })`
  desde el punto de montaje en `cultura/page.tsx`, que por ahora solo pinta un
  cubo girando (placeholder) para validar el pipeline.
- El `useEffect` que crea la escena debe limpiar todo al desmontar: geometrías,
  materiales, el renderer (`renderer.dispose()`), y cancelar el
  `requestAnimationFrame`. Verificar manualmente navegando a `/cultura`, a
  otra ruta, y de vuelta, varias veces, sin warnings de "too many WebGL
  contexts" en la consola.

**Criterio de salida:** con WebGL disponible y sin reduced-motion, se ve un
cubo girando en la sección "Quiénes somos"; con reduced-motion o sin WebGL
(emular en DevTools), se sigue viendo `CultureSpine` (CSS) intacto. `pnpm
--filter @devsure/web typecheck` limpio. Ningún test existente se rompe.

### Slice 1 — Geometría estática de la columna

**Objetivo:** la columna vertebral real (no el cubo placeholder), quieta,
bien encuadrada, con la paleta del sitio.

Tareas:

- Geometría procedural de la columna: una pila de segmentos con facetas (p.
  ej. cilindros/cajas ligeramente irregulares apilados, o un tubo con
  desplazamiento de vértices) que dé la sensación "rocosa/de bloques" del
  video, no un cilindro liso.
- Material y luces usando los tokens de color del sitio
  (`--accent: #3cd8c5`, `--accent-soft`, fondo oscuro de `--surface`) — ver
  `apps/web/src/app/globals.css`. Evaluar `MeshStandardMaterial` con 1-2 luces
  vs. algo más barato si el rendimiento lo pide.
- Cámara fija que encuadra toda la columna dentro de la altura de la sección,
  en los 4 breakpoints de prueba del sitio (360, 768, 1024, 1440 — ver
  `apps/web/tests/e2e/culture.spec.ts`, arreglo `viewports`). Canvas
  responsive: escuchar resize y actualizar `camera.aspect` +
  `renderer.setSize`, con `renderer.setPixelRatio` limitado (p. ej. máx. 2)
  por rendimiento.

**Criterio de salida:** la columna se ve bien y sin recortes/distorsión en
los 4 breakpoints; no hay errores en consola; el placeholder del cubo
desapareció.

### Slice 2 — Scroll → progreso → cámara

**Objetivo:** la sensación central del video: la columna se siente fija
mientras la cámara viaja a lo largo de ella conforme se hace scroll.

Tareas:

- `ScrollTrigger` (vía `ensureGsapRegistered`) sobre el contenedor de la
  sección, `scrub: true`, `start`/`end` cubriendo toda la sección de
  "Quiénes somos". En su callback (`onUpdate`), escribir el progreso (0..1)
  en un `ref`/variable mutable — no en estado de React.
  también.
- El loop de render (`requestAnimationFrame`) lee ese progreso cada frame y
  mueve la cámara (dolly/traslación a lo largo del eje de la columna) según
  una curva definida (puede ser lineal para empezar).
- Confirmar que el scroll nativo del navegador sigue funcionando con
  normalidad (rueda, teclado, barra de scroll) — igual que
  `parallax-background.tsx`, esto **no debe "secuestrar" el scroll** ni fijar
  la sección con `position: fixed` de forma que bloquee la navegación por
  teclado.
- Limpiar el `ScrollTrigger` (`.kill()`) y el `requestAnimationFrame`
  (`cancelAnimationFrame`) al desmontar, igual que en el Slice 0.

**Criterio de salida:** al hacer scroll dentro de la sección, la cámara
avanza/retrocede suavemente siguiendo la columna, sin saltos ni jank
perceptible en un equipo de gama media, y el scroll de la página nunca se
siente "atrapado".

### Slice 3 — Tarjetas 3D alternadas + copy real

**Objetivo:** las 3 `cultureStory` (`listen`, `quality`, `evolve`) aparecen
como tarjetas 3D alternando lado, en la posición correcta de la columna, y su
texto sigue siendo accesible.

Tareas:

- Por cada `cultureStory`: una tarjeta (plano) con su imagen (`story.image.src`)
  cargada como `THREE.Texture` (`THREE.TextureLoader`, o precargar con la
  imagen ya optimizada que sirve Next), posicionada a lo largo del eje de la
  columna, alternando izquierda/derecha, con inclinación/perspectiva sutil.
- Fallback de imagen: si la textura falla al cargar, replicar la idea de
  `mediaFallback` de la versión CSS (mostrar el `alt` en vez de una textura
  rota).
- **Decisión de diseño abierta para quien implemente este slice** (ver
  también sección 5): cómo mostrar kicker/título/descripción reales en HTML
  junto a cada tarjeta 3D. Dos caminos razonables:
  1. Proyectar la posición 3D de cada tarjeta a coordenadas de pantalla cada
     frame (`Vector3.project()` + la matriz de la cámara) y mover un `<div>`
     HTML absoluto para que quede "pegado" a la tarjeta 3D — visualmente más
     fiel al video, pero más frágil (hay que mantenerlo sincronizado con
     resize, con la curva de cámara del Slice 2, etc.).
  2. Un layout HTML más simple (parecido al de `CultureSpine`: copy a un
     costado fijo de la tarjeta, sin proyección) — menos "wow" pero mucho más
     robusto y fácil de mantener.
  Se recomienda empezar por la opción 2 y solo subir a la opción 1 si el
  usuario, viéndolo, pide más fidelidad al video.

**Criterio de salida:** las 3 historias aparecen en 3D en el orden y lado
correctos al recorrer la columna con scroll; el texto de cada una sigue
siendo real HTML seleccionable/leíble por lector de pantalla.

### Slice 4 — Shader de glitch

**Objetivo:** el glitch de textura/color que se ve en el video al entrar cada
tarjeta.

Tareas:

- Antes de escribir un shader propio, **evaluar
  `three/examples/jsm/postprocessing/GlitchPass.js`**, que ya viene con
  `three` — puede cubrir buena parte del efecto con mucho menos código que un
  `ShaderMaterial` a medida. Si no da suficiente control (por ejemplo, si se
  necesita que *solo* la tarjeta activa glitchee y no toda la pantalla),
  entonces sí escribir un `ShaderMaterial`/parche de shader por tarjeta con
  RGB split + desplazamiento de bloques, con la intensidad atada a qué tan
  cerca está esa tarjeta del punto "activo" del progreso de scroll (crece al
  entrar, se asienta a textura limpia una vez centrada).
- Debe desactivarse por completo (sin animar nada) si
  `prefers-reduced-motion: reduce` — coherente con el resto del sitio.

**Criterio de salida:** el glitch se ve parecido al del video al entrar cada
tarjeta, no baja perceptiblemente el framerate, y no aparece en absoluto con
reduced-motion.

### Slice 5 — Fallback, capacidades y accesibilidad

**Objetivo:** cerrar formalmente las condiciones de la sección 2.4 y 2.3.

Tareas:

- Implementar la heurística de gama de dispositivo mencionada en 2.4 (a
  definir con números concretos: por ejemplo, no montar 3D si
  `navigator.hardwareConcurrency` es indefinido o menor a un umbral, o si el
  viewport es menor a cierto ancho).
- Verificar con DevTools ("No WebGL" / reduced motion emulado) que siempre se
  cae limpiamente a `CultureSpine`.
- `aria-hidden="true"` en el `<canvas>` y en cualquier contenedor puramente
  decorativo del motor 3D.
- Auditoría de teclado: `Tab`/`Shift+Tab`, `Page Down`, flechas, deben seguir
  funcionando exactamente igual que hoy en `/cultura`.

**Criterio de salida:** con WebGL deshabilitado o reduced-motion, el
resultado es indistinguible del `CultureSpine` actual (mismo test de
estructura, mismo comportamiento). Con ambos habilitados, se ve la versión
3D. Ningún camino deja contenido invisible para lectores de pantalla.

### Slice 6 — Rendimiento, code-splitting y tests

**Objetivo:** que esto sea seguro de desplegar.

Tareas:

- Confirmar (con el analizador de bundle de Next, o revisando el output de
  `next build`) que el bundle de `three` solo se carga en la ruta `/cultura`
  y solo para quien pasa las condiciones de 2.4 (gracias al `next/dynamic`
  del Slice 0).
- Revisar fugas: navegar repetidamente a `/cultura` y fuera, confirmar que no
  quedan renderers/contexts WebGL vivos.
- Actualizar `apps/web/tests/culture-structure.test.mjs` para exigir los
  nuevos archivos (`culture-spine-3d.tsx`, helpers de `three/`).
- Actualizar `apps/web/tests/e2e/culture.spec.ts`: Playwright no valida
  píxeles de WebGL de forma significativa aquí, así que las aserciones deben
  seguir apuntando al DOM real (los headings de cada historia deben seguir
  siendo `getByRole('heading', ...)` visibles) tanto si corre la ruta 3D como
  si corre el fallback — considerar un test explícito que emule
  `reducedMotion: 'reduce'` y confirme que el `<canvas>` del motor 3D no se
  monta (`page.locator('canvas').count()` como venga definido el selector).
- Verificación manual en navegador igual a la que se hizo para la versión
  CSS: levantar `pnpm --filter @devsure/web dev`, abrir `/cultura`, scrollear,
  confirmar visualmente contra los frames del video original.

**Criterio de salida:** `pnpm typecheck`, `pnpm --filter @devsure/web test`, y
`pnpm --filter @devsure/web test:e2e` (si hay navegador disponible) pasan.
Verificación visual manual hecha y descrita en la bitácora de la sección 3.

### Slice 7 — Decisión de despliegue final

**Objetivo:** decidir con el usuario si la versión 3D pasa a ser la
experiencia por defecto para dispositivos capaces, o queda detrás de algún
toggle/opt-in por un tiempo antes de reemplazar del todo el camino CSS como
"principal". Este slice es una conversación con el usuario, no solo código.

## 4.1 Slice 8 — Fidelidad real (mesh + refracción + spline + composite)

**El usuario decidió subir la apuesta de fidelidad** tras ver el análisis
de la sección "Investigación" en la bitácora (2026-09-10). Este slice
reemplaza gradualmente la columna-sprite y el glitch por tarjeta (Slices
3-4-7) por una versión más cercana a la técnica real de Active Theory,
**sin copiar su código** — shaders y geometría son originales, inspirados
en la técnica que describen sus archivos públicos (reflexión/refracción de
screen-space, cámara por spline, composite de transición a pantalla
completa).

**Por qué se ejecuta en 4 sub-slices secuenciales y no en paralelo, aunque
el usuario tiene varias herramientas de IA disponibles:** los cuatro tocan
`spine-engine.ts` (el archivo orquestador). Repartir sub-slices entre
Codex CLI/Copilot CLI/Claude **al mismo tiempo, sobre el mismo archivo**
casi garantiza conflictos de merge feos. La forma segura de aprovechar
varias herramientas sin ese riesgo es **turnos, no simultaneidad**: una
herramienta hace un sub-slice completo, deja el repo compilando y
funcionando, actualiza la bitácora de este plan, y *recién ahí* el
siguiente sub-slice (en la misma herramienta o en otra) arranca desde ese
punto. Cada sub-slice es su propia unidad de trabajo/commit revisable.

Cada sub-slice, sin excepción, debe: dejar `pnpm --filter @devsure/web
typecheck`/`eslint`/`test` limpios, verificar visualmente en un navegador
real (no asumir), y **actualizar la bitácora de este plan (sección 3)
antes de terminar** — es la única forma en que la siguiente herramienta
(sea cual sea) sabe dónde quedó todo.

### Slice 8.1 — Columna con material de reflexión/refracción de screen-space

**Objetivo:** que la columna deje de ser una imagen 2D girando y se vea
como un objeto 3D cromado/iridiscente que cambia de color con el ángulo,
igual que el original.

Tareas:

- **Geometría:** la columna necesita una forma 3D real con normales
  variadas (una imagen plana no sirve para que la refracción se vea bien).
  Opción recomendada: revivir la idea del Slice 1 original (una pila de
  segmentos irregulares — icosaedros/cajas, `flatShading`) que ya existió
  en este archivo antes del Slice 7 y se puede reconstruir desde el
  historial de git de esta sesión si hace falta referencia, o simplemente
  rehacerla desde cero con el mismo espíritu; alternativa más orgánica: un
  `THREE.TubeGeometry` a lo largo de una curva central. Cualquiera de las
  dos es válida — documentar cuál se eligió y por qué.
- **Render target de refracción** (archivo nuevo,
  `three/spine-refraction.ts` o similar): un `THREE.WebGLRenderTarget` del
  tamaño del canvas (debe re-crearse en `handleResize`). Cada frame que se
  renderiza: (1) poner `spineMesh.visible = false`, renderizar la escena
  (tarjetas + lo que corresponda) a ese render target; (2) volver a poner
  `spineMesh.visible = true` y renderizar la escena completa al canvas
  real, con el material de la columna muestreando ese render target.
- **Material** (archivo nuevo, `three/spine-refraction-material.ts`): un
  `THREE.ShaderMaterial` propio (no copiar `SpineShader.glsl` de Active
  Theory, escribir una versión propia con el mismo espíritu) con:
  - un término de fresnel (`pow(1.0 - dot(normal, viewDir), power)`) para
    el brillo de borde;
  - muestreo del render target de refracción en `gl_FragCoord.xy /
    resolution`, desplazado por la normal en screen-space (el "vidrio
    distorsionado");
  - un tinte iridiscente que cambie con el fresnel y/o con el tiempo (un
    `rainbowColor()`/gradiente de color propio, no necesita ser
    físicamente exacto, solo verse vivo).
- Integrar en `mountSpineEngine`: el `render()` actual pasa a hacer el
  paso de refracción antes del render principal.
- El atlas de sprites (`spine-frames-atlas.webp`) puede quedar sin usarse
  después de este sub-slice (no borrar el archivo todavía, por si hay que
  volver atrás) — anotar en la bitácora si se deja de referenciar en
  código.

**Criterio de salida:** la columna se ve como una forma 3D real con
reflejos/color que cambian según el ángulo de cámara, no como una foto.
Sigue funcionando el scroll "pinned" del Slice 7 (300vh, sticky) sin
tocarlo.

### Slice 8.2 — Cámara por curva spline, ADEMÁS de la rotación de la columna

**Decisión del usuario (2026-09-10), reemplaza lo que decía esta sección
antes:** el Slice 8.1 ya hizo que la columna rote sobre su eje Y en
`applyProgress` (`spine.group.rotation.y = ...`), y el usuario confirmó
que ese efecto le gusta y **se queda**. La 8.2 no lo reemplaza — le agrega
movimiento de cámara *encima*, para que se sienta más vivo todavía (giros
de cámara + columna rotando a la vez), no en vez de.

**Objetivo:** la cámara además de estar fija/encuadrada, recorre una
curva 3D mientras la columna sigue rotando como ya quedó en el Slice 8.1.

Tareas:

- Definir una curva 3D (`THREE.CatmullRomCurve3` con 5-8 puntos de control
  a mano, eligiendo valores que den una sensación de recorrido — algo de
  desplazamiento en X/Z, no solo Y) en vez de la cámara estática que fija
  `fitCameraToScene` una sola vez hoy.
- `camera.position` = `curve.getPointAt(progress)`; el `lookAt` puede
  mirar hacia un punto ligeramente adelantado en la curva
  (`curve.getPointAt(Math.min(1, progress + 0.02))`) en vez de mirar
  siempre al centro de la columna, para que la cámara "gire" con el
  camino. **No tocar** la línea que rota `spine.group` — eso se queda
  igual, ortogonal a este cambio.
- Elegir los puntos de la curva con cuidado para que la columna (que
  ahora rota) y las tarjetas (que entran por sus bandas) sigan encuadradas
  sin recortarse — puede que la curva deba mantenerse bastante cerca de la
  posición estática actual (pequeñas variaciones), no un recorrido
  dramático, para no perder el encuadre.
- Revisar `fitCameraToScene`/el encuadre general: con una cámara que ya no
  está fija, puede que haga falta recalcular el encuadre por frame (no
  solo en `handleResize`) para evitar recortes — probar de nuevo en los 4
  breakpoints (360/768/1024/1440).

**Criterio de salida:** la cámara recorre una trayectoria con curvas
reales al escrolear, la columna sigue rotando sobre su eje igual que en el
Slice 8.1, ninguna de las dos cosas recorta la escena en ningún
breakpoint, y el mapeo de bandas de las tarjetas (Slice 7) sigue
funcionando.

### Slice 8.3 — Composite de pantalla completa para las transiciones

**Objetivo:** el "glitch" real de Active Theory pasa por una transición de
pantalla completa entre tarjetas, no (solo) un shader por tarjeta.

Tareas:

- Introducir un pipeline de postproceso mínimo (`THREE.EffectComposer` de
  `three/examples/jsm/postprocessing/` + un `ShaderPass` propio) que se
  activa brevemente cuando `activeIndex` cambia (no en cada scroll tick).
- Shader de composite propio (no copiar `WorkComposite.fs`): un wipe
  radial con distorsión de ruido (FBM o simplex, puede reusar
  `glitch-card-material.ts` como referencia de estilo) + un golpe de RGB
  shift, sobre el frame actual vs. el frame justo antes del cambio
  (necesita mantener dos render targets: "antes" y "después" del cambio de
  tarjeta activa, o un enfoque más simple de fade+distorsión sobre el
  frame único si guardar dos buffers resulta demasiado para este
  sub-slice — decisión de quien lo implemente, documentar cuál se usó).
- Este sub-slice es el que menos toca la lógica de cámara/columna de 8.1 y
  8.2 (mayormente envuelve la llamada final a `render()`) — es el mejor
  candidato si en algún momento se quiere intentar en paralelo con 8.1/8.2,
  siempre que quien lo haga evite tocar `applyProgress` y la creación de
  la columna.

**Criterio de salida:** al cruzar de una tarjeta activa a la siguiente se
ve una transición de pantalla completa (no solo el glitch local de la
tarjeta), y `prefers-reduced-motion` sigue desactivando todo esto igual
que el resto de la escena.

### Slice 8.4 — Material más rico para las tarjetas (fresnel + ondulación idle)

**Objetivo:** acercar las tarjetas al `WorkItemShader.glsl` real (fresnel,
ondulación por vértice) sin necesariamente llegar a soportar video.

Tareas:

- Extender `glitch-card-material.ts` (o crear una variante) con un
  desplazamiento de vértice idle (`sin(time * 0.5 + ...)` sobre la
  posición) y un término de fresnel sumado al color final, además del
  glitch ya existente.
- Mantener compatibilidad con `uIntensity` (Slice 4) — el fresnel/ondulación
  puede estar siempre activo (independiente del glitch) o solo mientras la
  tarjeta está en reposo (`restAmount` alto) — decisión de quien lo
  implemente, documentar cuál se usó.

**Criterio de salida:** las tarjetas se sienten "vivas" incluso cuando no
están en su transición de entrada/salida, sin romper el glitch del Slice 4.

## 5. Decisiones abiertas (registrar aquí cuando se resuelvan, o mover a la 2 si quedan cerradas)

- ~~Cómo posicionar el texto real junto a cada tarjeta 3D (Slice 3, opción 1
  vs 2 — ver arriba).~~ **Resuelto en Slice 3: se implementó la opción 2**
  (caption HTML simple debajo del canvas, sin proyección). Sigue abierta la
  posibilidad de subir a la opción 1 (overlay proyectado sobre la tarjeta) si
  el usuario, viéndolo, pide más fidelidad visual al video.
- Umbral exacto de la heurística de "dispositivo capaz" (Slice 5).
- ~~Si el glitch final usa `GlitchPass` de Three.js o un shader a medida
  (Slice 4).~~ **Resuelto: shader a medida**, `ShaderMaterial` propio por
  tarjeta (`three/glitch-card-material.ts`). `GlitchPass` se descartó porque
  glitchea todo el frame renderizado, no una tarjeta a la vez, y el
  requisito es que solo la tarjeta activa (o la que está entrando/saliendo)
  glitchee.
- **Nueva: atlas de sprites en alta resolución vs. `<video>` +
  `VideoTexture`.** Resuelto por ahora a favor del atlas (ver bitácora del
  Slice 7, atlas reconstruido a 400×225 por celda) por el riesgo de *seek
  lag* al escrubear un `<video>` con scroll rápido. Si la nitidez sigue sin
  convencer al usuario incluso así, reconsiderar video — no está cerrado
  para siempre, solo es la opción de menor riesgo hoy.
- Si la versión 3D reemplaza a `CultureSpine` como default o queda opt-in
  (Slice 7 — es del usuario, no técnica).
- **Nueva, del Slice 4:** el ajuste fino de `GLITCH_PEAK_DISTANCE` /
  `GLITCH_WIDTH` es "primera pasada", no calibrado a ojo con el usuario
  todavía. Con los valores actuales, la primera tarjeta (`listen`) entra al
  área de scroll ya parcialmente glitcheada (porque su "pico de entrada"
  matemático cae fuera del rango de scroll disponible, justo antes de
  `progress = 0`) y luego tiene un *segundo* pico, más fuerte, al alejarse
  de ella — es una asimetría real, visible, pero menor. Vale la pena
  revisarla en una pasada de pulido visual (Slice 6 o una conversación con
  el usuario viendo el resultado), no es un bug de la mecánica en sí.

## 6. Comandos de verificación

Ejecutar desde la raíz del repo (`DEVSURE CODE/`):

```bash
pnpm --filter @devsure/web typecheck
pnpm --filter @devsure/web test          # tests de estructura (node:test)
pnpm --filter @devsure/web test:e2e      # Playwright, requiere navegadores instalados
pnpm --filter @devsure/web dev           # para verificación visual manual en /cultura
```

Si el puerto 3000 ya está ocupado por otro proceso de una sesión anterior,
confirmar con el usuario antes de matarlo (no asumir que es seguro).

**Nota del Slice 6, importante en esta máquina:** si `pnpm --filter
@devsure/web test:e2e` (o un `npx playwright test` suelto) falla al arrancar
con un error de `pnpm --filter @devsure/api seed:technologies failed with
exit code 1` viniendo de `tests/start-e2e-api.mjs`, no es un bug de la app:
es que `npm_execpath` no está seteado en el shell desde el que se invocó, y
el script cae a una rama `cmd.exe /d /s /c pnpm.cmd ...` que no arranca bien
en este entorno. Usar en su lugar:

```bash
pnpm --filter @devsure/web exec playwright test tests/e2e/culture.spec.ts tests/e2e/culture-spine-3d.spec.ts
```

Los tests de `/cultura` en concreto solo necesitan esos dos archivos, no la
suite completa de e2e (que además hoy tiene un fallo preexistente y ajeno a
este plan — ver bitácora del Slice 6 — en un test de overflow horizontal del
`<nav>` del header a 768px, reproducible también en `/`).
