<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use App\Models\Incident;
use Laravel\Sanctum\Sanctum;

class PatrolTest extends TestCase
{
    use RefreshDatabase;

    protected User $patrolUser;
    protected PatrolOfficer $officer;
    protected Incident $incident;

    protected function setUp(): void
    {
        parent::setUp();

        $station = PoliceStation::create([
            'station_name' => 'Central Station',
            'station_code' => 'BCPO-PS1',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
        ]);

        $citizen = User::create([
            'full_name' => 'Citizen User',
            'email' => 'citizen@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_CITIZEN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->patrolUser = User::create([
            'full_name' => 'Patrol Santos',
            'email' => 'patrol@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_PATROL_OFFICER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->officer = PatrolOfficer::create([
            'user_id' => $this->patrolUser->id,
            'police_station_id' => $station->id,
            'badge_number' => 'BCPO-99421',
            'availability_status' => PatrolOfficer::STATUS_AVAILABLE,
            'current_latitude' => 8.9480,
            'current_longitude' => 125.5410,
        ]);

        $this->incident = Incident::create([
            'reference_number' => 'INC-000001',
            'citizen_id' => $citizen->id,
            'emergency_type' => 'CRIME_POLICE',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
            'status' => Incident::STATUS_NOTIFIED,
            'assigned_patrol_id' => $this->officer->id,
            'assigned_station_id' => $station->id,
        ]);
    }

    public function test_patrol_officer_can_accept_assignment()
    {
        Sanctum::actingAs($this->patrolUser);

        $response = $this->postJson("/api/patrol/incidents/{$this->incident->id}/accept");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'ACCEPTED'],
            ]);

        $this->officer->refresh();
        $this->assertEquals('RESPONDING', $this->officer->availability_status);
    }

    public function test_patrol_officer_can_update_status_to_on_scene()
    {
        $this->incident->update(['status' => Incident::STATUS_ACCEPTED]);
        $this->officer->update(['availability_status' => PatrolOfficer::STATUS_RESPONDING]);

        Sanctum::actingAs($this->patrolUser);

        $response = $this->patchJson("/api/patrol/incidents/{$this->incident->id}/status", [
            'status' => 'ON_SCENE',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'ON_SCENE'],
            ]);

        $this->officer->refresh();
        $this->assertEquals('ON_SCENE', $this->officer->availability_status);
    }

    public function test_patrol_officer_can_resolve_incident_and_restore_availability()
    {
        $this->incident->update(['status' => Incident::STATUS_ON_SCENE]);
        $this->officer->update(['availability_status' => PatrolOfficer::STATUS_ON_SCENE]);

        Sanctum::actingAs($this->patrolUser);

        $response = $this->postJson("/api/patrol/incidents/{$this->incident->id}/resolve", [
            'resolution_summary' => 'Suspect apprehended and turned over to station desk.',
            'resolution_outcome' => 'RESOLVED',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'RESOLVED',
                    'resolution_outcome' => 'RESOLVED',
                ],
            ]);

        $this->officer->refresh();
        $this->assertEquals('AVAILABLE', $this->officer->availability_status);
    }

    public function test_patrol_location_update()
    {
        Sanctum::actingAs($this->patrolUser);

        $response = $this->postJson('/api/patrol/location', [
            'latitude' => 8.9490,
            'longitude' => 125.5420,
            'accuracy' => 3.5,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'latitude' => 8.9490,
                    'longitude' => 125.5420,
                ],
            ]);

        $this->officer->refresh();
        $this->assertEquals(8.9490, $this->officer->current_latitude);
    }
}
