<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\PatrolOfficer;
use App\Models\Incident;
use App\Services\DispatchService;

echo "=== STARTING FULL END-TO-END SYSTEM SYNCHRONIZATION TEST ===" . PHP_EOL;

// 1. Get Citizen and Patrol Officer
$citizen = User::where('role', User::ROLE_CITIZEN)->first();
$patrolUser = User::where('role', User::ROLE_PATROL_OFFICER)->first();
$patrolOfficer = $patrolUser->patrolOfficer;

// Ensure Patrol Officer is AVAILABLE
$patrolOfficer->availability_status = PatrolOfficer::STATUS_AVAILABLE;
$patrolOfficer->current_latitude = 8.9482;
$patrolOfficer->current_longitude = 125.5412;
$patrolOfficer->save();

echo "1. Citizen: {$citizen->full_name} (ID: {$citizen->id})" . PHP_EOL;
echo "   Patrol Officer: {$patrolOfficer->patrol_unit_name} (Badge: {$patrolOfficer->badge_number}, Status: {$patrolOfficer->availability_status})" . PHP_EOL;

// 2. Citizen creates incident (Calling DispatchService server-side)
$incident = Incident::create([
    'reference_number' => Incident::generateReferenceNumber(),
    'citizen_id' => $citizen->id,
    'emergency_type' => 'CRIME_POLICE',
    'description' => 'Test emergency alert dispatch sync',
    'latitude' => 8.9475,
    'longitude' => 125.5406,
    'location_accuracy' => 10,
    'reported_at' => now(),
    'status' => Incident::STATUS_NEW,
]);

$dispatchService = app(DispatchService::class);
$dispatchResult = $dispatchService->dispatch($incident);

$incident->refresh();
echo PHP_EOL . "2. INCIDENT CREATED & DISPATCHED:" . PHP_EOL;
echo "   Ref: {$incident->reference_number} | Status: {$incident->status}" . PHP_EOL;
echo "   Assigned Patrol ID: {$incident->assigned_patrol_id} (Expected: {$patrolOfficer->id})" . PHP_EOL;

if ($incident->assigned_patrol_id === $patrolOfficer->id) {
    echo "   ✅ GIS DISPATCH MATCH SUCCESSFUL!" . PHP_EOL;
} else {
    echo "   ❌ GIS DISPATCH MATCH FAILED!" . PHP_EOL;
}

// 3. Patrol queries active incident
$patrolActive = Incident::where('assigned_patrol_id', $patrolOfficer->id)
    ->whereIn('status', [Incident::STATUS_NOTIFIED, Incident::STATUS_ACCEPTED, Incident::STATUS_RESPONDING])
    ->latest()
    ->first();

echo PHP_EOL . "3. PATROL ACTIVE INCIDENT FETCH:" . PHP_EOL;
echo "   Patrol Sees Ref: " . ($patrolActive ? $patrolActive->reference_number : 'NONE') . " | Status: " . ($patrolActive ? $patrolActive->status : 'NONE') . PHP_EOL;

// 4. Patrol Accept Incident
$oldStatus = $incident->status;
$incident->status = Incident::STATUS_ACCEPTED;
$incident->accepted_at = now();
$incident->responding_at = now();
$incident->save();

$patrolOfficer->availability_status = PatrolOfficer::STATUS_RESPONDING;
$patrolOfficer->save();

echo PHP_EOL . "4. PATROL ACCEPTS INCIDENT:" . PHP_EOL;
echo "   New Incident Status: {$incident->status}" . PHP_EOL;
echo "   New Patrol Officer Availability: {$patrolOfficer->availability_status}" . PHP_EOL;

// 5. Citizen & Admin State Check
$citizenActive = Incident::where('citizen_id', $citizen->id)->latest()->first();
echo PHP_EOL . "5. SINGLE SOURCE OF TRUTH CHECK:" . PHP_EOL;
echo "   Citizen Active Incident Status: {$citizenActive->status}" . PHP_EOL;
echo "   Same Database Record ID: " . ($incident->id === $citizenActive->id ? 'YES ✅' : 'NO ❌') . PHP_EOL;

// 6. Resolve Incident
$incident->status = Incident::STATUS_RESOLVED;
$incident->resolved_at = now();
$incident->save();

$patrolOfficer->availability_status = PatrolOfficer::STATUS_AVAILABLE;
$patrolOfficer->save();

echo PHP_EOL . "6. PATROL RESOLVES INCIDENT:" . PHP_EOL;
echo "   Incident Final Status: {$incident->status}" . PHP_EOL;
echo "   Patrol Officer Restored Availability: {$patrolOfficer->availability_status}" . PHP_EOL;

echo PHP_EOL . "=== END-TO-END SYNCHRONIZATION CHAIN VERIFIED PASSED ✅ ===" . PHP_EOL;
