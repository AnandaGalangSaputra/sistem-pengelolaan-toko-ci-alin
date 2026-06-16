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
        Schema::create('pengaturan_tokos', function (Blueprint $table) {
            $table->id();
            $table->string('shop_name');
            $table->text('shop_address')->nullable();
            $table->string('shop_whatsapp')->nullable();
            $table->boolean('printer_paired')->default(false);
            $table->string('printer_name')->nullable();
            $table->boolean('wa_paired')->default(false);
            $table->string('wa_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengaturan_tokos');
    }
};
