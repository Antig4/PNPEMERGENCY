<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use App\Models\Incident;
use Laravel\Sanctum\Sanctum;

class DispatchTest extends TestCase
{
    use RefreshDatabase;

    protected User $citizen;
    protected PoliceStation $station;

    protected function setUp(): void
    {
        parent::setUp();

        $this->station = PoliceStation::create([
            'station_name' => 'Central Station',
            'station_code' => 'BCPO-PS1',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
            'status' => 'ACTIVE',
        ]);

        $this->citizen = User::create([
            'full_name' => 'Juan dela Cruz',
            'email' => 'citizen@example.com',
            'mobile_number' => '09171234567',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_CITIZEN,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_nearest_available_patrol_is_automatically_assigned()
    {
        // Near Officer (0.8 km)
        $userNear = User::create([
            'full_name' => 'Patrol Near',
            'email' => 'near@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_PATROL_OFFICER,
            'status' => User::STATUS_ACTIVE,
        ]);
        $patrolNear = PatrolOfficer::create([
            'user_id' => $userNear->id,
            'police_station_id' => $this->station->id,
            'badge_number' => 'PATROL-NEAR',
            'availability_status' => PatrolOfficer::STATUS_AVAILABLE,
            'current_latitude' => 8.9482,
            'current_longitude' => 125.5412,
        ]);

        // Far Officer (3.0 km)
        $userFar = User::create([
            'full_name' => 'Patrol Far',
            'email' => 'far@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_PATROL_OFFICER,
            'status' => User::STATUS_ACTIVE,
        ]);
        $patrolFar = PatrolOfficer::create([
            'user_id' => $userFar->id,
            'police_station_id' => $this->station->id,
            'badge_number' => 'PATROL-FAR',
            'availability_status' => PatrolOfficer::STATUS_AVAILABLE,
            'current_latitude' => 8.9700,
            'current_longitude' => 125.5800,
        ]);

        Sanctum::actingAs($this->citizen);

        $response = $this->postJson('/api/incidents', [
            'emergency_type' => 'CRIME_POLICE',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
            'description' => 'Suspicious activity near plaza',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dispatch_result' => [
                        'dispatched' => true,
                    ],
                ],
            ]);

        $incident = Incident::first();
        $this->assertEquals($patrolNear->id, $incident->assigned_patrol_id);
        $this->assertEquals('NOTIFIED', $incident->status);
    }

    public function test_fallback_to_station_when_no_patrol_is_available()
    {
        // Only an OFF_DUTY officer exists
        $userOffDuty = User::create([
            'full_name' => 'Patrol OffDuty',
            'email' => 'offduty@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_PATROL_OFFICER,
            'status' => User::STATUS_ACTIVE,
        ]);
        PatrolOfficer::create([
            'user_id' => $userOffDuty->id,
            'police_station_id' => $this->station->id,
            'badge_number' => 'PATROL-OFF',
            'availability_status' => PatrolOfficer::STATUS_OFF_DUTY,
            'current_latitude' => 8.9482,
            'current_longitude' => 125.5412,
        ]);

        Sanctum::actingAs($this->citizen);

        $response = $this->postJson('/api/incidents', [
            'emergency_type' => 'CRIME_POLICE',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dispatch_result' => [
                        'dispatched' => false,
                    ],
                ],
            ]);

        $incident = Incident::first();
        $this->assertNull($incident->assigned_patrol_id);
        $this->assertEquals($this->station->id, $incident->assigned_station_id);
        $this->assertEquals('NOTIFIED', $incident->status);
    }
}
