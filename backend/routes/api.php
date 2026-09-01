<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\PatrolController;

/*
|--------------------------------------------------------------------------
| PNP EmergencyLink Central REST API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated Routes (Requires Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {

    // Common Auth Info
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // ----------------------------------------------------
    // CITIZEN MOBILE APP ENDPOINTS
    // ----------------------------------------------------
    Route::middleware('role:CITIZEN')->group(function () {
        Route::get('/citizen/profile', [CitizenController::class, 'profile']);
        Route::post('/incidents', [IncidentController::class, 'store']);
        Route::get('/citizen/incidents', [CitizenController::class, 'incidents']);
        Route::get('/citizen/active-incident', [CitizenController::class, 'activeIncident']);
    });

    // Common Incident Detail endpoint for all roles
    Route::get('/incidents/{incident}', [IncidentController::class, 'show']);

    // ----------------------------------------------------
    // PATROL OFFICER MOBILE APP ENDPOINTS
    // ----------------------------------------------------
    Route::middleware('role:PATROL_OFFICER,ADMIN,STATION_USER,CITIZEN')->group(function () {
        Route::get('/patrol/stats', [PatrolController::class, 'stats']);
        Route::get('/patrol/profile', [PatrolController::class, 'profile']);
        Route::patch('/patrol/status', [PatrolController::class, 'updateStatus']);
        Route::get('/patrol/active-incident', [PatrolController::class, 'activeIncident']);
        Route::get('/patrol/incidents', [PatrolController::class, 'incidents']);
        Route::get('/patrol/incidents/{incident}', [IncidentController::class, 'show']);
        Route::post('/patrol/incidents/{incident}/accept', [PatrolController::class, 'accept']);
        Route::post('/patrol/incidents/{incident}/decline', [PatrolController::class, 'decline']);
        Route::patch('/patrol/incidents/{incident}/status', [PatrolController::class, 'updateIncidentStatus']);
        Route::post('/patrol/incidents/{incident}/resolve', [PatrolController::class, 'resolve']);
        Route::post('/patrol/location', [PatrolController::class, 'updateLocation']);
    });

    // ----------------------------------------------------
    // POLICE STATION DASHBOARD WEB ENDPOINTS
    // ----------------------------------------------------
    Route::middleware('role:STATION_USER,ADMIN')->group(function () {
        Route::get('/station/dashboard', [\App\Http\Controllers\Api\StationController::class, 'dashboard']);
        Route::get('/station/statistics', [\App\Http\Controllers\Api\StationController::class, 'dashboard']);
        Route::get('/station/incidents', [\App\Http\Controllers\Api\StationController::class, 'incidents']);
        Route::get('/station/incidents/{incident}', [\App\Http\Controllers\Api\StationController::class, 'incidentDetail']);
        Route::get('/station/patrols', [\App\Http\Controllers\Api\StationController::class, 'patrols']);
        Route::post('/station/incidents/{incident}/dispatch', [\App\Http\Controllers\Api\StationController::class, 'dispatchPatrol']);
        Route::get('/station/profile', [\App\Http\Controllers\Api\StationController::class, 'profile']);
    });

    // ----------------------------------------------------
    // ADMIN COMMAND CENTER WEB ENDPOINTS
    // ----------------------------------------------------
    Route::middleware('role:ADMIN')->group(function () {
        Route::get('/admin/dashboard/stats', [\App\Http\Controllers\Api\AdminController::class, 'stats']);
        Route::get('/admin/incidents', [\App\Http\Controllers\Api\AdminController::class, 'incidents']);
        Route::get('/admin/incidents/{incident}', [\App\Http\Controllers\Api\AdminController::class, 'incidentDetail']);
        Route::post('/admin/incidents/{incident}/reassign', [\App\Http\Controllers\Api\AdminController::class, 'reassign']);
        Route::post('/admin/incidents/{incident}/cancel', [\App\Http\Controllers\Api\AdminController::class, 'cancel']);
        Route::post('/admin/incidents/{incident}/verify', [\App\Http\Controllers\Api\AdminController::class, 'verify']);
        Route::post('/admin/incidents/{incident}/request-assistance', [\App\Http\Controllers\Api\AdminController::class, 'requestAssistance']);
        Route::delete('/admin/incidents/{incident}', [\App\Http\Controllers\Api\AdminController::class, 'destroy']);
        Route::get('/admin/patrols', [\App\Http\Controllers\Api\AdminController::class, 'patrols']);
        Route::get('/admin/stations', [\App\Http\Controllers\Api\AdminController::class, 'stations']);
    });
});
