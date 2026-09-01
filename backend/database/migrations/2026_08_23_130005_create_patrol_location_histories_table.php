<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patrol_location_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patrol_officer_id')->constrained()->onDelete('cascade');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->string('patrol_status', 20)->nullable(); // context: RESPONDING, ON_SCENE
            $table->foreignId('incident_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('recorded_at')->useCurrent();

            $table->index('patrol_officer_id');
            $table->index('incident_id');
            $table->index('recorded_at');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE patrol_location_histories ADD COLUMN location geography(POINT, 4326)');
            DB::statement('CREATE INDEX patrol_loc_history_location_idx ON patrol_location_histories USING GIST (location)');

            DB::statement("
                CREATE OR REPLACE FUNCTION sync_patrol_location_history()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;
            ");

            DB::statement("
                CREATE TRIGGER patrol_loc_history_trigger
                BEFORE INSERT ON patrol_location_histories
                FOR EACH ROW EXECUTE FUNCTION sync_patrol_location_history();
            ");
        }
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS patrol_loc_history_trigger ON patrol_location_histories');
        DB::statement('DROP FUNCTION IF EXISTS sync_patrol_location_history()');
        Schema::dropIfExists('patrol_location_histories');
    }
};
