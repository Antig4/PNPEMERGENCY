<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use Illuminate\Support\Facades\Hash;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_citizen_can_register()
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'Maria Clara',
            'email' => 'maria@example.com',
            'mobile_number' => '09179998888',
            'password' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Citizen account registered successfully.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'maria@example.com',
            'role' => 'CITIZEN',
        ]);
    }

    public function test_citizen_can_login()
    {
        User::create([
            'full_name' => 'Juan dela Cruz',
            'email' => 'juan@example.com',
            'mobile_number' => '09171234567',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_CITIZEN,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email_or_badge' => 'juan@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['token', 'user'],
            ]);
    }

    public function test_patrol_officer_can_login_with_badge_number()
    {
        $station = PoliceStation::create([
            'station_name' => 'Test Station',
            'station_code' => 'TS-01',
            'latitude' => 8.9475,
            'longitude' => 125.5406,
        ]);

        $user = User::create([
            'full_name' => 'Patrol Santos',
            'email' => 'patrol@example.com',
            'password' => Hash::make('patrolpass123'),
            'role' => User::ROLE_PATROL_OFFICER,
        ]);

        PatrolOfficer::create([
            'user_id' => $user->id,
            'police_station_id' => $station->id,
            'badge_number' => 'BCPO-99421',
            'patrol_unit_name' => 'Patrol Unit 1',
            'availability_status' => 'AVAILABLE',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email_or_badge' => 'BCPO-99421',
            'password' => 'patrolpass123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => ['token', 'user', 'patrol_officer'],
            ]);
    }

    public function test_unauthenticated_user_cannot_access_protected_endpoint()
    {
        $response = $this->getJson('/api/citizen/profile');
        $response->assertStatus(401);
    }
}
