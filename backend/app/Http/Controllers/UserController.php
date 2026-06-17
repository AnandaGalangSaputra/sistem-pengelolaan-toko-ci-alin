<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Get all users.
     */
    public function index()
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $users = User::orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Store a new user.
     */
    public function store(Request $request)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:4',
            'role' => 'required|string|in:owner,karyawan'
        ]);

        $user = User::create([
            'name' => trim($request->name),
            'username' => trim($request->username),
            'password' => Hash::make($request->password),
            'role' => strtolower($request->role)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan!',
            'data' => $user
        ]);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, $id)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan!'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $id,
            'password' => 'nullable|string|min:4',
            'role' => 'required|string|in:owner,karyawan'
        ]);

        $currentUser = Auth::user();

        // Prevent owner from demoting themselves to employee (lockout protection)
        if ($currentUser->id === $user->id && strtolower($request->role) !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mengubah peran Anda sendiri demi menghindari lockout!'
            ], 400);
        }

        $user->name = trim($request->name);
        $user->username = trim($request->username);
        $user->role = strtolower($request->role);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui!',
            'data' => $user
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy($id)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan!'
            ], 404);
        }

        $currentUser = Auth::user();

        // Prevent owner from deleting their own active session
        if ($currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan!'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus!'
        ]);
    }
}
