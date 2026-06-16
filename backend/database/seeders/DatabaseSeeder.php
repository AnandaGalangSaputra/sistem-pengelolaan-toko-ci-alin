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
        // Disable foreign key checks / delete existing records to refresh seeder
        \App\Models\Barang::query()->delete();
        \App\Models\Rak::query()->delete();
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

        // Seed default racks
        $rakA1 = \App\Models\Rak::create(['kode_rak' => 'RAK-A-1', 'nama_rak' => 'Rak A-1']);
        $rakB2 = \App\Models\Rak::create(['kode_rak' => 'RAK-B-2', 'nama_rak' => 'Rak B-2']);
        $rakC1 = \App\Models\Rak::create(['kode_rak' => 'RAK-C-1', 'nama_rak' => 'Rak C-1']);
        $rakD3 = \App\Models\Rak::create(['kode_rak' => 'RAK-D-3', 'nama_rak' => 'Rak D-3']);
        $rakA4 = \App\Models\Rak::create(['kode_rak' => 'RAK-A-4', 'nama_rak' => 'Rak A-4']);

        // Seed default products
        \App\Models\Barang::create([
            'kode_barang' => 'BRG-00001',
            'nama_barang' => 'Bearing 6204 NSK',
            'harga_beli' => 28000,
            'harga_jual' => 35000,
            'stok' => 3,
            'stok_minimal' => 10,
            'image' => 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&auto=format&fit=crop&q=60',
            'rak_id' => $rakA1->id,
        ]);

        \App\Models\Barang::create([
            'kode_barang' => 'BRG-00002',
            'nama_barang' => 'Kunci Pas Set 8-24 mm',
            'harga_beli' => 100000,
            'harga_jual' => 125000,
            'stok' => 5,
            'stok_minimal' => 10,
            'image' => 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=60',
            'rak_id' => $rakB2->id,
        ]);

        \App\Models\Barang::create([
            'kode_barang' => 'BRG-00003',
            'nama_barang' => 'Mata Gerinda Potong 4 Inch',
            'harga_beli' => 14000,
            'harga_jual' => 18000,
            'stok' => 4,
            'stok_minimal' => 8,
            'image' => 'https://images.unsplash.com/photo-1581092160607-ee22731d8d8c?w=400&auto=format&fit=crop&q=60',
            'rak_id' => $rakC1->id,
        ]);

        \App\Models\Barang::create([
            'kode_barang' => 'BRG-00004',
            'nama_barang' => 'Selang Air PVC 1/2 Inch',
            'harga_beli' => 36000,
            'harga_jual' => 45000,
            'stok' => 8,
            'stok_minimal' => 15,
            'image' => 'https://images.unsplash.com/photo-1581092919535-7146ff1a590f?w=400&auto=format&fit=crop&q=60',
            'rak_id' => $rakD3->id,
        ]);

        \App\Models\Barang::create([
            'kode_barang' => 'BRG-00005',
            'nama_barang' => 'Obeng Plus Minus Set',
            'harga_beli' => 60000,
            'harga_jual' => 75000,
            'stok' => 2,
            'stok_minimal' => 10,
            'image' => 'https://images.unsplash.com/photo-1581147036324-c1c8b98c4f4b?w=400&auto=format&fit=crop&q=60',
            'rak_id' => $rakA4->id,
        ]);
    }
}
