<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key checks for truncation (SQLite safe)
        User::query()->delete();

        User::create([
            'name' => 'Owner Ce Alin',
            'username' => 'owner',
            'password' => Hash::make('owner123'),
            'role' => 'owner',
        ]);

        User::create([
            'name' => 'Karyawan Alin',
            'username' => 'karyawan',
            'password' => Hash::make('admin123'),
            'role' => 'karyawan',
        ]);
    }
}
