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
    Schema::create('approval_diskon', function (Blueprint $table) {
        $table->id();
        $table->foreignId('transaksi_id')->constrained('transaksi')->cascadeOnDelete();
        $table->foreignId('owner_id')->constrained('users');
        $table->decimal('persentase_diskon', 5, 2);
        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->text('catatan')->nullable();
        $table->timestamp('approved_at')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_diskons');
    }
};
