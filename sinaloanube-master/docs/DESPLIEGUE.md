# Despliegue

## Objetivo

El proyecto mantiene una sola versión del código. La rama `staging` sirve para
validar cambios antes de incorporarlos a `master`; no debe convertirse en una
variante permanente de la aplicación.

El despliegue de producción debe poder ejecutar migraciones y seeders sin
riesgo de insertar clientes, casos o leads de demostración.

## Seeders

### Datos reales

`DatabaseSeeder` siempre realiza estas operaciones:

1. Crea el administrador inicial con `id = 1` únicamente si todavía no existe.
2. Ejecuta `ContenidoInicialSeeder`, que crea el contenido público sólo cuando
   las tablas correspondientes están vacías.

Por ello, volver a ejecutar el comando siguiente no debe duplicar información
ni sobrescribir cambios realizados desde el panel:

```bash
php artisan db:seed --force
```

Una instalación nueva puede reconstruirse con:

```bash
php artisan migrate:fresh --seed --force
```

Este comando es destructivo y sólo debe ejecutarse cuando se quiere borrar y
recrear toda la base de datos.

### Datos de demostración privados

Los clientes, casos y leads de demostración viven en:

```text
database/seeders/ContenidoDeEjemploSeeder.php
```

Este archivo está excluido mediante `.gitignore` deliberadamente. No debe
forzarse su inclusión en Git ni añadirse a un pull request. La finalidad es que
un despliegue ordinario seguido de `db:seed --force` nunca pueda cargar datos de
demostración en producción por accidente.

`DatabaseSeeder` comprueba la presencia de la clase:

```php
if (class_exists(ContenidoDeEjemploSeeder::class)) {
    $this->call(ContenidoDeEjemploSeeder::class);
}
```

El resultado depende de cada servidor:

- Si el archivo no existe, se cargan solamente el administrador y el contenido
  real inicial.
- Si el archivo existe, también se cargan los clientes, casos y leads de
  demostración.
- El seeder privado debe ser idempotente: si los datos ya existen, no debe
  duplicarlos.

## Mantenimiento del seeder privado

El seeder privado no se distribuye mediante Git ni mediante un pull request.
La persona o la IA que administre el entorno debe mantenerlo y copiarlo de forma
deliberada únicamente a los servidores de pruebas que necesiten esos datos.

Reglas:

1. Nunca instalarlo en producción.
2. Nunca usar `git add -f` para incorporarlo al repositorio.
3. Antes de cambiarlo, comprobar que utiliza datos ficticios y que no contiene
   información real de clientes.
4. Mantener guardas de idempotencia para clientes, casos y leads.
5. Después de modificarlo, ejecutar dos veces `php artisan db:seed --force` en
   una base de pruebas y verificar que la segunda ejecución no crea duplicados.
6. No usar factories ni `fake()`: dependen de `fakerphp/faker`, que es de
   desarrollo y no existe en producción. Usar datos escritos a mano.

Como Plesk despliega sólo los archivos versionados, el seeder privado no llegará
automáticamente al servidor. Si un entorno de pruebas se recrea, debe copiarse
de nuevo de manera consciente después del despliegue.

## Flujo de cambios

1. Desarrollar y verificar el cambio en `staging`.
2. Ejecutar las pruebas automatizadas.
3. Desplegar `staging` en el entorno de pruebas.
4. Instalar el seeder privado sólo si ese entorno necesita demostraciones.
5. Ejecutar migraciones y `db:seed --force`.
6. Validar el sitio y el panel.
7. Abrir el pull request hacia `master` comprobando que el seeder privado no
   aparezca entre los archivos.
8. Desplegar `master` en producción sin instalar el seeder privado.

## Dependencias por entorno

| | Instala | Motivo |
|---|---|---|
| Producción (Plesk) | `--no-dev` | Nada de herramientas de desarrollo en el sitio del cliente. |
| Pruebas (deito.dev) | **con dev** | Es el entorno donde se depura: sin `faker`, `pail` ni `phpunit` no se puede. |
| CI (GitHub Actions) | con dev | Necesita `phpunit` y `pint`. |

Lo que debe coincidir entre pruebas y producción es el **runtime** —versión de
PHP, servidor web, motor de base de datos—, que es lo que hace aparecer los
bugs. Las dependencias de Composer son herramientas, no comportamiento.

Esa diferencia abre un hueco: código de producción que dependa de un paquete de
`require-dev` funcionaría en pruebas y reventaría en Plesk. Por eso el workflow
incluye un paso que instala `--no-dev` y arranca la aplicación antes de
desplegar.

> El seeder privado cae justo en ese hueco y por eso **no debe usar factories ni
> `fake()`**: son de `fakerphp/faker`, que en producción no existe. Ya rompió una
> vez así.

## Acciones de despliegue en Plesk

La aplicación está en `httpdocs` y el document root del dominio debe apuntar a
`httpdocs/public`. Las acciones adicionales de despliegue son:

```bash
/opt/plesk/php/8.4/bin/php /usr/lib/plesk-9.0/composer.phar install --no-dev --optimize-autoloader --no-interaction
/opt/plesk/php/8.4/bin/php artisan migrate --force
/opt/plesk/php/8.4/bin/php artisan filament:assets
/opt/plesk/php/8.4/bin/php artisan optimize:clear
/opt/plesk/php/8.4/bin/php artisan config:cache
/opt/plesk/php/8.4/bin/php artisan route:cache
/opt/plesk/php/8.4/bin/php artisan view:cache
```

Sin la primera línea, un cambio que agregue una dependencia se despliega con el
`vendor/` viejo y el sitio deja de arrancar.

El despliegue normal **no ejecuta `db:seed`** —ni en Plesk ni en pruebas—; debe
hacerse deliberadamente cuando se necesite crear o completar los datos
iniciales.

## Credenciales de integraciones

Telegram y WhatsApp se administran desde la página **Integraciones** de
Filament. Sus tokens se guardan cifrados en la tabla `integrations`; no viven
en `config/services.php` ni en variables individuales del entorno.

Cada servidor necesita una clave exclusiva y permanente:

```env
INTEGRATIONS_ENCRYPTION_KEY=base64:...
```

Se puede generar con `php artisan key:generate --show`. El resultado se copia a
la variable anterior; este comando no debe ejecutarse con opciones que
reemplacen `APP_KEY`.

Reglas:

1. La clave no se incluye en Git.
2. Debe respaldarse junto con las demás credenciales del servidor.
3. No debe regenerarse mientras existan credenciales cifradas en la tabla.
4. Cambiar `APP_KEY` no afecta los tokens, porque usan esta clave independiente.
5. Si se pierde `INTEGRATIONS_ENCRYPTION_KEY`, los tokens deben capturarse de
   nuevo desde Filament.

## Incidente: datos de demostración en producción (29/Ago/2026)

La portada de `sinaloanube.com` mostró en público "Cliente de ejemplo 1…6" y
tres casos inventados.

La causa no fue el diseño de este documento, que es correcto, sino que **la
protección vivía sólo en `staging`**: `master` seguía tres commits atrás y su
checkout todavía incluía `ContenidoDeEjemploSeeder.php`, así que un
`db:seed --force` en producción lo cargó.

Deja dos lecciones:

1. Una defensa que no está en la rama que produce no protege nada. Al añadir una
   guarda de este tipo, llevarla a `master` **antes** de volver a sembrar.
2. Borrar el archivo no borra las filas. Limpiar la base es un paso aparte y
   manual.
