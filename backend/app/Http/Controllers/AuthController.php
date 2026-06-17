<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // Halaman login (legacy blade)
    public function login()
    {
        return view('login');
    }

    // Proses login (legacy blade)
    public function prosesLogin(Request $request)
    {
        $credentials = [
            'email' => $request->email,
            'password' => $request->password
        ];

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            if (Auth::user()->role == 'owner') {
                return redirect('/dashboard-owner');
            }
            return redirect('/dashboard-karyawan');
        }

        return back()->with('error', 'Username atau password salah!');
    }

    // Logout (legacy blade)
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    /**
     * API Login for Vue Frontend
     */
    public function apiLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $credentials = [
            'username' => $request->username,
            'password' => $request->password
        ];

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil!',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role,
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Username atau password salah!'
        ], 401);
    }

    /**
     * API Logout for Vue Frontend
     */
    public function apiLogout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil!'
        ]);
    }

    /**
     * API Me checking current user
     */
    public function apiMe(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            return response()->json([
                'logged_in' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->role,
                ]
            ]);
        }
        return response()->json([
            'logged_in' => false
        ]);
    }

    /**
     * API Update Password
     */
    public function apiUpdatePassword(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan login terlebih dahulu!'
            ], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:4',
        ]);

        $user = Auth::user();

        // Check if old password matches
        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini salah!'
            ], 422);
        }

        // Update password
        $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui!'
        ]);
    }

    /**
     * API Update Profile
     */
    public function apiUpdateProfile(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan login terlebih dahulu!'
            ], 401);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|in:owner,karyawan',
        ]);

        $user = Auth::user();
        $user->name = trim($request->name);
        if ($request->has('role') && !empty($request->role)) {
            $user->role = strtolower($request->role);
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Check if the database users table is empty.
     */
    public function checkEmptyDb()
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('users')) {
                return response()->json([
                    'success' => true,
                    'empty' => true
                ]);
            }
            $count = \App\Models\User::count();
            return response()->json([
                'success' => true,
                'empty' => $count === 0
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'empty' => true,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Register the first owner account.
     */
    public function registerFirstOwner(Request $request)
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('users')) {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menjalankan migrasi database: ' . $e->getMessage()
            ], 500);
        }

        try {
            $count = \App\Models\User::count();
            if ($count > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registrasi dinonaktifkan karena database sudah memiliki pengguna!'
                ], 403);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memeriksa status database: ' . $e->getMessage()
            ], 500);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:4'
        ]);

        $user = \App\Models\User::create([
            'name' => trim($request->name),
            'username' => trim($request->username),
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => 'owner'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun Owner pertama berhasil didaftarkan!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ]);
    }
}
