<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Imagen de la portada. Guarda la ruta dentro del disco "publico" para que
 * se pueda reemplazar desde el panel sin volver a desplegar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ajustes', function (Blueprint $table) {
            $table->string('imagen_hero')->nullable()->after('entrada_hero');
        });
    }

    public function down(): void
    {
        Schema::table('ajustes', function (Blueprint $table) {
            $table->dropColumn('imagen_hero');
        });
    }
};
