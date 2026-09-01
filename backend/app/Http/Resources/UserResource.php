<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $station = $this->policeStation;

        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'name' => $this->full_name,
            'email' => $this->email,
            'mobile_number' => $this->mobile_number,
            'role' => $this->role,
            'status' => $this->status,
            'police_station_id' => $this->police_station_id,
            'station_id' => $this->police_station_id,
            'station' => $station ? [
                'id' => $station->id,
                'station_code' => $station->station_code,
                'station_name' => $station->station_name,
                'name' => $station->station_name,
                'address' => $station->address,
                'contact_number' => $station->contact_number,
                'latitude' => (float) $station->latitude,
                'longitude' => (float) $station->longitude,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
