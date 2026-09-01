<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatrolOfficerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'badge_number' => $this->badge_number,
            'patrol_unit_name' => $this->patrol_unit_name,
            'availability_status' => $this->availability_status,
            'current_latitude' => $this->current_latitude !== null ? (float) $this->current_latitude : null,
            'current_longitude' => $this->current_longitude !== null ? (float) $this->current_longitude : null,
            'location_accuracy' => $this->location_accuracy !== null ? (float) $this->location_accuracy : null,
            'location_updated_at' => $this->location_updated_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
            'police_station' => new PoliceStationResource($this->whenLoaded('policeStation')),
        ];
    }
}
