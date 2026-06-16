<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rak extends Model
{
    protected $fillable = ['kode_rak', 'nama_rak', 'keterangan', 'color'];

    public function barangs()
    {
        return $this->hasMany(Barang::class);
    }
}
