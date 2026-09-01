<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patrol_officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('police_station_id')->constrained()->onDelete('restrict');
            $table->string('badge_number', 50)->unique();
            $table->string('patrol_unit_name', 100)->nullable();
            $table->enum('availability_status', [
                'AVAILABLE', 'RESPONDING', 'ON_SCENE', 'OFF_DUTY', 'OFFLINE'
            ])->default('OFFLINE');
            $table->decimal('current_latitude', 10, 7)->nullable();
            $table->decimal('current_longitude', 10, 7)->nullable();
            $table->decimal('location_accuracy', 8, 2)->nullable();
            $table->timestamp('location_updated_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('police_station_id');
            $table->index('badge_number');
            $table->index('availability_status');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE patrol_officers ADD COLUMN current_location geography(POINT, 4326)');
            DB::statement('CREATE INDEX patrol_officers_location_idx ON patrol_officers USING GIST (current_location)');

            DB::statement("
                CREATE OR REPLACE FUNCTION sync_patrol_officer_location()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    IF NEW.current_latitude IS NOT NULL AND NEW.current_longitude IS NOT NULL THEN
                        NEW.current_location = ST_SetSRID(ST_MakePoint(NEW.current_longitude, NEW.current_latitude), 4326)::geography;
                        NEW.location_updated_at = NOW();
                    END IF;
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;
            ");

            DB::statement("
                CREATE TRIGGER patrol_officer_location_trigger
                BEFORE INSERT OR UPDATE OF current_latitude, current_longitude ON patrol_officers
                FOR EACH ROW EXECUTE FUNCTION sync_patrol_officer_location();
            ");
        }
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS patrol_officer_location_trigger ON patrol_officers');
        DB::statement('DROP FUNCTION IF EXISTS sync_patrol_officer_location()');
        Schema::dropIfExists('patrol_officers');
    }
};
