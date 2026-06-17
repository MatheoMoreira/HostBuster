<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\InstanceController;
use App\Http\Controllers\WorkerCallbackController;

// Routes publiques
Route::get('/apps', [ApplicationController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Webhook Lion (auth par token partagé)
Route::post('/worker/callback', WorkerCallbackController::class);

// Routes authentifiées (token Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::patch('/user', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/instances', [InstanceController::class, 'index']);
    Route::get('/instances/{id}', [InstanceController::class, 'show']);
    Route::post('/instances', [InstanceController::class, 'store']);
    Route::patch('/instances/{id}', [InstanceController::class, 'update']);
    Route::post('/instances/{id}/start', [InstanceController::class, 'start']);
    Route::post('/instances/{id}/stop', [InstanceController::class, 'stop']);
    Route::delete('/instances/{id}', [InstanceController::class, 'destroy']);

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
