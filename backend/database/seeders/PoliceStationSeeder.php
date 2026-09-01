<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PoliceStation;

class PoliceStationSeeder extends Seeder
{
    public function run(): void
    {
        $stations = [
            [
                'station_name' => 'Butuan City Police Station 1 (Central Desk)',
                'station_code' => 'BCPO-PS1',
                'address' => 'JC Aquino Avenue, Butuan City, Agusan del Norte',
                'latitude' => 8.9475,
                'longitude' => 125.5406,
                'contact_number' => '085-341-2111',
                'status' => 'ACTIVE',
            ],
            [
                'station_name' => 'Butuan City Police Station 2 (Ampayon Desk)',
                'station_code' => 'BCPO-PS2',
                'address' => 'National Highway, Ampayon, Butuan City',
                'latitude' => 8.9560,
                'longitude' => 125.5890,
                'contact_number' => '085-815-4321',
                'status' => 'ACTIVE',
            ],
            [
                'station_name' => 'Butuan City Police Station 3 (Libertad Desk)',
                'station_code' => 'BCPO-PS3',
                'address' => 'Libertad Airport Road, Butuan City',
                'latitude' => 8.9380,
                'longitude' => 125.5050,
                'contact_number' => '085-342-9988',
                'status' => 'ACTIVE',
            ],
        ];

        foreach ($stations as $data) {
            PoliceStation::updateOrCreate(['station_code' => $data['station_code']], $data);
        }
    }
}
