<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        }

        Schema::table('users', function (Blueprint $table) {
            // Replace default users table with our extended version
            $table->dropColumn(['name']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->after('id');
            $table->string('mobile_number', 20)->nullable()->after('email');
            $table->enum('role', ['CITIZEN', 'PATROL_OFFICER', 'STATION_USER', 'ADMIN'])
                  ->default('CITIZEN')->after('mobile_number');
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])
                  ->default('ACTIVE')->after('role');

            $table->index('email');
            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['full_name', 'mobile_number', 'role', 'status']);
            $table->string('name');
        });

        DB::statement('DROP EXTENSION IF EXISTS postgis CASCADE');
        DB::statement('DROP EXTENSION IF EXISTS pg_trgm');
    }
};
