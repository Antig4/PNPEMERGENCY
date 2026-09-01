<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentStatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'old_status' => $this->old_status,
            'new_status' => $this->new_status,
            'remarks' => $this->remarks,
            'changed_by_user_id' => $this->changed_by_user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
