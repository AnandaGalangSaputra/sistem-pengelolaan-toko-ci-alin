<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalPekerja extends Model
{
    protected $fillable = ['user_id', 'hari', 'shift', 'keterangan'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
