<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\PatrolOfficer;
use App\Models\PatrolLocationHistory;
use App\Models\IncidentStatusHistory;
use App\Http\Resources\PatrolOfficerResource;
use App\Http\Resources\IncidentResource;
use App\Services\DispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatrolController extends Controller
{
    protected DispatchService $dispatchService;

    public function __construct(DispatchService $dispatchService)
    {
        $this->dispatchService = $dispatchService;
    }

    /**
     * Get patrol officer dashboard statistics (Today's Total, Resolved, Active).
     */
    public function stats(Request $request)
    {
        $officer = $request->user()?->patrolOfficer;
        if (!$officer) {
            $officer = PatrolOfficer::first();
        }

        $officerId = $officer?->id;
        $query = Incident::query();
        if ($officerId) {
            $query->where('assigned_patrol_id', $officerId);
        }

        $todayTotal = (clone $query)->count();
        $resolved = (clone $query)->where('status', Incident::STATUS_RESOLVED)->count();
        $active = (clone $query)->whereIn('status', [Incident::STATUS_ACCEPTED, Incident::STATUS_RESPONDING, Incident::STATUS_ON_SCENE])->count();

        // If officer has 0 specific assigned incidents, provide overall platform counts for demo visibility
        if ($todayTotal === 0) {
            $todayTotal = Incident::count();
            $resolved = Incident::where('status', Incident::STATUS_RESOLVED)->count();
            $active = Incident::whereIn('status', [Incident::STATUS_ACCEPTED, Incident::STATUS_RESPONDING, Incident::STATUS_ON_SCENE])->count();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'today_total' => $todayTotal,
                'resolved' => $resolved,
                'active' => $active,
            ]
        ]);
    }

    /**
     * Get patrol officer profile.
     */
    public function profile(Request $request)
    {
        $officer = $request->user()->patrolOfficer;
        if (!$officer) {
            return response()->json(['success' => false, 'message' => 'Patrol officer profile not found.'], 404);
        }

        $officer->load('policeStation', 'user');
        return response()->json(['success' => true, 'data' => new PatrolOfficerResource($officer)]);
    }

    /**
     * Update officer availability status (AVAILABLE, OFF_DUTY, OFFLINE).
     */
    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:AVAILABLE,OFF_DUTY,OFFLINE',
        ]);

        $officer = $request->user()->patrolOfficer;
        if (!$officer) {
            return response()->json(['success' => false, 'message' => 'Patrol officer profile not found.'], 404);
        }

        // Cannot toggle to OFF_DUTY while handling an active incident
        if (in_array($validated['status'], ['OFF_DUTY', 'OFFLINE']) && $officer->activeIncident()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot go off duty while assigned to an active emergency incident.',
            ], 422);
        }

        $officer->availability_status = $validated['status'];
        $officer->save();

        return response()->json([
            'success' => true,
            'message' => "Patrol officer status updated to {$validated['status']}.",
            'data' => new PatrolOfficerResource($officer),
        ]);
    }

    /**
     * Get currently assigned active incident.
     */
    public function activeIncident(Request $request)
    {
        $officer = $request->user()->patrolOfficer;
        if (!$officer) {
            return response()->json(['success' => false, 'message' => 'Patrol officer profile not found.'], 404);
        }

        $activeIncident = $officer->activeIncident();
        if (!$activeIncident) {
            // Check for pending NOTIFIED assignment
            $activeIncident = Incident::with(['citizen', 'patrolOfficer.user', 'policeStation', 'assignedPatrol.user', 'assignedStation', 'statusHistory'])
                ->where('assigned_patrol_id', $officer->id)
                ->where('status', Incident::STATUS_NOTIFIED)
                ->latest()
                ->first();
        } else {
            $activeIncident->load(['citizen', 'patrolOfficer.user', 'policeStation', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);
        }

        return response()->json([
            'success' => true,
            'data' => $activeIncident ? new IncidentResource($activeIncident) : null,
        ]);
    }

    /**
     * Get history of incidents handled by officer.
     */
    public function incidents(Request $request)
    {
        $officer = $request->user()->patrolOfficer;
        if (!$officer) {
            return response()->json(['success' => false, 'message' => 'Patrol officer profile not found.'], 404);
        }

        $incidents = Incident::with(['citizen', 'assignedStation', 'statusHistory'])
            ->where('assigned_patrol_id', $officer->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return IncidentResource::collection($incidents)->additional([
            'success' => true,
            'message' => 'Patrol officer incident history retrieved.',
        ]);
    }

    /**
     * Accept assigned incident dispatch.
     */
    public function accept(Incident $incident, Request $request)
    {
        $officer = $request->user()?->patrolOfficer;
        if (!$officer) {
            $officer = $incident->assignedPatrol ?: PatrolOfficer::find($incident->assigned_patrol_id) ?: PatrolOfficer::first();
        }
        if (!$officer) {
            return response()->json(['success' => false, 'message' => 'Patrol officer profile not found.'], 404);
        }

        return DB::transaction(function () use ($incident, $officer, $request) {
            $lockedIncident = Incident::where('id', $incident->id)->lockForUpdate()->first();

            if (!$lockedIncident) {
                return response()->json(['success' => false, 'message' => 'Incident not found.'], 404);
            }

            // If not assigned yet, assign to current officer
            if (!$lockedIncident->assigned_patrol_id) {
                $lockedIncident->assigned_patrol_id = $officer->id;
            }

            // Prevent race conditions if another unit accepted first
            if (
                $lockedIncident->status === Incident::STATUS_ACCEPTED ||
                ($lockedIncident->assigned_patrol_id && $lockedIncident->assigned_patrol_id !== $officer->id && in_array($lockedIncident->status, [Incident::STATUS_ACCEPTED, Incident::STATUS_RESPONDING, Incident::STATUS_ON_SCENE]))
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'This incident has already been accepted by another patrol unit.',
                ], 409);
            }

            if ($lockedIncident->assigned_patrol_id !== $officer->id) {
                $lockedIncident->assigned_patrol_id = $officer->id;
            }

            if (!$lockedIncident->canTransitionTo(Incident::STATUS_ACCEPTED)) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot accept incident in state '{$lockedIncident->status}'.",
                ], 422);
            }

            $oldStatus = $lockedIncident->status;
            $lockedIncident->status = Incident::STATUS_ACCEPTED;
            $lockedIncident->accepted_at = now();
            $lockedIncident->responding_at = now();
            $lockedIncident->save();

            $officer->availability_status = PatrolOfficer::STATUS_RESPONDING;
            $officer->save();

            IncidentStatusHistory::create([
                'incident_id' => $lockedIncident->id,
                'changed_by_user_id' => $request->user()->id,
                'old_status' => $oldStatus,
                'new_status' => Incident::STATUS_ACCEPTED,
                'remarks' => "Dispatch accepted by Patrol Officer {$officer->badge_number}. Unit responding.",
                'created_at' => now(),
            ]);

            $lockedIncident->load(['citizen', 'patrolOfficer.user', 'policeStation', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

            return response()->json([
                'success' => true,
                'message' => 'Dispatch accepted successfully. Unit status set to RESPONDING.',
                'data' => new IncidentResource($lockedIncident),
            ]);
        });
    }

    /**
     * Decline incident assignment with mandatory reason.
     */
    public function decline(Incident $incident, Request $request)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $officer = $request->user()->patrolOfficer;

        if ($incident->assigned_patrol_id !== $officer->id) {
            return response()->json(['success' => false, 'message' => 'Incident is not assigned to your unit.'], 403);
        }

        $result = $this->dispatchService->redispatchAfterDecline($incident, $officer->id, $validated['reason']);

        return response()->json([
            'success' => true,
            'message' => 'Incident declined. Re-dispatch process initiated.',
            'data' => $result,
        ]);
    }

    /**
     * Update incident status (RESPONDING, ON_SCENE).
     */
    public function updateIncidentStatus(Incident $incident, Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:RESPONDING,ON_SCENE',
        ]);

        $officer = $request->user()?->patrolOfficer;
        if (!$officer) {
            $officer = $incident->assignedPatrol ?: PatrolOfficer::find($incident->assigned_patrol_id) ?: PatrolOfficer::first();
        }
        if ($officer && $incident->assigned_patrol_id && $incident->assigned_patrol_id !== $officer->id) {
            $assignedOfficer = PatrolOfficer::find($incident->assigned_patrol_id);
            if ($assignedOfficer) {
                $officer = $assignedOfficer;
            }
        }

        $newStatus = $validated['status'];
        if (!$incident->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Invalid status transition from '{$incident->status}' to '{$newStatus}'.",
            ], 422);
        }

        $oldStatus = $incident->status;
        $incident->status = $newStatus;

        if ($newStatus === Incident::STATUS_RESPONDING) {
            $incident->responding_at = now();
            if ($officer) {
                $officer->availability_status = PatrolOfficer::STATUS_RESPONDING;
            }
        } elseif ($newStatus === Incident::STATUS_ON_SCENE) {
            $incident->on_scene_at = now();
            if ($officer) {
                $officer->availability_status = PatrolOfficer::STATUS_ON_SCENE;
                if ($incident->latitude && $incident->longitude) {
                    $officer->current_latitude = $incident->latitude;
                    $officer->current_longitude = $incident->longitude;
                    $officer->location_updated_at = now();
                }
            }
        }

        $incident->save();
        if ($officer) {
            $officer->save();
        }

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'remarks' => "Status updated to {$newStatus}" . ($officer ? " by Patrol Officer {$officer->badge_number}" : "") . ".",
            'created_at' => now(),
        ]);

        $incident->load(['citizen', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'message' => "Incident status updated to {$newStatus}.",
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Mark incident as RESOLVED.
     */
    public function resolve(Incident $incident, Request $request)
    {
        $outcomeMap = [
            'Resolved' => 'RESOLVED',
            'RESOLVED' => 'RESOLVED',
            'Referred to another unit' => 'REFERRED',
            'REFERRED' => 'REFERRED',
            'No assistance required' => 'NO_ASSISTANCE_REQUIRED',
            'NO_ASSISTANCE_REQUIRED' => 'NO_ASSISTANCE_REQUIRED',
            'Unable to locate' => 'UNABLE_TO_LOCATE',
            'UNABLE_TO_LOCATE' => 'UNABLE_TO_LOCATE',
            'Other' => 'OTHER',
            'OTHER' => 'OTHER',
        ];

        $rawOutcome = $request->input('resolution_outcome');
        if (isset($outcomeMap[$rawOutcome])) {
            $request->merge(['resolution_outcome' => $outcomeMap[$rawOutcome]]);
        }

        $validated = $request->validate([
            'resolution_summary' => 'nullable|string|max:2000',
            'resolution_outcome' => 'nullable|string|in:RESOLVED,REFERRED,NO_ASSISTANCE_REQUIRED,UNABLE_TO_LOCATE,OTHER',
        ]);

        $officer = $request->user()?->patrolOfficer;
        if (!$officer) {
            $officer = $incident->assignedPatrol ?: PatrolOfficer::find($incident->assigned_patrol_id) ?: PatrolOfficer::first();
        }
        if ($officer && $incident->assigned_patrol_id && $incident->assigned_patrol_id !== $officer->id) {
            $assignedOfficer = PatrolOfficer::find($incident->assigned_patrol_id);
            if ($assignedOfficer) {
                $officer = $assignedOfficer;
            }
        }

        if (!$incident->canTransitionTo(Incident::STATUS_RESOLVED)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot resolve incident from status '{$incident->status}'.",
            ], 422);
        }

        $summaryText = !empty($validated['resolution_summary']) ? $validated['resolution_summary'] : 'Incident resolved on scene by patrol officer.';
        $outcomeText = !empty($validated['resolution_outcome']) ? $validated['resolution_outcome'] : 'RESOLVED';

        $oldStatus = $incident->status;
        $incident->status = Incident::STATUS_RESOLVED;
        $incident->resolved_at = now();
        $incident->resolution_summary = $summaryText;
        $incident->resolution_outcome = $outcomeText;
        $incident->save();

        // Restore officer availability status to AVAILABLE
        if ($officer) {
            $officer->availability_status = PatrolOfficer::STATUS_AVAILABLE;
            $officer->save();
        }

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'changed_by_user_id' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => Incident::STATUS_RESOLVED,
            'remarks' => "Incident RESOLVED. Outcome: {$validated['resolution_outcome']}. Summary: {$validated['resolution_summary']}",
            'created_at' => now(),
        ]);

        $incident->load(['citizen', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'message' => 'Incident marked as RESOLVED. Officer availability restored to AVAILABLE.',
            'data' => new IncidentResource($incident),
        ]);
    }

    /**
     * Broadcast live patrol officer GPS location.
     */
    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
        ]);

        $officer = $request->user()->patrolOfficer;

        // Update officer's current position
        if ($officer->availability_status === PatrolOfficer::STATUS_ON_SCENE) {
            $activeInc = $officer->activeIncident();
            if ($activeInc && $activeInc->latitude && $activeInc->longitude) {
                $officer->current_latitude = $activeInc->latitude;
                $officer->current_longitude = $activeInc->longitude;
            } else {
                $officer->current_latitude = $validated['latitude'];
                $officer->current_longitude = $validated['longitude'];
            }
        } else {
            $officer->current_latitude = $validated['latitude'];
            $officer->current_longitude = $validated['longitude'];
        }
        $officer->location_accuracy = $validated['accuracy'] ?? null;
        $officer->location_updated_at = now();
        $officer->save();

        // Save location history only if officer is RESPONDING or ON_SCENE
        if (in_array($officer->availability_status, [PatrolOfficer::STATUS_RESPONDING, PatrolOfficer::STATUS_ON_SCENE])) {
            $activeInc = $officer->activeIncident();
            PatrolLocationHistory::create([
                'patrol_officer_id' => $officer->id,
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'] ?? null,
                'patrol_status' => $officer->availability_status,
                'incident_id' => $activeInc?->id,
                'recorded_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patrol location updated.',
            'data' => [
                'latitude' => (float) $officer->current_latitude,
                'longitude' => (float) $officer->current_longitude,
                'status' => $officer->availability_status,
                'updated_at' => $officer->location_updated_at?->toIso8601String(),
            ],
        ]);
    }
}
