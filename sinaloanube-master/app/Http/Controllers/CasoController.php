<?php

namespace App\Http\Controllers;

use App\Models\Caso;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CasoController extends Controller
{
    public function index(Request $request): View
    {
        $filtro = $request->query('servicio');

        $casos = Caso::query()
            ->with('cliente')
            ->publicados()
            ->when($filtro, fn ($query) => $query->where('servicio', $filtro))
            ->get();

        return view('casos.index', [
            'casos' => $casos,
            'filtro' => $filtro,
            'servicios' => Caso::query()
                ->publicados()
                ->reorder()
                ->distinct()
                ->orderBy('servicio')
                ->pluck('servicio'),
        ]);
    }

    public function show(Caso $caso): View
    {
        if (! $caso->estaPublicado()) {
            throw new NotFoundHttpException("El caso [{$caso->slug}] no está publicado.");
        }

        return view('casos.show', [
            'caso' => $caso->load('cliente'),
            'otros' => Caso::query()
                ->with('cliente')
                ->publicados()
                ->whereKeyNot($caso->getKey())
                ->take(2)
                ->get(),
        ]);
    }
}
