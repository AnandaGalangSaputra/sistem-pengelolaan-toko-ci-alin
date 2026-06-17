<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class DatabaseController extends Controller
{
    /**
     * Download the SQLite database backup.
     */
    public function backup()
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $dbPath = config('database.connections.sqlite.database');
        if (!file_exists($dbPath)) {
            return response()->json([
                'success' => false,
                'message' => 'File database tidak ditemukan!'
            ], 404);
        }

        return response()->download($dbPath, 'backup_toko_alin_' . date('Ymd_His') . '.sqlite');
    }

    /**
     * Restore the database from a backup file.
     */
    public function restore(Request $request)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        $request->validate([
            'database' => 'required|file'
        ]);

        $file = $request->file('database');
        $ext = $file->getClientOriginalExtension();

        if ($ext !== 'sqlite' && $ext !== 'db') {
            return response()->json([
                'success' => false,
                'message' => 'Format file tidak valid! Gunakan format .sqlite atau .db'
            ], 422);
        }

        $dbPath = config('database.connections.sqlite.database');
        $backupTemp = $dbPath . '.temp_backup';

        if (file_exists($dbPath)) {
            copy($dbPath, $backupTemp);
        }

        try {
            // Overwrite database file
            copy($file->getRealPath(), $dbPath);

            // Test if connection works
            DB::reconnect();
            DB::select('SELECT 1');

            if (file_exists($backupTemp)) {
                unlink($backupTemp);
            }

            return response()->json([
                'success' => true,
                'message' => 'Database berhasil dipulihkan! Halaman akan dimuat ulang.'
            ]);
        } catch (\Exception $e) {
            // Restore temp backup
            if (file_exists($backupTemp)) {
                copy($backupTemp, $dbPath);
                unlink($backupTemp);
            }
            return response()->json([
                'success' => false,
                'message' => 'Gagal memulihkan database. Pastikan file SQLite valid! Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset the database to default seed state or clean slate.
     */
    public function reset(Request $request)
    {
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses!'
            ], 403);
        }

        try {
            $clean = $request->input('clean', false);

            if ($clean) {
                // Completely empty database
                Artisan::call('migrate:fresh', [
                    '--force' => true
                ]);
            } else {
                // Seeded database, but with empty users to trigger registration gate
                Artisan::call('migrate:fresh', [
                    '--seed' => true,
                    '--force' => true
                ]);
                
                // Clear the seeded users so registration gate triggers
                \App\Models\User::query()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Database berhasil direset! Halaman akan dimuat ulang.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mereset database! Error: ' . $e->getMessage()
            ], 500);
        }
    }
}
