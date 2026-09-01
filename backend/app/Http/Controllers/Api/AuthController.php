<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatrolOfficer;
use App\Http\Resources\UserResource;
use App\Http\Resources\PatrolOfficerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new citizen account.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'mobile_number' => ['required', 'string', 'regex:/^(09|\+639)\d{9}$/'],
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => strtolower($validated['email']),
            'mobile_number' => $validated['mobile_number'],
            'password' => Hash::make($validated['password']),
            'role' => User::ROLE_CITIZEN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $token = $user->createToken('citizen_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Citizen account registered successfully.',
            'data' => [
                'token' => $token,
                'user' => new UserResource($user),
            ],
        ], 201);
    }

    /**
     * Authenticate citizen or patrol officer.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email_or_badge' => 'required|string',
            'password' => 'required|string',
        ]);

        $input = trim($validated['email_or_badge']);
        $user = null;

        // Check if input matches email
        if (filter_var($input, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', strtolower($input))->first();
        } else {
            // Check if input matches Patrol Officer badge number
            $officer = PatrolOfficer::where('badge_number', strtoupper($input))->first();
            if ($officer) {
                $user = $officer->user;
            } else {
                $user = User::where('email', strtolower($input))->first();
            }
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials provided.',
                'errors' => ['credentials' => ['Invalid badge number/email or password.']],
            ], 401);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => "Account is currently {$user->status}. Contact police administrator.",
            ], 403);
        }

        $tokenName = $user->isPatrolOfficer() ? 'patrol_token' : ($user->isStationUser() ? 'station_token' : ($user->isAdmin() ? 'admin_token' : 'citizen_token'));
        $token = $user->createToken($tokenName)->plainTextToken;

        $user->load('policeStation');

        $userData = new UserResource($user);
        $officerData = null;

        if ($user->isPatrolOfficer()) {
            $user->load('patrolOfficer.policeStation');
            $officerData = new PatrolOfficerResource($user->patrolOfficer);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'token' => $token,
                'user' => $userData,
                'patrol_officer' => $officerData,
            ],
        ]);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get currently authenticated user details.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('policeStation');
        $officerData = null;

        if ($user->isPatrolOfficer()) {
            $user->load('patrolOfficer.policeStation');
            $officerData = new PatrolOfficerResource($user->patrolOfficer);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'patrol_officer' => $officerData,
            ],
        ]);
    }
}
