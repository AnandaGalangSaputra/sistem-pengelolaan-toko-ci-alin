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
    Schema::create('detail_transaksi', function (Blueprint $table) {
        $table->id();
        $table->foreignId('transaksi_id')->constrained('transaksi')->cascadeOnDelete();

        // PERBAIKAN: Jika direlasikan ke string 'kode_barang' di tabel 'barangs'
        $table->string('kode_barang');
        $table->foreign('kode_barang')->references('kode_barang')->on('barangs')->cascadeOnDelete();

        // ALTERNATIF: Jika sebenarnya Anda ingin menyambungkan ke id utama (bigint) milik tabel barangs,
        // gunakan baris di bawah ini dan hapus dua baris kode_barang di atas:
        // $table->foreignId('barang_id')->constrained('barangs')->cascadeOnDelete();

        $table->integer('qty');
        $table->decimal('harga', 12, 2);
        $table->decimal('subtotal', 12, 2);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PERBAIKAN: Menyamakan nama tabel dengan yang ada di fungsi up()
        Schema::dropIfExists('detail_transaksi');
    }
};
