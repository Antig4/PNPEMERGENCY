<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatrolOfficer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'police_station_id',
        'badge_number',
        'patrol_unit_name',
        'availability_status',
        'current_latitude',
        'current_longitude',
        'location_accuracy',
        'location_updated_at',
    ];

    protected $casts = [
        'current_latitude' => 'float',
        'current_longitude' => 'float',
        'location_accuracy' => 'float',
        'location_updated_at' => 'datetime',
    ];

    // Availability status constants
    const STATUS_AVAILABLE = 'AVAILABLE';
    const STATUS_RESPONDING = 'RESPONDING';
    const STATUS_ON_SCENE = 'ON_SCENE';
    const STATUS_OFF_DUTY = 'OFF_DUTY';
    const STATUS_OFFLINE = 'OFFLINE';

    public function isAvailable(): bool
    {
        return $this->availability_status === self::STATUS_AVAILABLE;
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function policeStation(): BelongsTo
    {
        return $this->belongsTo(PoliceStation::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'assigned_patrol_id');
    }

    public function locationHistory(): HasMany
    {
        return $this->hasMany(PatrolLocationHistory::class);
    }

    public function activeIncident(): ?Incident
    {
        return $this->incidents()
            ->whereIn('status', ['ACCEPTED', 'RESPONDING', 'ON_SCENE'])
            ->latest()
            ->first();
    }
}
