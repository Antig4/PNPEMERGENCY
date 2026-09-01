<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Http\Request;

class CitizenController extends Controller
{
    /**
     * Get authenticated citizen profile.
     */
    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    /**
     * Get incident history reported by this citizen.
     */
    public function incidents(Request $request)
    {
        $incidents = Incident::with(['assignedPatrol.user', 'assignedStation', 'statusHistory'])
            ->where('citizen_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return IncidentResource::collection($incidents)->additional([
            'success' => true,
            'message' => 'Citizen incident history retrieved.',
        ]);
    }

    /**
     * Get citizen's current active incident (if any).
     */
    public function activeIncident(Request $request)
    {
        $activeIncident = Incident::with(['assignedPatrol.user', 'assignedStation', 'statusHistory'])
            ->where('citizen_id', $request->user()->id)
            ->whereIn('status', ['NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE'])
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'data' => $activeIncident ? new IncidentResource($activeIncident) : null,
        ]);
    }
}
