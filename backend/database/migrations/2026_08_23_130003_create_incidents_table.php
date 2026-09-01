<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 20)->unique(); // e.g. INC-000001
            $table->foreignId('citizen_id')->constrained('users')->onDelete('restrict');
            $table->enum('emergency_type', ['CRIME_POLICE', 'MEDICAL', 'FIRE_RESCUE'])->default('CRIME_POLICE');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('location_accuracy', 8, 2)->nullable();
            $table->timestamp('reported_at')->useCurrent();
            $table->enum('status', [
                'NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING',
                'ON_SCENE', 'RESOLVED', 'CANCELLED', 'DECLINED', 'UNVERIFIED'
            ])->default('NEW');
            $table->foreignId('assigned_patrol_id')->nullable()->constrained('patrol_officers')->onDelete('set null');
            $table->foreignId('assigned_station_id')->nullable()->constrained('police_stations')->onDelete('set null');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('responding_at')->nullable();
            $table->timestamp('on_scene_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->enum('resolution_outcome', [
                'RESOLVED', 'REFERRED', 'NO_ASSISTANCE_REQUIRED', 'UNABLE_TO_LOCATE', 'OTHER'
            ])->nullable();
            // Duplicate / prank detection
            $table->boolean('flagged_for_review')->default(false);
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index('reference_number');
            $table->index('status');
            $table->index('emergency_type');
            $table->index('reported_at');
            $table->index('citizen_id');
            $table->index('assigned_patrol_id');
            $table->index('assigned_station_id');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE incidents ADD COLUMN location geography(POINT, 4326)');
            DB::statement('CREATE INDEX incidents_location_idx ON incidents USING GIST (location)');

            DB::statement("
                CREATE OR REPLACE FUNCTION sync_incident_location()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;
            ");

            DB::statement("
                CREATE TRIGGER incident_location_trigger
                BEFORE INSERT OR UPDATE OF latitude, longitude ON incidents
                FOR EACH ROW EXECUTE FUNCTION sync_incident_location();
            ");
        }
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS incident_location_trigger ON incidents');
        DB::statement('DROP FUNCTION IF EXISTS sync_incident_location()');
        Schema::dropIfExists('incidents');
    }
};
