<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // cek apakah user login
        if (!Auth::check()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        // cek apakah role superadmin
        if (Auth::user()->role !== 'superadmin') {
            return response()->json([
                'message' => 'Akses hanya untuk superadmin'
            ], 403);
        }

        return $next($request);
    }
}