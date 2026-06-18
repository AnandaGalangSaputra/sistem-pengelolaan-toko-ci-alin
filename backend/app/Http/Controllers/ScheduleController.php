<?php

namespace App\Http\Controllers;

use App\Models\JadwalPekerja;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    /**
     * Get all schedules.
     */
    public function index()
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $schedules = JadwalPekerja::with('user')->get();
        
        // Also return users list for owner so they can assign schedules
        $users = [];
        if (Auth::user()->role === 'owner') {
            $users = User::orderBy('name', 'asc')->get();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'schedules' => $schedules,
                'users' => $users
            ]
        ]);
    }

    /**
     * Store or update a schedule (Owner only).
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
            'user_id' => 'required|exists:users,id',
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'shift' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:255'
        ]);

        $schedule = JadwalPekerja::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'hari' => $request->hari
            ],
            [
                'shift' => $request->shift,
                'keterangan' => $request->keterangan
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil disimpan!',
            'data' => $schedule->load('user')
        ]);
    }

    /**
     * Delete a schedule (Owner only).
     */
    public function destroy($id)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $schedule = JadwalPekerja::find($id);
        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan!'
            ], 404);
        }

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus!'
        ]);
    }
}
