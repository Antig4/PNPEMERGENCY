<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$citizen = \App\Models\User::where('role', 'CITIZEN')->first();
$inc = \App\Models\Incident::create([
    'reference_number' => \App\Models\Incident::generateReferenceNumber(),
    'citizen_id' => $citizen->id,
    'emergency_type' => 'CRIME_POLICE',
    'description' => 'Citizen Emergency Alert - Real Time Test',
    'latitude' => 8.9475,
    'longitude' => 125.5406,
    'reported_at' => now(),
    'status' => 'NOTIFIED',
]);

echo "CREATED INCIDENT: " . $inc->reference_number . PHP_EOL;
echo "TOTAL DB INCIDENTS: " . \App\Models\Incident::count() . PHP_EOL;
