<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_number' => $this->reference_number,
            'citizen_id' => $this->citizen_id,
            'emergency_type' => $this->emergency_type,
            'description' => $this->description,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'location_accuracy' => $this->location_accuracy !== null ? (float) $this->location_accuracy : null,
            'reported_at' => $this->reported_at?->toIso8601String(),
            'status' => $this->status,
            'assigned_patrol_id' => $this->assigned_patrol_id,
            'assigned_station_id' => $this->assigned_station_id,
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'responding_at' => $this->responding_at?->toIso8601String(),
            'on_scene_at' => $this->on_scene_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'resolution_summary' => $this->resolution_summary,
            'resolution_outcome' => $this->resolution_outcome,
            'cancellation_reason' => $this->cancellation_reason,
            'flagged_for_review' => (bool) $this->flagged_for_review,
            'responder_type' => $this->responder_type,
            'decline_reason' => $this->decline_reason,
            'photo_url' => $this->photo_url,
            'video_url' => $this->video_url,
            'responder_name' => $this->assigned_patrol_id && $this->relationLoaded('assignedPatrol') && $this->assignedPatrol
                ? ($this->assignedPatrol->user?->full_name ?? $this->assignedPatrol->patrol_unit_name)
                : ($this->assigned_station_id && $this->relationLoaded('assignedStation') && $this->assignedStation
                    ? $this->assignedStation->station_name
                    : null),
            'responder_contact_number' => $this->assigned_patrol_id && $this->relationLoaded('assignedPatrol') && $this->assignedPatrol
                ? ($this->assignedPatrol->user?->mobile_number ?? $this->assignedPatrol->contact_number ?? '09181112222')
                : ($this->assigned_station_id && $this->relationLoaded('assignedStation') && $this->assignedStation
                    ? $this->assignedStation->contact_number
                    : null),
            'citizen' => new UserResource($this->whenLoaded('citizen')),
            'assigned_patrol' => $this->when(
                $this->relationLoaded('patrolOfficer') || $this->relationLoaded('assignedPatrol'),
                fn() => new PatrolOfficerResource(
                    $this->relationLoaded('patrolOfficer') ? $this->patrolOfficer : $this->assignedPatrol
                )
            ),
            'assigned_station' => $this->when(
                $this->relationLoaded('policeStation') || $this->relationLoaded('assignedStation'),
                fn() => new PoliceStationResource(
                    $this->relationLoaded('policeStation') ? $this->policeStation : $this->assignedStation
                )
            ),
            'status_history' => IncidentStatusHistoryResource::collection($this->whenLoaded('statusHistory')),
        ];
    }
}
