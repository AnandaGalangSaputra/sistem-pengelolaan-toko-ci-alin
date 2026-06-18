<?php

namespace App\Http\Controllers;

use App\Models\Presensi;
use App\Models\JadwalPekerja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PresensiController extends Controller
{
    /**
     * Get attendance list (Owner get all, Karyawan get personal).
     */
    public function index()
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = Auth::user();

        if ($user->role === 'owner') {
            // Owner sees all logs
            $logs = Presensi::with('user')
                ->orderBy('tanggal', 'desc')
                ->orderBy('waktu_masuk', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => 'owner',
                    'logs' => $logs
                ]
            ]);
        } else {
            // Employee sees their own logs
            $today = date('Y-m-d');
            $todayPresence = Presensi::where('user_id', $user->id)
                ->where('tanggal', $today)
                ->first();

            $history = Presensi::where('user_id', $user->id)
                ->orderBy('tanggal', 'desc')
                ->take(30)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => 'karyawan',
                    'today' => $todayPresence,
                    'history' => $history
                ]
            ]);
        }
    }

    /**
     * Submit attendance via webcam (base64 image upload).
     */
    public function store(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = Auth::user();
        $today = date('Y-m-d');

        // Check if already present today
        $exists = Presensi::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan presensi hari ini!'
            ], 400);
        }

        $request->validate([
            'foto' => 'required|string',
        ]);

        $imageData = $request->input('foto');
        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
            $type = strtolower($type[1]); // jpg, jpeg, png, webp
            if (!in_array($type, ['jpg', 'jpeg', 'png', 'webp'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format gambar tidak didukung!'
                ], 400);
            }
            $imageData = base64_decode($imageData);
            if ($imageData === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal memproses gambar!'
                ], 400);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Format gambar tidak valid!'
            ], 400);
        }

        // Generate file name
        $filename = $user->id . '_' . $today . '_' . time() . '.' . $type;
        $dir = public_path('storage/presensi');
        
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        $path = $dir . '/' . $filename;
        file_put_contents($path, $imageData);

        // Relative path saved in DB
        $foto_path = 'storage/presensi/' . $filename;

        // Determine status (Hadir/Terlambat) based on schedule shift
        $hariIniMap = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu'
        ];
        $hariIni = $hariIniMap[(int)date('w')];
        
        $jadwal = JadwalPekerja::where('user_id', $user->id)
            ->where('hari', $hariIni)
            ->first();

        $status = 'Hadir';
        $waktuMasuk = date('H:i:s');

        if ($jadwal && $jadwal->shift) {
            // E.g., shift format: "08:00 - 15:00" -> extract "08:00"
            preg_match('/^(\d{1,2}):(\d{2})/', trim($jadwal->shift), $matches);
            if (!empty($matches)) {
                $shiftHour = (int)$matches[1];
                $shiftMinute = (int)$matches[2];
                $currentHour = (int)date('H');
                $currentMinute = (int)date('i');

                if ($currentHour > $shiftHour || ($currentHour === $shiftHour && $currentMinute > $shiftMinute)) {
                    $status = 'Terlambat';
                }
            }
        }

        // Save presence
        $presensi = Presensi::create([
            'user_id' => $user->id,
            'tanggal' => $today,
            'waktu_masuk' => $waktuMasuk,
            'foto_path' => $foto_path,
            'status' => $status
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Presensi berhasil disimpan!',
            'data' => $presensi
        ]);
    }
}
