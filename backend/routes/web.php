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

Route::get('/api/barangs', [App\Http\Controllers\BarangController::class, 'index']);
Route::get('/api/raks', [App\Http\Controllers\BarangController::class, 'raks']);
Route::post('/api/barangs', [App\Http\Controllers\BarangController::class, 'store']);
Route::put('/api/barangs/{id}', [App\Http\Controllers\BarangController::class, 'update']);
Route::delete('/api/barangs/{id}', [App\Http\Controllers\BarangController::class, 'destroy']);
Route::post('/api/barangs/{id}/restock', [App\Http\Controllers\BarangController::class, 'restock']);

Route::get('/api/transaksi', [App\Http\Controllers\TransaksiController::class, 'index']);
Route::post('/api/transaksi', [App\Http\Controllers\TransaksiController::class, 'store']);
