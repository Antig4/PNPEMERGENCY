<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'incident_id',
        'changed_by_user_id',
        'old_status',
        'new_status',
        'remarks',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
