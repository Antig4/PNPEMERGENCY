<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('police_station_id')
                  ->nullable()
                  ->after('status')
                  ->constrained('police_stations')
                  ->onDelete('set null');
            
            $table->index('police_station_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['police_station_id']);
            $table->dropColumn('police_station_id');
        });
    }
};
