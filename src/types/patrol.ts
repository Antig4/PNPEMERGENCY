export type PatrolStatus = 
  | 'AVAILABLE' 
  | 'RESPONDING' 
  | 'ON_SCENE' 
  | 'OFF_DUTY' 
  | 'OFFLINE';

export type DeclineReason = 
  | 'Unable to respond' 
  | 'Already handling another emergency' 
  | 'Vehicle problem' 
  | 'Safety concern' 
  | 'Other';

export type ResolutionOutcome = 
  | 'Resolved' 
  | 'Referred to another unit' 
  | 'No assistance required' 
  | 'Unable to locate' 
  | 'Other';

export interface PatrolOfficer {
  id: string; // e.g. "PAT-01"
  badgeNumber: string; // e.g. "BCPO-99421"
  name: string; // e.g. "Patrol 01" / "PO3 Juan Santos"
  rank: string; // e.g. "Police Corporal"
  unitName: string; // e.g. "Mobile Patrol Unit 1"
  stationName: string; // e.g. "Butuan City Police Station 1"
  contactNumber: string;
  role: 'PATROL_OFFICER';
  status: PatrolStatus;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface PatrolOfficerStats {
  todayTotal: number;
  resolved: number;
  active: number;
}

export interface IncidentResolution {
  incidentId: string;
  officerId: string;
  summary: string;
  outcome: ResolutionOutcome;
  resolvedAt: string;
}

export interface PatrolLocationPayload {
  patrolId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  status: PatrolStatus;
  incidentId?: string;
}
