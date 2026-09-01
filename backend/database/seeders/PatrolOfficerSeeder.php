<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use Illuminate\Support\Facades\Hash;

class PatrolOfficerSeeder extends Seeder
{
    public function run(): void
    {
        $station1 = PoliceStation::where('station_code', 'BCPO-PS1')->first();
        $station2 = PoliceStation::where('station_code', 'BCPO-PS2')->first();
        $station3 = PoliceStation::where('station_code', 'BCPO-PS3')->first();

        // 1. Citizen Demo Account
        User::updateOrCreate(
            ['email' => 'citizen@emergencylink.ph'],
            [
                'full_name' => 'Juan dela Cruz',
                'mobile_number' => '09171234567',
                'password' => Hash::make('citizenpass123'),
                'role' => User::ROLE_CITIZEN,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 2. Admin Command Center Accounts
        User::updateOrCreate(
            ['email' => 'admin@emergencylink.ph'],
            [
                'full_name' => 'Command Center Admin',
                'mobile_number' => '09179990000',
                'password' => Hash::make('adminpass123'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
            ]
        );
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'full_name' => 'System Administrator',
                'mobile_number' => '09179990001',
                'password' => Hash::make('adminpass123'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        // 3. Station User Accounts (Strictly Linked to Police Stations)
        if ($station1) {
            User::updateOrCreate(
                ['email' => 'station1@emergencylink.ph'],
                [
                    'full_name' => 'Station 1 Desk Officer',
                    'mobile_number' => '09171110001',
                    'password' => Hash::make('stationpass123'),
                    'role' => User::ROLE_STATION_USER,
                    'status' => User::STATUS_ACTIVE,
                    'police_station_id' => $station1->id,
                ]
            );
            User::updateOrCreate(
                ['email' => 'station1@example.com'],
                [
                    'full_name' => 'Station 1 Officer (Example)',
                    'mobile_number' => '09171110002',
                    'password' => Hash::make('stationpass123'),
                    'role' => User::ROLE_STATION_USER,
                    'status' => User::STATUS_ACTIVE,
                    'police_station_id' => $station1->id,
                ]
            );
        }

        if ($station2) {
            User::updateOrCreate(
                ['email' => 'station2@emergencylink.ph'],
                [
                    'full_name' => 'Station 2 Desk Officer',
                    'mobile_number' => '09172220001',
                    'password' => Hash::make('stationpass123'),
                    'role' => User::ROLE_STATION_USER,
                    'status' => User::STATUS_ACTIVE,
                    'police_station_id' => $station2->id,
                ]
            );
            User::updateOrCreate(
                ['email' => 'station2@example.com'],
                [
                    'full_name' => 'Station 2 Officer (Example)',
                    'mobile_number' => '09172220002',
                    'password' => Hash::make('stationpass123'),
                    'role' => User::ROLE_STATION_USER,
                    'status' => User::STATUS_ACTIVE,
                    'police_station_id' => $station2->id,
                ]
            );
        }

        // 2. Patrol Officer 01 (AVAILABLE - Closest: ~0.8 km)
        $user1 = User::updateOrCreate(
            ['email' => 'patrol01@emergencylink.ph'],
            [
                'full_name' => 'Patrol Officer Marco Santos',
                'mobile_number' => '09181112222',
                'password' => Hash::make('patrolpass123'),
                'role' => User::ROLE_PATROL_OFFICER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        PatrolOfficer::updateOrCreate(
            ['badge_number' => 'BCPO-99421'],
            [
                'user_id' => $user1->id,
                'police_station_id' => $station1?->id ?? 1,
                'patrol_unit_name' => 'Mobile Patrol Unit 1',
                'availability_status' => PatrolOfficer::STATUS_AVAILABLE,
                'current_latitude' => 8.9482,
                'current_longitude' => 125.5412,
                'location_accuracy' => 4.5,
                'location_updated_at' => now(),
            ]
        );

        // 3. Patrol Officer 02 (AVAILABLE - Medium distance: ~1.5 km)
        $user2 = User::updateOrCreate(
            ['email' => 'patrol02@emergencylink.ph'],
            [
                'full_name' => 'Patrol Officer Carlo Reyes',
                'mobile_number' => '09183334444',
                'password' => Hash::make('patrolpass123'),
                'role' => User::ROLE_PATROL_OFFICER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        PatrolOfficer::updateOrCreate(
            ['badge_number' => 'BCPO-99422'],
            [
                'user_id' => $user2->id,
                'police_station_id' => $station1?->id ?? 1,
                'patrol_unit_name' => 'Mobile Patrol Unit 2',
                'availability_status' => PatrolOfficer::STATUS_AVAILABLE,
                'current_latitude' => 8.9550,
                'current_longitude' => 125.5490,
                'location_accuracy' => 5.0,
                'location_updated_at' => now(),
            ]
        );

        // 4. Patrol Officer 03 (RESPONDING - Busy)
        $user3 = User::updateOrCreate(
            ['email' => 'patrol03@emergencylink.ph'],
            [
                'full_name' => 'Patrol Officer Angela Mendoza',
                'mobile_number' => '09185556666',
                'password' => Hash::make('patrolpass123'),
                'role' => User::ROLE_PATROL_OFFICER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        PatrolOfficer::updateOrCreate(
            ['badge_number' => 'BCPO-99423'],
            [
                'user_id' => $user3->id,
                'police_station_id' => $station2?->id ?? 2,
                'patrol_unit_name' => 'Mobile Patrol Unit 3',
                'availability_status' => PatrolOfficer::STATUS_RESPONDING,
                'current_latitude' => 8.9600,
                'current_longitude' => 125.5550,
                'location_accuracy' => 6.0,
                'location_updated_at' => now(),
            ]
        );

        // 5. Patrol Officer 04 (OFF_DUTY - Excluded)
        $user4 = User::updateOrCreate(
            ['email' => 'patrol04@emergencylink.ph'],
            [
                'full_name' => 'Patrol Officer Ramon Cruz',
                'mobile_number' => '09187778888',
                'password' => Hash::make('patrolpass123'),
                'role' => User::ROLE_PATROL_OFFICER,
                'status' => User::STATUS_ACTIVE,
            ]
        );

        PatrolOfficer::updateOrCreate(
            ['badge_number' => 'BCPO-99424'],
            [
                'user_id' => $user4->id,
                'police_station_id' => $station2?->id ?? 2,
                'patrol_unit_name' => 'Mobile Patrol Unit 4',
                'availability_status' => PatrolOfficer::STATUS_OFF_DUTY,
                'current_latitude' => 8.9300,
                'current_longitude' => 125.5200,
                'location_accuracy' => 10.0,
                'location_updated_at' => now(),
            ]
        );
    }
}
