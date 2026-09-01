<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Http\Resources\IncidentResource;
use App\Services\DispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IncidentController extends Controller
{
    protected DispatchService $dispatchService;

    public function __construct(DispatchService $dispatchService)
    {
        $this->dispatchService = $dispatchService;
    }

    /**
     * Create emergency incident and invoke GIS Dispatch.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'emergency_type' => 'required|string|in:CRIME_POLICE,MEDICAL,FIRE_RESCUE',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'location_accuracy' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:2000',
            'photo_url' => 'nullable|string',
            'video_url' => 'nullable|string',
            'photo' => 'nullable',
            'video' => 'nullable',
        ]);

        $citizen = $request->user();

        // Process photo evidence file upload if present
        $photoUrl = $request->input('photo_url');
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('evidence/photos', 'public');
            $photoUrl = asset('storage/' . $path);
        }

        // Process video evidence file upload if present
        $videoUrl = $request->input('video_url');
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('evidence/videos', 'public');
            $videoUrl = asset('storage/' . $path);
        }

        // Enforce evidence requirement: At least ONE photo OR video must be present
        if (empty($photoUrl) && empty($videoUrl)) {
            return response()->json([
                'success' => false,
                'message' => 'EVIDENCE REQUIRED: Please capture at least one photo or video before submitting your emergency report.',
                'code' => 'EVIDENCE_REQUIRED',
            ], 422);
        }

        // 1. Duplicate report protection check (within 2 minutes)
        $recentIncident = Incident::where('citizen_id', $citizen->id)
            ->where('created_at', '>=', now()->subMinutes(2))
            ->latest()
            ->first();

        $flagged = false;
        $reviewNote = null;

        if ($recentIncident) {
            $flagged = true;
            $reviewNote = "Duplicate warning: Authenticated citizen submitted multiple emergency alerts within 2 minutes.";
        }

        // 2. Generate unique server reference number & create incident
        $refNumber = Incident::generateReferenceNumber();

        $incident = Incident::create([
            'reference_number' => $refNumber,
            'citizen_id' => $citizen->id,
            'emergency_type' => $validated['emergency_type'],
            'description' => $validated['description'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'location_accuracy' => $validated['location_accuracy'] ?? null,
            'photo_url' => $photoUrl,
            'video_url' => $videoUrl,
            'reported_at' => now(),
            'status' => Incident::STATUS_NEW,
            'flagged_for_review' => $flagged,
            'review_note' => $reviewNote,
        ]);

        // 3. Server-authoritative GIS dispatch
        $dispatchResult = $this->dispatchService->dispatch($incident);

        $incident->load(['citizen', 'patrolOfficer.user', 'policeStation', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'message' => 'Emergency report created successfully.',
            'data' => new IncidentResource($incident),
            'dispatch_result' => $dispatchResult,
        ], 201);
    }

    /**
     * Get specific incident details.
     */
    public function show(Incident $incident)
    {
        $incident->load(['citizen', 'assignedPatrol.user', 'assignedStation', 'statusHistory']);

        return response()->json([
            'success' => true,
            'data' => new IncidentResource($incident),
        ]);
    }
}
