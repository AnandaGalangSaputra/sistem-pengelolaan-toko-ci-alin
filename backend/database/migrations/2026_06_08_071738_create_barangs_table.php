<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('barangs', function (Blueprint $table) {
            $table->id(); // Ini akan menjadi primary key default (bigint)
            $table->string('kode_barang')->unique(); // Ini string unik
            $table->string('nama_barang');
            $table->decimal('harga_beli', 12, 2);
            $table->decimal('harga_jual', 12, 2);
            $table->integer('stok')->default(0);
            $table->integer('stok_minimal')->default(5);

            // PERBAIKAN: Menggunakan foreignId untuk relasi ke tabel raks
            $table->foreignId('rak_id')->constrained('raks')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangs');
    }
};
