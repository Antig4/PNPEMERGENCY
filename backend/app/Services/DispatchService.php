<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use App\Models\IncidentStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DispatchService
{
    /**
     * Dispatch an emergency incident to the nearest available patrol unit.
     *
     * @param Incident $incident
     * @return array
     */
    public function dispatch(Incident $incident): array
    {
        $lat = (float)$incident->latitude;
        $lng = (float)$incident->longitude;

        // 1. Find nearest Police Station
        $nearestStation = $this->findNearestPoliceStation($lat, $lng);
        $stationDistanceMeters = null;
        if ($nearestStation) {
            $stationDistanceMeters = property_exists($nearestStation, 'distance_meters') && $nearestStation->distance_meters !== null
                ? (float)$nearestStation->distance_meters
                : $this->haversineDistance($lat, $lng, (float)$nearestStation->latitude, (float)$nearestStation->longitude);
        }

        // 2. Find nearest AVAILABLE patrol officer
        $nearestPatrol = $this->findNearestAvailablePatrol($lat, $lng);
        $patrolDistanceMeters = null;
        if ($nearestPatrol) {
            $patrolDistanceMeters = property_exists($nearestPatrol, 'distance_meters') && $nearestPatrol->distance_meters !== null
                ? (float)$nearestPatrol->distance_meters
                : $this->haversineDistance($lat, $lng, (float)$nearestPatrol->current_latitude, (float)$nearestPatrol->current_longitude);
        }

        // 3. Determine nearest responder (Flow A vs Flow B)
        $isPatrolNearest = $nearestPatrol !== null && ($stationDistanceMeters === null || $patrolDistanceMeters < $stationDistanceMeters);

        $oldStatus = $incident->status;

        if ($isPatrolNearest && $nearestPatrol) {
            // FLOW A: PATROL IS NEAREST
            $distanceKm = round($patrolDistanceMeters / 1000, 2);
            $incident->responder_type = 'PATROL';
            $incident->assigned_patrol_id = $nearestPatrol->id;
            $incident->assigned_station_id = $nearestPatrol->police_station_id ?? ($nearestStation ? $nearestStation->id : null);
            $incident->status = Incident::STATUS_NOTIFIED;
            $incident->save();

            $nearestPatrol->load('user');
            $responderName = $nearestPatrol->user?->full_name ?? $nearestPatrol->patrol_unit_name;
            $responderContact = $nearestPatrol->user?->mobile_number ?? $nearestPatrol->contact_number ?? '09181112222';

            IncidentStatusHistory::create([
                'incident_id' => $incident->id,
                'changed_by_user_id' => $incident->citizen_id,
                'old_status' => $oldStatus,
                'new_status' => Incident::STATUS_NOTIFIED,
                'remarks' => "FLOW A: Nearest responder is Patrol Officer {$responderName} ({$nearestPatrol->badge_number}) at {$distanceKm} km.",
                'created_at' => now(),
            ]);

            Log::info("[DispatchService] Incident {$incident->reference_number} assigned via Flow A to Patrol {$nearestPatrol->badge_number} ({$distanceKm} km)");

            return [
                'dispatched' => true,
                'responder_type' => 'PATROL',
                'responder_name' => $responderName,
                'responder_contact_number' => $responderContact,
                'distance_km' => $distanceKm,
                'assigned_patrol' => $nearestPatrol,
                'station' => $nearestStation,
            ];
        } else {
            // FLOW B: STATION IS NEAREST (or no patrol available)
            $targetStation = $nearestStation ?? PoliceStation::first();
            $distanceKm = $stationDistanceMeters !== null ? round($stationDistanceMeters / 1000, 2) : 0.8;

            $incident->responder_type = 'STATION';
            $incident->assigned_patrol_id = null;
            $incident->assigned_station_id = $targetStation?->id;
            $incident->status = Incident::STATUS_NOTIFIED;
            $incident->save();

            $responderName = $targetStation?->station_name ?? 'Police Station 1';
            $responderContact = $targetStation?->contact_number ?? '085-341-2111';

            IncidentStatusHistory::create([
                'incident_id' => $incident->id,
                'changed_by_user_id' => $incident->citizen_id,
                'old_status' => $oldStatus,
                'new_status' => Incident::STATUS_NOTIFIED,
                'remarks' => "FLOW B: Nearest responder is Station Desk {$responderName} at {$distanceKm} km. Awaiting station dispatch.",
                'created_at' => now(),
            ]);

            Log::info("[DispatchService] Incident {$incident->reference_number} assigned via Flow B to Station {$responderName} ({$distanceKm} km)");

            return [
                'dispatched' => true,
                'responder_type' => 'STATION',
                'responder_name' => $responderName,
                'responder_contact_number' => $responderContact,
                'distance_km' => $distanceKm,
                'assigned_patrol' => null,
                'station' => $targetStation,
            ];
        }
    }

    /**
     * Re-dispatch an incident after an officer declines the assignment.
     */
    public function redispatchAfterDecline(Incident $incident, int $declinedPatrolId, string $declineReason): array
    {
        $lat = (float)$incident->latitude;
        $lng = (float)$incident->longitude;

        $incident->decline_reason = $declineReason;
        $incident->save();

        // Log decline
        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => auth()->id() ?? $incident->citizen_id,
            'old_status' => Incident::STATUS_NOTIFIED,
            'new_status' => Incident::STATUS_DECLINED,
            'remarks' => "Patrol officer declined dispatch. Reason: {$declineReason}",
            'created_at' => now(),
        ]);

        // Release the patrol officer back to AVAILABLE
        $declinedOfficer = PatrolOfficer::find($declinedPatrolId);
        if ($declinedOfficer && $declinedOfficer->availability_status === PatrolOfficer::STATUS_RESPONDING) {
            $declinedOfficer->availability_status = PatrolOfficer::STATUS_AVAILABLE;
            $declinedOfficer->save();
        }

        // Search for NEXT available patrol excluding the one who declined
        $nextPatrol = $this->findNearestAvailablePatrol($lat, $lng, [$declinedPatrolId]);

        if ($nextPatrol) {
            $distanceKm = round(($nextPatrol->distance_meters ?? $this->haversineDistance($lat, $lng, (float)$nextPatrol->current_latitude, (float)$nextPatrol->current_longitude)) / 1000, 2);

            $incident->responder_type = 'PATROL';
            $incident->assigned_patrol_id = $nextPatrol->id;
            $incident->status = Incident::STATUS_NOTIFIED;
            $incident->save();

            IncidentStatusHistory::create([
                'incident_id' => $incident->id,
                'changed_by_user_id' => auth()->id() ?? $incident->citizen_id,
                'old_status' => Incident::STATUS_DECLINED,
                'new_status' => Incident::STATUS_NOTIFIED,
                'remarks' => "Re-dispatched to next available patrol: {$nextPatrol->badge_number} at {$distanceKm} km.",
                'created_at' => now(),
            ]);

            return [
                'reassigned' => true,
                'responder_type' => 'PATROL',
                'assigned_patrol' => $nextPatrol,
                'distance_km' => $distanceKm,
            ];
        }

        // No other patrol available — fallback to Station manual dispatch flow
        $incident->responder_type = 'STATION';
        $incident->assigned_patrol_id = null;
        $incident->status = Incident::STATUS_NOTIFIED;
        $incident->save();

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => auth()->id() ?? $incident->citizen_id,
            'old_status' => Incident::STATUS_DECLINED,
            'new_status' => Incident::STATUS_NOTIFIED,
            'remarks' => 'No other available patrol officer found. Incident routed to station desk for manual dispatch.',
            'created_at' => now(),
        ]);

        return [
            'reassigned' => false,
            'responder_type' => 'STATION',
            'assigned_patrol' => null,
            'message' => 'No other available patrol unit found. Incident routed to station desk.',
        ];
    }

    /**
     * Calculate Haversine distance in meters between two GPS coordinates (Database agnostic)
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // in meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Find nearest AVAILABLE patrol officer using PostGIS or PHP Haversine fallback.
     */
    public function findNearestAvailablePatrol(float $lat, float $lng, array $excludeIds = []): ?PatrolOfficer
    {
        $driver = config('database.default');

        if ($driver === 'pgsql') {
            // PostGIS spatial query for distance calculation
            $query = PatrolOfficer::query()
                ->select('*')
                ->selectRaw(
                    'ST_Distance(current_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters',
                    [$lng, $lat]
                )
                ->where('availability_status', PatrolOfficer::STATUS_AVAILABLE)
                ->whereNotNull('current_latitude')
                ->whereNotNull('current_longitude');

            if (!empty($excludeIds)) {
                $query->whereNotIn('id', $excludeIds);
            }

            return $query->orderBy('distance_meters', 'asc')->first();
        }

        // Database-agnostic Haversine (SQLite / MySQL)
        $query = PatrolOfficer::query()
            ->where('availability_status', PatrolOfficer::STATUS_AVAILABLE)
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude');

        if (!empty($excludeIds)) {
            $query->whereNotIn('id', $excludeIds);
        }

        $officers = $query->get();
        if ($officers->isEmpty()) {
            return null;
        }

        $officers->each(function ($officer) use ($lat, $lng) {
            $officer->distance_meters = $this->haversineDistance($lat, $lng, (float)$officer->current_latitude, (float)$officer->current_longitude);
        });

        return $officers->sortBy('distance_meters')->first();
    }

    /**
     * Find nearest Police Station based on incident location.
     */
    public function findNearestPoliceStation(float $lat, float $lng): ?PoliceStation
    {
        $driver = config('database.default');

        if ($driver === 'pgsql') {
            return PoliceStation::query()
                ->select('*')
                ->selectRaw(
                    'ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters',
                    [$lng, $lat]
                )
                ->where('status', 'ACTIVE')
                ->orderBy('distance_meters', 'asc')
                ->first();
        }

        $stations = PoliceStation::query()
            ->where('status', 'ACTIVE')
            ->get();

        if ($stations->isEmpty()) {
            return null;
        }

        $stations->each(function ($station) use ($lat, $lng) {
            $station->distance_meters = $this->haversineDistance($lat, $lng, (float)$station->latitude, (float)$station->longitude);
        });

        return $stations->sortBy('distance_meters')->first();
    }
}
