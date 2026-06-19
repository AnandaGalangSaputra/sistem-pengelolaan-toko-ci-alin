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
        Schema::table('raks', function (Blueprint $table) {
            $table->string('baris')->default('1');
            $table->integer('lebar')->default(1);
            $table->integer('tinggi')->default(1);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raks', function (Blueprint $table) {
            $table->dropColumn(['baris', 'lebar', 'tinggi']);
        });
    }
};
