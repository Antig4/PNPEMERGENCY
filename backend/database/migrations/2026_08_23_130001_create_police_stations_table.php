<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('police_stations', function (Blueprint $table) {
            $table->id();
            $table->string('station_name');
            $table->string('station_code', 20)->unique();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('contact_number', 20)->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->timestamps();

            $table->index('station_code');
            $table->index('status');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE police_stations ADD COLUMN location geography(POINT, 4326)');
            DB::statement('CREATE INDEX police_stations_location_idx ON police_stations USING GIST (location)');

            DB::statement("
                CREATE OR REPLACE FUNCTION sync_police_station_location()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
                    RETURN NEW;
                END;
                \$\$ LANGUAGE plpgsql;
            ");

            DB::statement("
                CREATE TRIGGER police_station_location_trigger
                BEFORE INSERT OR UPDATE OF latitude, longitude ON police_stations
                FOR EACH ROW EXECUTE FUNCTION sync_police_station_location();
            ");
        }
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS police_station_location_trigger ON police_stations');
        DB::statement('DROP FUNCTION IF EXISTS sync_police_station_location()');
        Schema::dropIfExists('police_stations');
    }
};
