<?php

namespace App\Providers;

use App\Models\Ajuste;
use App\Models\Caso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        Date::setLocale(config('app.locale'));

        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        $this->compartirContenidoDelSitio();
    }

    /**
     * Las vistas públicas leen los ajustes (que van en caché) y saben si hay
     * casos publicados para decidir si enlazan a esa sección.
     */
    protected function compartirContenidoDelSitio(): void
    {
        $vistasPublicas = ['layouts.publico', 'partials.*', 'casos.*', 'privacidad'];

        View::composer($vistasPublicas, function ($vista): void {
            $vista->with('ajustes', Ajuste::actuales());
        });

        View::composer(['layouts.publico', 'partials.clientes'], function ($vista): void {
            $vista->with('hayCasos', Caso::query()->publicados()->exists());
        });
    }
}
