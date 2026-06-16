<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barang;
use App\Models\Rak;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class BarangController extends Controller
{
    /**
     * Get all products.
     */
    public function index()
    {
        $barangs = Barang::with('rak')->orderBy('nama_barang', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $barangs
        ]);
    }

    /**
     * Get all racks.
     */
    public function raks()
    {
        $raks = Rak::orderBy('nama_rak', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $raks
        ]);
    }

    /**
     * Store a new product.
     */
    public function store(Request $request)
    {
        // Check authorization (only owner can CRUD)
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses untuk menambah produk!'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'rack' => 'required|string|max:255',
            'stock' => 'nullable|integer|min:0',
            'limit' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|string',
        ]);

        $rackName = trim($request->rack);

        // Auto-resolve or create Rak
        $rak = Rak::where('nama_rak', $rackName)->first();
        if (!$rak) {
            $kode_rak = 'RAK-' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $rackName));
            if (empty($kode_rak)) {
                $kode_rak = 'RAK-' . strtoupper(Str::random(5));
            }
            // Ensure uniqueness of kode_rak
            $count = Rak::where('kode_rak', $kode_rak)->count();
            if ($count > 0) {
                $kode_rak .= '-' . rand(10, 99);
            }
            $rak = Rak::create([
                'nama_rak' => $rackName,
                'kode_rak' => $kode_rak
            ]);
        }

        // Generate unique kode_barang
        $latest = Barang::orderBy('id', 'desc')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $kode_barang = 'BRG-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);

        // Ensure unique kode_barang
        while (Barang::where('kode_barang', $kode_barang)->exists()) {
            $nextId++;
            $kode_barang = 'BRG-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
        }

        $harga_jual = $request->price;
        $harga_beli = $harga_jual * 0.8; // Default cost of goods sold

        $barang = Barang::create([
            'kode_barang' => $kode_barang,
            'nama_barang' => $request->name,
            'harga_beli' => $harga_beli,
            'harga_jual' => $harga_jual,
            'stok' => $request->stock ?? 0,
            'stok_minimal' => $request->limit ?? 5,
            'image' => $request->image,
            'rak_id' => $rak->id,
        ]);

        // Reload rak relationship
        $barang->load('rak');

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan!',
            'data' => $barang
        ]);
    }

    /**
     * Update a product.
     */
    public function update(Request $request, $id)
    {
        // Check authorization (only owner can CRUD)
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses untuk mengubah produk!'
            ], 403);
        }

        $barang = Barang::find($id);
        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan!'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'rack' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'limit' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|string',
        ]);

        $rackName = trim($request->rack);

        // Auto-resolve or create Rak
        $rak = Rak::where('nama_rak', $rackName)->first();
        if (!$rak) {
            $kode_rak = 'RAK-' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $rackName));
            if (empty($kode_rak)) {
                $kode_rak = 'RAK-' . strtoupper(Str::random(5));
            }
            $count = Rak::where('kode_rak', $kode_rak)->count();
            if ($count > 0) {
                $kode_rak .= '-' . rand(10, 99);
            }
            $rak = Rak::create([
                'nama_rak' => $rackName,
                'kode_rak' => $kode_rak
            ]);
        }

        $harga_jual = $request->price;
        $harga_beli = $barang->harga_beli;
        if ($harga_beli > $harga_jual) {
            $harga_beli = $harga_jual * 0.8;
        }

        $barang->update([
            'nama_barang' => $request->name,
            'harga_beli' => $harga_beli,
            'harga_jual' => $harga_jual,
            'stok' => $request->stock,
            'stok_minimal' => $request->limit,
            'image' => $request->image ?? $barang->image,
            'rak_id' => $rak->id,
        ]);

        $barang->load('rak');

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui!',
            'data' => $barang
        ]);
    }

    /**
     * Delete a product.
     */
    public function destroy($id)
    {
        // Check authorization (only owner can CRUD)
        if (!Auth::check() || Auth::user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki akses untuk menghapus produk!'
            ], 403);
        }

        $barang = Barang::find($id);
        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan!'
            ], 404);
        }

        $barang->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus!'
        ]);
    }

    /**
     * Restock a product.
     */
    public function restock(Request $request, $id)
    {
        // Check authorization (both owner and karyawan can restock)
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan login terlebih dahulu!'
            ], 401);
        }

        $request->validate([
            'amount' => 'required|integer|min:1'
        ]);

        $barang = Barang::find($id);
        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan!'
            ], 404);
        }

        $barang->stok += $request->amount;
        $barang->save();

        $barang->load('rak');

        return response()->json([
            'success' => true,
            'message' => 'Stok produk berhasil ditambah!',
            'data' => $barang
        ]);
    }
}
