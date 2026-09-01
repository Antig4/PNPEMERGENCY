<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use App\Models\IncidentStatusHistory;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\PatrolOfficerResource;
use App\Http\Resources\PoliceStationResource;
use Illuminate\Http\Request;

class StationController extends Controller
{
    /**
     * Resolve the station ID for the authenticated user.
     * For STATION_USER: strictly derived from $user->police_station_id.
     * For ADMIN: uses user's station or optional query param or defaults to first station.
     */
    private function resolveStationId(Request $request): ?int
    {
        $user = $request->user();

        if ($user->isStationUser()) {
            return $user->police_station_id;
        }

        if ($user->isAdmin()) {
            if ($request->has('station_id')) {
                return (int) $request->input('station_id');
            }
            return $user->police_station_id ?? PoliceStation::first()?->id;
        }

        return null;
    }

    /**
     * Get Station Dashboard Summary & Statistics.
     */
    public function dashboard(Request $request)
    {
        $stationId = $this->resolveStationId($request);

        if (!$stationId) {
            return response()->json([
                'success' => false,
                'message' => 'No assigned police station found for your account.',
            ], 403);
        }

        $station = PoliceStation::find($stationId);

        if (!$station) {
            return response()->json([
                'success' => false,
                'message' => 'Police station record not found.',
            ], 404);
        }

        // Incident counts for this station only
        $baseQuery = Incident::where('assigned_station_id', $stationId);

        $activeIncidents = (clone $baseQuery)
            ->whereIn('status', ['NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE'])
            ->count();

        $newReports = (clone $baseQuery)
            ->whereIn('status', ['NEW', 'NOTIFIED'])
            ->count();

        $responding = (clone $baseQuery)
            ->where('status', 'RESPONDING')
            ->count();

        $onScene = (clone $baseQuery)
            ->where('status', 'ON_SCENE')
            ->count();

        $resolvedToday = (clone $baseQuery)
            ->where('status', 'RESOLVED')
            ->whereDate('resolved_at', now()->toDateString())
            ->count();

        $totalIncidents = (clone $baseQuery)->count();

        // Patrol officer counts for this station only
        $availablePatrols = PatrolOfficer::where('police_station_id', $stationId)
            ->where('availability_status', PatrolOfficer::STATUS_AVAILABLE)
            ->count();

        $totalPatrols = PatrolOfficer::where('police_station_id', $stationId)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'station' => new PoliceStationResource($station),
                'stats' => [
                    'active_incidents' => $activeIncidents,
                    'new_reports' => $newReports,
                    'responding' => $responding,
                    'on_scene' => $onScene,
                    'resolved_today' => $resolvedToday,
                    'total_incidents' => $totalIncidents,
                    'available_patrols' => $availablePatrols,
                    'total_patrols' => $totalPatrols,
                ],
            ],
        ]);
    }

    /**
     * Get incidents assigned to the authenticated user's station only.
     */
    public function incidents(Request $request)
    {
        $stationId = $this->resolveStationId($request);

        if (!$stationId) {
            return response()->json([
                'success' => false,
                'message' => 'No assigned police station found for your account.',
            ], 403);
        }

        $query = Incident::with([
            'citizen',
            'assignedPatrol.user',
            'assignedStation',
            'statusHistory.changedBy'
        ]);

        if ($request->user()->isStationUser()) {
            $query->where(function($q) use ($stationId) {
                $q->where('assigned_station_id', $stationId)
                  ->orWhereNull('assigned_station_id');
            });
        }

        // Optional status filter
        if ($request->has('status') && !empty($request->input('status'))) {
            $query->where('status', $request->input('status'));
        }

        $incidents = $query->orderBy('reported_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => IncidentResource::collection($incidents),
        ]);
    }

    /**
     * Get detailed info for a single incident assigned to this station.
     */
    public function incidentDetail(Request $request, $id)
    {
        $user = $request->user();
        $stationId = $this->resolveStationId($request);

        $incident = Incident::with([
            'citizen',
            'assignedPatrol.user',
            'assignedStation',
            'statusHistory.changedBy'
        ])->find($id);

        if (!$incident) {
            return response()->json([
                'success' => false,
                'message' => 'Incident record not found.',
            ], 404);
        }

        // Backend Authorization: Ensure station user can view assigned or unassigned station incidents
        if ($user->isStationUser() && $incident->assigned_station_id !== null && (int)$incident->assigned_station_id !== (int)$stationId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access: Incident belongs to another police station.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Get patrol officers belonging to the authenticated user's station only.
     */
    public function patrols(Request $request)
    {
        $stationId = $this->resolveStationId($request);

        if (!$stationId) {
            return response()->json([
                'success' => false,
                'message' => 'No assigned police station found for your account.',
            ], 403);
        }

        $patrols = PatrolOfficer::with(['user', 'policeStation', 'incidents' => function($q) {
            $q->whereIn('status', ['NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE']);
        }])
        ->where('police_station_id', $stationId)
        ->get();

        return response()->json([
            'success' => true,
            'data' => PatrolOfficerResource::collection($patrols),
        ]);
    }

    /**
     * Get station profile info for authenticated station user.
     */
    public function profile(Request $request)
    {
        $stationId = $this->resolveStationId($request);

        if (!$stationId) {
            return response()->json([
                'success' => false,
                'message' => 'No assigned police station found for your account.',
            ], 403);
        }

        $station = PoliceStation::find($stationId);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
                'station' => $station ? new PoliceStationResource($station) : null,
            ],
        ]);
    }
    /**
     * Dispatch an available patrol officer to an incident from the Station Dashboard.
     */
    public function dispatchPatrol(Request $request, $id)
    {
        $validated = $request->validate([
            'patrol_id' => 'required|integer|exists:patrol_officers,id',
        ]);

        $stationId = $this->resolveStationId($request);
        $incident = Incident::find($id);

        if (!$incident) {
            return response()->json(['success' => false, 'message' => 'Incident not found.'], 404);
        }

        if ($request->user()->isStationUser() && $incident->assigned_station_id !== null && (int)$incident->assigned_station_id !== (int)$stationId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access: Incident belongs to another police station.'], 403);
        }

        $patrol = PatrolOfficer::find($validated['patrol_id']);
        if (!$patrol) {
            return response()->json(['success' => false, 'message' => 'Selected patrol officer was not found.'], 404);
        }

        $oldStatus = $incident->status;
        $incident->assigned_patrol_id = $patrol->id;
        $incident->responder_type = 'PATROL';
        $incident->status = Incident::STATUS_NOTIFIED;
        $incident->save();

        $patrol->availability_status = PatrolOfficer::STATUS_RESPONDING;
        $patrol->save();

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => Incident::STATUS_NOTIFIED,
            'remarks' => "Station Officer dispatched Patrol Unit: {$patrol->badge_number} ({$patrol->patrol_unit_name}).",
            'created_at' => now(),
        ]);

        $incident->load(['citizen', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'message' => 'Patrol officer successfully dispatched.',
            'data' => new IncidentResource($incident),
        ]);
    }
}
