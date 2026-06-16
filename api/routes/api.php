<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\InstanceController;

// Routes publiques
Route::get('/apps', [ApplicationController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes authentifiées (token Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/instances', [InstanceController::class, 'index']);
    Route::post('/instances', [InstanceController::class, 'store']);

    Route::post('/credits/recharge', [CreditController::class, 'recharge']);

    // Administration (role=admin requis)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::patch('/users/{id}', [AdminUserController::class, 'update']);
        Route::post('/users/{id}/credits', [AdminUserController::class, 'adjustCredits']);
        Route::post('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
        Route::post('/users/{id}/unsuspend', [AdminUserController::class, 'unsuspend']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    });
});
