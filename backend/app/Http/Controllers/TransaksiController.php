<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Barang;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TransaksiController extends Controller
{
    /**
     * Get all transactions.
     */
    public function index()
    {
        $transactions = Transaksi::with(['details.barang', 'user'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Store a new transaction.
     */
    public function store(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan login terlebih dahulu!'
            ], 401);
        }

        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.product.id' => 'required|exists:barangs,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'total_harga' => 'required|numeric|min:0',
            'total_diskon' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'customer' => 'nullable|array',
            'customer.name' => 'nullable|string|max:255',
            'customer.phone' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();

        try {
            $customerData = $request->customer;
            
            // Auto-register customer if name and phone are supplied
            if (!empty($customerData['name']) && !empty($customerData['phone'])) {
                $name = trim($customerData['name']);
                $phone = trim($customerData['phone']);
                Customer::firstOrCreate(
                    ['no_telp' => $phone],
                    ['nama' => $name, 'tipe' => 'Reguler']
                );
            }

            // Generate unique sequential transaction code
            $today = date('Ymd');
            $prefix = 'TRX-' . $today . '-';
            $latest = Transaksi::where('kode_transaksi', 'like', $prefix . '%')
                ->orderBy('id', 'desc')
                ->first();

            if ($latest) {
                $num = intval(substr($latest->kode_transaksi, strlen($prefix)));
                $nextNum = str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $nextNum = '0001';
            }
            $kode_transaksi = $prefix . $nextNum;

            // Create Transaction record
            $transaksi = Transaksi::create([
                'kode_transaksi' => $kode_transaksi,
                'user_id' => Auth::id(),
                'nama_pelanggan' => !empty($customerData['name']) ? trim($customerData['name']) : 'Umum',
                'no_telp_pelanggan' => !empty($customerData['phone']) ? trim($customerData['phone']) : null,
                'tanggal' => now(),
                'total_harga' => $request->total_harga,
                'total_diskon' => $request->total_diskon,
                'grand_total' => $request->grand_total,
            ]);

            // Save details and deduct stocks
            foreach ($request->cart as $item) {
                $barang = Barang::lockForUpdate()->find($item['product']['id']);
                
                if (!$barang) {
                    throw new \Exception('Produk tidak ditemukan!');
                }

                if ($barang->stok < $item['quantity']) {
                    throw new \Exception('Stok produk "' . $barang->nama_barang . '" tidak mencukupi! Tersisa ' . $barang->stok . ' unit.');
                }

                DetailTransaksi::create([
                    'transaksi_id' => $transaksi->id,
                    'barang_id' => $barang->id,
                    'qty' => $item['quantity'],
                    'harga' => $barang->harga_jual,
                    'subtotal' => $item['quantity'] * $barang->harga_jual,
                ]);

                // Deduct stock
                $barang->stok = max(0, $barang->stok - $item['quantity']);
                $barang->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan!',
                'data' => $transaksi
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
