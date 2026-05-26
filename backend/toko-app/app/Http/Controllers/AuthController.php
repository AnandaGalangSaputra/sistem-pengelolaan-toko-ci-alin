<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // halaman login
    public function login()
    {
        return view('login');
    }

    // proses login
    public function prosesLogin(Request $request)
    {
        $credentials = [
            'email' => $request->email,
            'password' => $request->password
        ];

        if(Auth::attempt($credentials)){

            $request->session()->regenerate();

            if(Auth::user()->role == 'owner'){
                return redirect('/dashboard-owner');
            }

            return redirect('/dashboard-karyawan');
        }

        return back()->with('error', 'Username atau password salah!');
    }

    // logout
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
