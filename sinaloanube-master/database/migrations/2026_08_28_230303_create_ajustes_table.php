<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro único con todo lo editable del sitio: datos de la empresa,
 * textos de portada y las listas cortas (métricas, diferenciadores, proceso).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ajustes', function (Blueprint $table) {
            $table->id();

            // Identidad
            $table->string('marca');
            $table->string('razon_social');
            $table->string('claim')->nullable();
            $table->string('logo')->nullable();

            // Portada
            $table->string('titulo_hero');
            $table->text('entrada_hero');

            // Contacto
            $table->string('telefono')->nullable();
            $table->string('telefono_marcado')->nullable();
            $table->string('whatsapp_publico')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->string('horario')->nullable();

            // Redes
            $table->string('facebook')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('instagram')->nullable();

            // Quiénes somos
            $table->string('nosotros_antetitulo')->nullable();
            $table->string('nosotros_titulo')->nullable();
            $table->text('nosotros_texto')->nullable();
            $table->text('nosotros_nota')->nullable();

            // Listas cortas
            $table->json('metricas')->nullable();
            $table->json('diferenciadores')->nullable();
            $table->json('proceso')->nullable();
            $table->json('presupuestos')->nullable();

            // Operación
            $table->json('leads_emails')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ajustes');
    }
};
