<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name',
        'email',
        'mobile_number',
        'password',
        'role',
        'status',
        'police_station_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Role constants
    const ROLE_CITIZEN = 'CITIZEN';
    const ROLE_PATROL_OFFICER = 'PATROL_OFFICER';
    const ROLE_STATION_USER = 'STATION_USER';
    const ROLE_ADMIN = 'ADMIN';

    // Status constants
    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_INACTIVE = 'INACTIVE';
    const STATUS_SUSPENDED = 'SUSPENDED';

    public function isCitizen(): bool
    {
        return $this->role === self::ROLE_CITIZEN;
    }

    public function isPatrolOfficer(): bool
    {
        return $this->role === self::ROLE_PATROL_OFFICER;
    }

    public function isStationUser(): bool
    {
        return $this->role === self::ROLE_STATION_USER;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    // Relationships
    public function policeStation()
    {
        return $this->belongsTo(PoliceStation::class, 'police_station_id');
    }

    public function patrolOfficer(): HasOne
    {
        return $this->hasOne(PatrolOfficer::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'citizen_id');
    }

    public function statusHistoryEntries(): HasMany
    {
        return $this->hasMany(IncidentStatusHistory::class, 'changed_by_user_id');
    }
}
