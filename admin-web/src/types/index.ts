export type UserRole = 'CITIZEN' | 'PATROL_OFFICER' | 'STATION_USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface StationInfo {
  id: string | number;
  station_code?: string;
  station_name: string;
  name?: string;
  address?: string;
  contact_number?: string;
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: string;
  fullName: string;
  full_name?: string;
  email: string;
  mobileNumber?: string;
  role: UserRole;
  status: UserStatus;
  stationId?: string | number | null;
  police_station_id?: string | number | null;
  station_id?: string | number | null;
  station?: StationInfo | null;
  createdAt?: string;
}

export interface StationDashboardStats {
  active_incidents: number;
  new_reports: number;
  responding: number;
  on_scene: number;
  resolved_today: number;
  total_incidents: number;
  available_patrols: number;
  total_patrols: number;
}

export type IncidentStatus = 
  | 'NEW' 
  | 'NOTIFIED' 
  | 'ACCEPTED' 
  | 'RESPONDING' 
  | 'ON_SCENE' 
  | 'RESOLVED' 
  | 'CANCELLED' 
  | 'UNVERIFIED';

export type EmergencyType = 'CRIME_POLICE' | 'MEDICAL' | 'FIRE_RESCUE';

export interface IncidentStatusHistory {
  id: string;
  oldStatus?: IncidentStatus;
  newStatus: IncidentStatus;
  remarks?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  referenceNumber: string;
  citizenId: string;
  citizenName?: string;
  citizenMobile?: string;
  emergencyType: EmergencyType;
  description?: string;
  photoUrl?: string;
  videoUrl?: string;
  responderType?: 'PATROL' | 'STATION';
  declineReason?: string;
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  status: IncidentStatus;
  reportedAt: string;
  acceptedAt?: string;
  respondingAt?: string;
  onSceneAt?: string;
  resolvedAt?: string;
  assignedPatrolId?: string;
  assignedPatrolName?: string;
  assignedPatrolBadge?: string;
  assignedStationId?: string;
  assignedStationName?: string;
  assignedStationCode?: string;
  flaggedForReview?: boolean;
  reviewNote?: string;
  cancellationReason?: string;
  resolutionSummary?: string;
  resolutionOutcome?: string;
  statusHistory?: IncidentStatusHistory[];
}

export type PatrolAvailabilityStatus = 'AVAILABLE' | 'RESPONDING' | 'ON_SCENE' | 'OFF_DUTY' | 'OFFLINE';

export interface PatrolOfficer {
  id: string;
  userId: string;
  badgeNumber: string;
  officerName: string;
  mobileNumber?: string;
  stationId: string;
  stationName: string;
  unitName: string;
  availabilityStatus: PatrolAvailabilityStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  locationAccuracy?: number;
  locationUpdatedAt?: string;
}

export interface PoliceStation {
  id: string;
  stationName: string;
  stationCode: string;
  address: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  totalPatrols: number;
  availablePatrols: number;
  activeIncidents: number;
}

export interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  responding: number;
  onScene: number;
  resolvedToday: number;
  availablePatrols: number;
}

export interface IncidentFilters {
  status?: string;
  emergencyType?: string;
  stationId?: string;
  dateRange?: string;
  flaggedOnly?: boolean;
}
