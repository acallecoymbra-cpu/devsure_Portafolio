<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->string('titulo');
            $table->string('slug')->unique();
            $table->string('servicio')->index();
            $table->string('anio', 4)->nullable();
            $table->string('resumen');
            $table->text('reto')->nullable();
            $table->text('solucion')->nullable();
            $table->json('resultados')->nullable();
            $table->string('portada')->nullable();
            $table->boolean('destacado')->default(false)->index();
            $table->unsignedInteger('orden')->default(0)->index();
            $table->timestamp('publicado_en')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casos');
    }
};
