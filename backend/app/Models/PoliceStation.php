<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PoliceStation extends Model
{
    use HasFactory;

    protected $fillable = [
        'station_name',
        'station_code',
        'address',
        'latitude',
        'longitude',
        'contact_number',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function patrolOfficers(): HasMany
    {
        return $this->hasMany(PatrolOfficer::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'assigned_station_id');
    }
}
