<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', [AuthController::class, 'login']);

Route::post('/proses-login', [AuthController::class, 'prosesLogin']);

Route::get('/dashboard-owner', function () {
    return view('dashboard-owner');
});

Route::get('/dashboard-karyawan', function () {
    return view('dashboard-karyawan');
});

Route::get('/logout', [AuthController::class, 'logout']);

// API Routes for Vue JS Integration
Route::post('/api/login', [AuthController::class, 'apiLogin']);
Route::post('/api/logout', [AuthController::class, 'apiLogout']);
Route::get('/api/me', [AuthController::class, 'apiMe']);
