# Migrar DevSure de Railway a un VPS Linux de Time4VPS

Esta guía reproduce la arquitectura que usa DevSure en Railway con servicios
del propio VPS. Está pensada para Ubuntu 24.04 LTS o Debian 12, con acceso
`root`, una IP pública y un dominio propio. Sustituye estos valores antes de
ejecutar comandos:

- `example.com`: dominio público de la web.
- `api.example.com`: subdominio público de la API.
- `USUARIO_GITHUB/REPOSITORIO`: repositorio Git de DevSure.

La topología final es:

```text
Internet
  └─ Nginx + Let's Encrypt (80/443)
       ├─ example.com      → Next.js en 127.0.0.1:3000
       └─ api.example.com  → NestJS en 127.0.0.1:3001
                                └─ SQLite y uploads en /var/lib/devsure
```

La API conserva una sola instancia. SQLite no permite escalar horizontalmente
ni ejecutar dos procesos de API contra el mismo archivo.

## 1. Lo que Railway configuraba para este proyecto

No hay configuración de Railway versionada en el repositorio ni una sesión de
Railway disponible desde este entorno, por lo que no puedo confirmar los
nombres de servicios, dominios ni variables que existan hoy en su panel. Lo
verificable en el código y en [RAILWAY.md](./RAILWAY.md) es esta configuración:

| Componente | Railway | Equivalente en el VPS |
| --- | --- | --- |
| API | `pnpm --filter @devsure/api build` y `pnpm --filter @devsure/api start` | `devsure-api.service` |
| Web | `pnpm --filter @devsure/web build` y `pnpm --filter @devsure/web start` | `devsure-web.service` |
| Puerto API | variable inyectada `PORT` | `API_PORT=3001`, Nginx interno |
| Persistencia | volumen `/data` | `/var/lib/devsure` |
| SQLite | `/data/devsure.sqlite` | `/var/lib/devsure/devsure.sqlite` |
| Archivos cargados | `/data/uploads` | `/var/lib/devsure/uploads` |
| Dominio y TLS | dominio Railway | Nginx + Let's Encrypt |
| Healthcheck | `/api/v1/health` | `curl` y monitor externo opcional |

Las variables cruzadas que Railway resolvía mediante sus referencias se
reemplazan por los dominios definitivos: la web usa
`https://api.example.com/api/v1` y la API permite el origen
`https://example.com`.

### Inventario exacto de Railway

Para obtener el estado real antes de apagar Railway, inicia sesión con la CLI
en una máquina donde tengas acceso a la cuenta y enlaza el proyecto. Estos
comandos solo leen información:

```bash
railway login
railway link
railway status --json
railway service list --json
railway service status --all --json
railway volume list
railway variable list --service NOMBRE_DEL_SERVICIO --json
```

Guarda el inventario de nombres de servicio, dominios, comandos de build/start,
volúmenes, regiones y variables. No compartas el resultado crudo de
`railway variable list` si incluye secretos; basta con conservar los nombres de
variables y sustituir sus valores secretos al crear `/etc/devsure/api.env`.
La CLI también permite autenticación sin navegador con `railway login
--browserless`.

## 2. DNS y requisitos previos

Antes de configurar Nginx, crea registros `A` para `example.com` y
`api.example.com` apuntando a la IP pública del VPS. Espera a que ambos
resuelvan correctamente:

```bash
dig +short example.com
dig +short api.example.com
```

El firewall del proveedor y el del sistema deben permitir únicamente SSH,
HTTP y HTTPS. La API y Next.js escucharán solo en localhost.

## 3. Preparar el sistema operativo

Conéctate por SSH como `root` y actualiza el servidor:

```bash
apt update
apt upgrade -y
apt install -y ca-certificates curl git build-essential python3 nginx ufw certbot python3-certbot-nginx
adduser --disabled-password --gecos '' devsure
install -d -o devsure -g devsure -m 0750 /srv/devsure
install -d -o devsure -g devsure -m 0750 /var/lib/devsure/uploads
```

`build-essential` y `python3` son necesarios porque `better-sqlite3` puede
compilar un módulo nativo durante `pnpm install`.

En Ubuntu o Debian, instala Node.js 20 LTS desde el repositorio de NodeSource.
Descarga el instalador, revísalo si tu política lo requiere y ejecútalo; luego
instala el paquete:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
less /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh
apt install -y nodejs
rm -f /tmp/nodesource_setup.sh
```

Confirma la versión antes de continuar:

```bash
node --version  # debe ser v20.x
corepack enable
corepack prepare pnpm@9.15.5 --activate
pnpm --version  # debe ser 9.15.5
command -v pnpm # guarda esta ruta; se usará en los servicios systemd
```

Configura el firewall después de confirmar que tu sesión SSH funciona:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status verbose
```

## 4. Descargar el código e instalar dependencias

Usa una clave de despliegue o un repositorio público; no copies tokens de
GitHub al repositorio ni a los archivos de entorno.

```bash
sudo -u devsure git clone https://github.com/USUARIO_GITHUB/REPOSITORIO.git /srv/devsure
cd /srv/devsure
sudo -u devsure pnpm install --frozen-lockfile
```

Si ya existe el directorio porque estás actualizando, consulta la sección
“Actualizaciones” en vez de volver a clonar.

## 5. Variables de producción

Crea el directorio protegido y el archivo de la API:

```bash
install -d -o root -g devsure -m 0750 /etc/devsure
editor /etc/devsure/api.env
chmod 0640 /etc/devsure/api.env
chown root:devsure /etc/devsure/api.env
```

Contenido de `/etc/devsure/api.env`:

```dotenv
NODE_ENV=production
API_PORT=3001
API_PREFIX=api/v1
DATABASE_TYPE=sqlite
DATABASE_URL=/var/lib/devsure/devsure.sqlite
DATABASE_LOGGING=false
UPLOADS_DIR=/var/lib/devsure/uploads
CORS_ORIGINS=https://example.com
SWAGGER_ENABLED=false
BODY_LIMIT=1mb
AUTH_SESSION_TTL_SECONDS=28800
AUTH_LOGIN_WINDOW_SECONDS=60
AUTH_LOGIN_MAX_ATTEMPTS=5
```

No dejes en este archivo `ADMIN_SEED_PASSWORD`. Esa variable se suministra una
sola vez para inicializar el administrador y luego desaparece del entorno.

Crea el archivo de la web. No contiene secretos; Next.js necesita estas
variables durante la compilación y al ejecutarse:

```bash
editor /etc/devsure/web.env
chmod 0644 /etc/devsure/web.env
chown root:root /etc/devsure/web.env
```

Contenido de `/etc/devsure/web.env`:

```dotenv
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.example.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://example.com
```

Las tres URL deben usar HTTPS y los nombres finales. `NEXT_PUBLIC_API_BASE_URL`
queda incorporada al JavaScript del navegador al hacer build; siempre hay que
recompilar la web si cambia.

## 6. Compilar, migrar e inicializar los datos

Primero compila con el entorno de la web cargado:

```bash
cd /srv/devsure
sudo -u devsure bash -lc 'set -a; . /etc/devsure/web.env; set +a; pnpm --filter @devsure/api build; pnpm --filter @devsure/web build'
```

Ejecuta migraciones contra la base persistente:

```bash
cd /srv/devsure
sudo -u devsure bash -lc 'set -a; . /etc/devsure/api.env; set +a; pnpm db:migration:run'
```

Crea el primer administrador sin guardar su contraseña en disco. Este comando
la deja en el historial del shell si se escribe directamente; por ello, define
las tres variables en la sesión actual con un gestor de secretos o introdúcelas
con `read -s` antes de ejecutar el seed. La contraseña debe tener al menos 12
caracteres.

```bash
cd /srv/devsure
sudo -u devsure bash -lc '
  set -a; . /etc/devsure/api.env; set +a
  read -r -p "Usuario administrador: " ADMIN_SEED_USERNAME
  read -r -p "Correo del administrador: " ADMIN_SEED_EMAIL
  read -r -s -p "Contraseña inicial: " ADMIN_SEED_PASSWORD; echo
  export ADMIN_SEED_USERNAME ADMIN_SEED_EMAIL ADMIN_SEED_PASSWORD
  pnpm db:seed:admin
  unset ADMIN_SEED_USERNAME ADMIN_SEED_EMAIL ADMIN_SEED_PASSWORD
'
```

Inicia sesión después del despliegue y cambia esa contraseña: el seed marca al
administrador con cambio obligatorio. Ejecuta únicamente los seeds de contenido
que necesites; no hay que reseedear datos ya gestionados desde `/admin`.

## 7. Crear los servicios systemd

Obtén la ruta real de pnpm con `command -v pnpm` y reemplaza
`/usr/bin/pnpm` en los dos archivos si fuera distinta.

Crea `/etc/systemd/system/devsure-api.service`:

```ini
[Unit]
Description=DevSure NestJS API
After=network.target

[Service]
Type=simple
User=devsure
Group=devsure
WorkingDirectory=/srv/devsure
EnvironmentFile=/etc/devsure/api.env
ExecStart=/usr/bin/pnpm --filter @devsure/api start
Restart=on-failure
RestartSec=5
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/var/lib/devsure

[Install]
WantedBy=multi-user.target
```

Crea `/etc/systemd/system/devsure-web.service`:

```ini
[Unit]
Description=DevSure Next.js web
After=network.target devsure-api.service

[Service]
Type=simple
User=devsure
Group=devsure
WorkingDirectory=/srv/devsure
EnvironmentFile=/etc/devsure/web.env
ExecStart=/usr/bin/pnpm --filter @devsure/web start
Restart=on-failure
RestartSec=5
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/srv/devsure/apps/web/.next

[Install]
WantedBy=multi-user.target
```

Actívalos y comprueba que estén vivos antes de configurar el proxy:

```bash
systemctl daemon-reload
systemctl enable --now devsure-api devsure-web
systemctl status devsure-api devsure-web --no-pager
curl -fsS http://127.0.0.1:3001/api/v1/health
curl -I http://127.0.0.1:3000
```

Para ver errores en tiempo real:

```bash
journalctl -u devsure-api -u devsure-web -f
```

## 8. Configurar Nginx

Crea `/etc/nginx/sites-available/devsure` con esta configuración inicial en
HTTP. Sustituye los dos dominios:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

El máximo de 5 MB coincide con el mayor archivo aceptado por la API. Activa la
configuración, desactiva el sitio predeterminado si está activo y valida:

```bash
ln -s /etc/nginx/sites-available/devsure /etc/nginx/sites-enabled/devsure
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

El código de la API confía en un único proxy inverso. Como los procesos solo
escuchan en `127.0.0.1`, Nginx es ese único proxy y puede reenviar de forma
segura la IP y el protocolo original.

## 9. Habilitar HTTPS

Con DNS ya propagado y el puerto 80 abierto:

```bash
certbot --nginx -d example.com -d api.example.com
systemctl status certbot.timer --no-pager
```

Certbot agrega los certificados y la redirección HTTPS a la configuración de
Nginx. Verifica la renovación sin modificar certificados reales:

```bash
certbot renew --dry-run
```

## 10. Validación final

Ejecuta desde tu computadora, no desde el VPS:

```bash
curl -fsS https://api.example.com/api/v1/health
curl -I https://example.com
curl -I https://api.example.com/storage/no-existe
```

Después entra a `https://example.com/admin/login`, cambia la contraseña inicial
y realiza una carga de prueba. Confirma que el archivo sigue disponible después
de reiniciar la API:

```bash
systemctl restart devsure-api
```

## 11. Copias de seguridad y recuperación

La base SQLite y los uploads son el estado que antes guardaba el volumen de
Railway. Respáldalos juntos. Antes de copiar la base, usa la copia consistente
de SQLite:

```bash
install -d -o root -g root -m 0700 /var/backups/devsure
sqlite3 /var/lib/devsure/devsure.sqlite ".backup '/var/backups/devsure/devsure-$(date +%F).sqlite'"
tar -C /var/lib/devsure -czf /var/backups/devsure/uploads-$(date +%F).tar.gz uploads
```

Instala `sqlite3` si no está presente (`apt install sqlite3`). Copia los backups
fuera del VPS con un destino cifrado. Prueba la restauración en una máquina de
prueba antes de depender de ella. Para restaurar, detén la API, repón la base y
uploads desde una copia válida, verifica permisos de `devsure` y vuelve a
iniciar el servicio.

## 12. Actualizar sin perder datos

Antes de cada actualización haz un backup. Después:

```bash
cd /srv/devsure
sudo -u devsure git fetch origin
sudo -u devsure git status
sudo -u devsure git pull --ff-only origin main
sudo -u devsure pnpm install --frozen-lockfile
sudo -u devsure bash -lc 'set -a; . /etc/devsure/web.env; set +a; pnpm --filter @devsure/api build; pnpm --filter @devsure/web build'
sudo -u devsure bash -lc 'set -a; . /etc/devsure/api.env; set +a; pnpm db:migration:run'
systemctl restart devsure-api devsure-web
curl -fsS https://api.example.com/api/v1/health
```

No ejecutes migraciones sin una copia de seguridad. Si el repositorio usa otra
rama, sustituye `main` por esa rama; no uses `git reset --hard` sobre archivos
locales que necesites conservar.

## 13. Operación diaria

```bash
# Estado y últimos logs
systemctl status devsure-api devsure-web nginx --no-pager
journalctl -u devsure-api -n 100 --no-pager

# Uso de almacenamiento y memoria
du -sh /var/lib/devsure
df -h
free -h

# Reinicios controlados
systemctl restart devsure-api
systemctl restart devsure-web
systemctl reload nginx
```

Si el VPS tiene poca memoria, añade swap antes de compilar Next.js. Vigila la
ocupación de `/var/lib/devsure`: los uploads y la base comparten ese disco.
