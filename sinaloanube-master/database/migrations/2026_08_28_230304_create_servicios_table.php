<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servicios', function (Blueprint $table) {
            $table->id();
            $table->string('grupo')->index();
            $table->string('clave', 8)->nullable();
            $table->string('icono')->default('nube');
            $table->string('titulo');
            $table->text('resumen');
            $table->json('puntos')->nullable();
            $table->boolean('visible')->default(true)->index();
            $table->unsignedInteger('orden')->default(0)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicios');
    }
};
