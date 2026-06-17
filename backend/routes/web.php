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
Route::post('/api/change-password', [AuthController::class, 'apiUpdatePassword']);
Route::post('/api/update-profile', [AuthController::class, 'apiUpdateProfile']);

Route::get('/api/barangs', [App\Http\Controllers\BarangController::class, 'index']);
Route::get('/api/raks', [App\Http\Controllers\BarangController::class, 'raks']);
Route::post('/api/raks', [App\Http\Controllers\BarangController::class, 'storeRak']);
Route::put('/api/raks/{id}', [App\Http\Controllers\BarangController::class, 'updateRak']);
Route::delete('/api/raks/{id}', [App\Http\Controllers\BarangController::class, 'destroyRak']);
Route::post('/api/barangs', [App\Http\Controllers\BarangController::class, 'store']);
Route::put('/api/barangs/{id}', [App\Http\Controllers\BarangController::class, 'update']);
Route::delete('/api/barangs/{id}', [App\Http\Controllers\BarangController::class, 'destroy']);
Route::post('/api/barangs/{id}/restock', [App\Http\Controllers\BarangController::class, 'restock']);

Route::get('/api/transaksi', [App\Http\Controllers\TransaksiController::class, 'index']);
Route::post('/api/transaksi', [App\Http\Controllers\TransaksiController::class, 'store']);

Route::get('/api/customers', [App\Http\Controllers\TransaksiController::class, 'customers']);
Route::post('/api/customers', [App\Http\Controllers\TransaksiController::class, 'storeCustomer']);
Route::delete('/api/customers/{id}', [App\Http\Controllers\TransaksiController::class, 'destroyCustomer']);

Route::get('/api/whatsapp/status', [App\Http\Controllers\WhatsappController::class, 'status']);
Route::get('/api/whatsapp/qr', [App\Http\Controllers\WhatsappController::class, 'qr']);
Route::post('/api/whatsapp/disconnect', [App\Http\Controllers\WhatsappController::class, 'disconnect']);
Route::post('/api/whatsapp/broadcast', [App\Http\Controllers\WhatsappController::class, 'broadcast']);
Route::get('/api/whatsapp/history', [App\Http\Controllers\WhatsappController::class, 'history']);

// QRIS Midtrans Routes
Route::post('/api/qris/create', [App\Http\Controllers\QrisController::class, 'createQris']);
Route::get('/api/qris/status/{orderId}', [App\Http\Controllers\QrisController::class, 'checkStatus']);
