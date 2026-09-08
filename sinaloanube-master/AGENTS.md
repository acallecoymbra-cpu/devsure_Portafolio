# Consultar Graphify primero (todos los agentes)

Antes de analizar la arquitectura, buscar código o proponer cambios:
1. Leer `docs/GRAPHIFY.md` (análisis, alcance, limitaciones y comandos).
2. Consultar `graphify-out/GRAPH_REPORT.md` y ejecutar una consulta dirigida
   con `graphify query "<símbolo o tema>"` sobre `graphify-out/graph.json`.
3. Leer después los archivos fuente pertinentes para confirmar el resultado.
   El código actual prevalece sobre el grafo; una relación ausente no prueba
   que no exista (Blade, Eloquent y Filament incluyen resolución dinámica).
4. Si faltan los artefactos o cambió el código, regenerarlos según
   `docs/GRAPHIFY.md`. Si Graphify no está disponible, leer el informe guardado,
   indicar la limitación y continuar con los archivos necesarios.
5. Tras cambios estructurales, actualizar el grafo y revisar el análisis.

Para el análisis estático con Graphify NO instalar PHP, Composer, Boost ni
dependencias de la aplicación. Esta excepción explícita, solicitada por el
usuario, prevalece sobre el bloque de preparación siguiente. No ejecutar
migraciones, seeders ni desplegar como parte de un análisis.

<laravel-boost-guidelines>
# Laravel Application

This repository contains a Laravel application. Complete the following setup before working on the user's request.

## Prerequisites

Verify that PHP and Composer are available:

```sh
php -v
composer -V
```

If either command is unavailable, detect the user's operating system and install the prerequisites with the appropriate command:

macOS:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Linux:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

After installation, ask the user to restart their terminal. If the agent needs the restarted shell to continue, ask the user to reopen their terminal and rerun their original prompt.

## Agent Setup

Install Laravel Boost from the application root before making application changes:

```sh
composer require laravel/boost --dev
php artisan boost:install
```

Boost replaces these bootstrap instructions with guidelines tailored to the application. After installation, read `AGENTS.md` again and continue with the user's original request using the generated guidelines.
</laravel-boost-guidelines>
