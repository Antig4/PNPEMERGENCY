<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrolLocationHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'patrol_officer_id',
        'latitude',
        'longitude',
        'accuracy',
        'patrol_status',
        'incident_id',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'accuracy' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function patrolOfficer(): BelongsTo
    {
        return $this->belongsTo(PatrolOfficer::class);
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }
}
