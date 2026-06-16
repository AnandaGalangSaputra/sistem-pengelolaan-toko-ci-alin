<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'harga_beli',
        'harga_jual',
        'stok',
        'stok_minimal',
        'image',
        'rak_id',
    ];

    public function rak()
    {
        return $this->belongsTo(Rak::class);
    }
}
