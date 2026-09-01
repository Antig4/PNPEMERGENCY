<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('incidents', 'responder_type')) {
                $table->enum('responder_type', ['PATROL', 'STATION'])->nullable()->after('assigned_station_id');
            }
            if (!Schema::hasColumn('incidents', 'decline_reason')) {
                $table->text('decline_reason')->nullable()->after('responder_type');
            }
            if (!Schema::hasColumn('incidents', 'photo_url')) {
                $table->text('photo_url')->nullable()->after('decline_reason');
            }
            if (!Schema::hasColumn('incidents', 'video_url')) {
                $table->text('video_url')->nullable()->after('photo_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn(['responder_type', 'decline_reason', 'photo_url', 'video_url']);
        });
    }
};
