<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksi';

    protected $fillable = [
        'kode_transaksi',
        'user_id',
        'nama_pelanggan',
        'no_telp_pelanggan',
        'tanggal',
        'total_harga',
        'total_diskon',
        'grand_total',
        'metode_pembayaran',
    ];

    public function details()
    {
        return $this->hasMany(DetailTransaksi::class, 'transaksi_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
