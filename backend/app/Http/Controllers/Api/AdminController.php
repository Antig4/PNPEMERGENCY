<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Incident;
use App\Models\PatrolOfficer;
use App\Models\PoliceStation;
use App\Models\IncidentStatusHistory;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\PatrolOfficerResource;
use App\Http\Resources\PoliceStationResource;
use App\Services\DispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    protected DispatchService $dispatchService;

    public function __construct(DispatchService $dispatchService)
    {
        $this->dispatchService = $dispatchService;
    }

    /**
     * Dashboard Summary Statistics
     */
    public function stats()
    {
        $totalIncidents = Incident::count();
        $activeIncidents = Incident::whereIn('status', [
            Incident::STATUS_NEW,
            Incident::STATUS_NOTIFIED,
            Incident::STATUS_ACCEPTED,
            Incident::STATUS_RESPONDING,
            Incident::STATUS_ON_SCENE,
        ])->count();

        $responding = Incident::where('status', Incident::STATUS_RESPONDING)->count();
        $onScene = Incident::where('status', Incident::STATUS_ON_SCENE)->count();
        $resolvedToday = Incident::where('status', Incident::STATUS_RESOLVED)
            ->whereDate('resolved_at', now()->today())
            ->count();

        $availablePatrols = PatrolOfficer::where('availability_status', PatrolOfficer::STATUS_AVAILABLE)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_incidents' => $totalIncidents,
                'active_incidents' => $activeIncidents,
                'responding' => $responding,
                'on_scene' => $onScene,
                'resolved_today' => $resolvedToday,
                'available_patrols' => $availablePatrols,
            ],
        ]);
    }

    /**
     * List all incidents with flexible filters (status, emergency_type, station_id, date range).
     */
    public function incidents(Request $request)
    {
        $query = Incident::with(['citizen', 'patrolOfficer.user', 'policeStation', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->filled('emergency_type') && $request->emergency_type !== 'ALL') {
            $query->where('emergency_type', $request->emergency_type);
        }

        if ($request->filled('station_id') && $request->station_id !== 'ALL') {
            $query->where('assigned_station_id', $request->station_id);
        }

        if ($request->filled('flagged_only') && $request->boolean('flagged_only')) {
            $query->where('flagged_for_review', true);
        }

        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', now()->today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', now()->yesterday());
                    break;
                case 'this_week':
                    $query->where('created_at', '>=', now()->startOfWeek());
                    break;
            }
        }

        $incidents = $query->orderBy('created_at', 'desc')->paginate(20);

        return IncidentResource::collection($incidents)->additional([
            'success' => true,
            'message' => 'Admin incident feed retrieved.',
        ]);
    }

    /**
     * Get single incident detail.
     */
    public function incidentDetail(Incident $incident)
    {
        $incident->load(['citizen', 'assignedPatrol.user', 'assignedStation', 'statusHistory.changedBy']);

        return response()->json([
            'success' => true,
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * List all patrol officers with current status & live location.
     */
    public function patrols()
    {
        $patrols = PatrolOfficer::with(['user', 'policeStation'])->get();

        return response()->json([
            'success' => true,
            'data' => PatrolOfficerResource::collection($patrols),
        ]);
    }

    /**
     * List all police stations with officer and incident counts.
     */
    public function stations()
    {
        $stations = PoliceStation::withCount([
            'patrolOfficers as total_patrols',
            'patrolOfficers as available_patrols' => function ($q) {
                $q->where('availability_status', PatrolOfficer::STATUS_AVAILABLE);
            },
            'incidents as active_incidents' => function ($q) {
                $q->whereIn('status', [
                    Incident::STATUS_NEW,
                    Incident::STATUS_NOTIFIED,
                    Incident::STATUS_ACCEPTED,
                    Incident::STATUS_RESPONDING,
                    Incident::STATUS_ON_SCENE,
                ]);
            },
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $stations->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'station_name' => $s->station_name,
                    'station_code' => $s->station_code,
                    'address' => $s->address,
                    'contact_number' => $s->contact_number,
                    'latitude' => (float) $s->latitude,
                    'longitude' => (float) $s->longitude,
                    'total_patrols' => $s->total_patrols,
                    'available_patrols' => $s->available_patrols,
                    'active_incidents' => $s->active_incidents,
                ];
            }),
        ]);
    }

    /**
     * Admin controlled incident reassignment.
     */
    public function reassign(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'patrol_officer_id' => 'required|exists:patrol_officers,id',
            'reason' => 'required|string|max:500',
        ]);

        $newPatrol = PatrolOfficer::findOrFail($validated['patrol_officer_id']);

        // Release old patrol if assigned
        if ($incident->assigned_patrol_id) {
            $oldPatrol = PatrolOfficer::find($incident->assigned_patrol_id);
            if ($oldPatrol && $oldPatrol->availability_status !== PatrolOfficer::STATUS_AVAILABLE) {
                $oldPatrol->availability_status = PatrolOfficer::STATUS_AVAILABLE;
                $oldPatrol->save();
            }
        }

        $oldStatus = $incident->status;
        $incident->assigned_patrol_id = $newPatrol->id;
        $incident->assigned_station_id = $newPatrol->police_station_id;
        $incident->status = Incident::STATUS_NOTIFIED;
        $incident->save();

        // Update new patrol officer status
        $newPatrol->availability_status = PatrolOfficer::STATUS_RESPONDING;
        $newPatrol->save();

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => Incident::STATUS_NOTIFIED,
            'remarks' => "Reassigned by Admin to Patrol {$newPatrol->badge_number}. Reason: {$validated['reason']}",
            'created_at' => now(),
        ]);

        $incident->load(['citizen', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'message' => "Incident reassigned to Patrol Officer {$newPatrol->badge_number}.",
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Admin controlled incident cancellation.
     */
    public function cancel(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $oldStatus = $incident->status;
        $incident->status = Incident::STATUS_CANCELLED;
        $incident->cancellation_reason = $validated['cancellation_reason'];
        $incident->save();

        // Release patrol officer if assigned
        if ($incident->assigned_patrol_id) {
            $patrol = PatrolOfficer::find($incident->assigned_patrol_id);
            if ($patrol) {
                $patrol->availability_status = PatrolOfficer::STATUS_AVAILABLE;
                $patrol->save();
            }
        }

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => Incident::STATUS_CANCELLED,
            'remarks' => "Cancelled by Admin. Reason: {$validated['cancellation_reason']}",
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Incident cancelled successfully.',
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Mark incident as verified / review cleared.
     */
    public function verify(Request $request, Incident $incident)
    {
        $incident->flagged_for_review = false;
        $incident->review_note = "Verified and cleared by Admin on " . now()->format('M d, Y h:i A');
        $incident->save();

        return response()->json([
            'success' => true,
            'message' => 'Incident marked as verified and cleared.',
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Admin request assistance from neighboring station/unit.
     */
    public function requestAssistance(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'assisting_station_id' => 'required|exists:police_stations,id',
            'notes' => 'required|string|max:500',
        ]);

        $assistingStation = PoliceStation::findOrFail($validated['assisting_station_id']);

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $incident->status,
            'new_status' => $incident->status,
            'remarks' => "Assistance requested from Station '{$assistingStation->station_name}'. Notes: {$validated['notes']}",
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Assistance request logged and dispatched to {$assistingStation->station_name}.",
        ]);
    }

    /**
     * Permanently delete a RESOLVED or CANCELLED incident record.
     * Only allows deletion of finished incidents to protect active dispatch data.
     */
    public function destroy(Request $request, Incident $incident)
    {
        if (!in_array($incident->status, [Incident::STATUS_RESOLVED, Incident::STATUS_CANCELLED])) {
            return response()->json([
                'success' => false,
                'message' => 'Only RESOLVED or CANCELLED incidents can be deleted. Active incidents cannot be removed.',
            ], 422);
        }

        $refNumber = $incident->reference_number;

        // Release assigned patrol officer back to AVAILABLE if still linked
        if ($incident->assigned_patrol_id) {
            $patrol = PatrolOfficer::find($incident->assigned_patrol_id);
            if ($patrol && $patrol->availability_status !== PatrolOfficer::STATUS_AVAILABLE) {
                $patrol->availability_status = PatrolOfficer::STATUS_AVAILABLE;
                $patrol->save();
            }
        }

        // Hard delete the incident and all related history (cascade)
        $incident->statusHistory()->delete();
        $incident->delete();

        return response()->json([
            'success' => true,
            'message' => "Incident {$refNumber} permanently deleted from records.",
        ]);
    }
}
