<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_number',
        'citizen_id',
        'emergency_type',
        'description',
        'latitude',
        'longitude',
        'location_accuracy',
        'reported_at',
        'status',
        'assigned_patrol_id',
        'assigned_station_id',
        'accepted_at',
        'responding_at',
        'on_scene_at',
        'resolved_at',
        'resolution_summary',
        'resolution_outcome',
        'flagged_for_review',
        'review_note',
        'cancellation_reason',
        'responder_type',
        'decline_reason',
        'photo_url',
        'video_url',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'location_accuracy' => 'float',
        'reported_at' => 'datetime',
        'accepted_at' => 'datetime',
        'responding_at' => 'datetime',
        'on_scene_at' => 'datetime',
        'resolved_at' => 'datetime',
        'flagged_for_review' => 'boolean',
    ];

    // Status constants
    const STATUS_NEW = 'NEW';
    const STATUS_NOTIFIED = 'NOTIFIED';
    const STATUS_ACCEPTED = 'ACCEPTED';
    const STATUS_RESPONDING = 'RESPONDING';
    const STATUS_ON_SCENE = 'ON_SCENE';
    const STATUS_RESOLVED = 'RESOLVED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_DECLINED = 'DECLINED';
    const STATUS_UNVERIFIED = 'UNVERIFIED';

    // Emergency type constants
    const TYPE_CRIME = 'CRIME_POLICE';
    const TYPE_MEDICAL = 'MEDICAL';
    const TYPE_FIRE = 'FIRE_RESCUE';

    /**
     * Valid status transition map — server-authoritative
     */
    public static array $allowedTransitions = [
        'NEW'        => ['NOTIFIED', 'ACCEPTED', 'RESPONDING', 'CANCELLED', 'UNVERIFIED'],
        'NOTIFIED'   => ['ACCEPTED', 'RESPONDING', 'DECLINED', 'CANCELLED'],
        'ACCEPTED'   => ['RESPONDING', 'ON_SCENE', 'RESOLVED', 'CANCELLED'],
        'RESPONDING' => ['ON_SCENE', 'RESOLVED', 'CANCELLED'],
        'ON_SCENE'   => ['RESOLVED', 'CANCELLED'],
        'RESOLVED'   => [],
        'CANCELLED'  => [],
        'DECLINED'   => ['NEW', 'NOTIFIED', 'RESPONDING'],
        'UNVERIFIED' => ['NEW', 'CANCELLED'],
    ];

    public function canTransitionTo(string $newStatus): bool
    {
        return in_array($newStatus, self::$allowedTransitions[$this->status] ?? []);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE']);
    }

    // Relationships
    public function citizen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function patrolOfficer(): BelongsTo
    {
        return $this->belongsTo(PatrolOfficer::class, 'assigned_patrol_id');
    }

    public function assignedPatrol(): BelongsTo
    {
        return $this->belongsTo(PatrolOfficer::class, 'assigned_patrol_id');
    }

    public function policeStation(): BelongsTo
    {
        return $this->belongsTo(PoliceStation::class, 'assigned_station_id');
    }

    public function assignedStation(): BelongsTo
    {
        return $this->belongsTo(PoliceStation::class, 'assigned_station_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(IncidentStatusHistory::class)->orderBy('created_at');
    }

    /**
     * Auto-generate reference number: INC-000001
     */
    public static function generateReferenceNumber(): string
    {
        $latest = self::max('id') ?? 0;
        return 'INC-' . str_pad($latest + 1, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Retrieve the model for a bound value (accepts both primary key integer 'id' and string 'reference_number').
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('id', $value)
            ->orWhere('reference_number', $value)
            ->first();
    }
}
