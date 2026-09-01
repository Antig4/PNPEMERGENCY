import { api } from './api';
import { Incident, PatrolOfficer, PoliceStation, StationDashboardStats } from '../types';

export interface StationDashboardData {
  station: PoliceStation;
  stats: StationDashboardStats;
}

// Transform raw API incident (same logic as incidentService)
function transformIncident(raw: any): Incident {
  return {
    id: String(raw.id),
    referenceNumber: raw.reference_number,
    citizenId: String(raw.citizen?.id || ''),
    citizenName: raw.citizen?.full_name || 'Anonymous Citizen',
    citizenMobile: raw.citizen?.mobile_number || 'N/A',
    emergencyType: raw.emergency_type,
    description: raw.description,
    photoUrl: raw.photo_url || undefined,
    videoUrl: raw.video_url || undefined,
    responderType: raw.responder_type || (raw.assigned_patrol?.id ? 'PATROL' : 'STATION'),
    declineReason: raw.decline_reason || undefined,
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    locationAccuracy: raw.location_accuracy ? Number(raw.location_accuracy) : undefined,
    status: raw.status,
    reportedAt: raw.reported_at || raw.created_at,
    acceptedAt: raw.accepted_at,
    respondingAt: raw.responding_at,
    onSceneAt: raw.on_scene_at,
    resolvedAt: raw.resolved_at,
    assignedPatrolId: raw.assigned_patrol?.id ? String(raw.assigned_patrol.id) : undefined,
    assignedPatrolName: raw.assigned_patrol?.user?.full_name || raw.assigned_patrol?.patrol_unit_name,
    assignedPatrolBadge: raw.assigned_patrol?.badge_number,
    assignedStationId: raw.assigned_station?.id ? String(raw.assigned_station.id) : undefined,
    assignedStationName: raw.assigned_station?.station_name,
    assignedStationCode: raw.assigned_station?.station_code,
    flaggedForReview: Boolean(raw.flagged_for_review),
    reviewNote: raw.review_note,
    cancellationReason: raw.cancellation_reason,
    resolutionSummary: raw.resolution_summary,
    resolutionOutcome: raw.resolution_outcome,
    statusHistory: (raw.status_history || []).map((h: any) => ({
      id: String(h.id),
      oldStatus: h.old_status,
      newStatus: h.new_status,
      remarks: h.remarks,
      changedBy: h.changed_by?.full_name || 'System Dispatch',
      createdAt: h.created_at,
    })),
  };
}

// Transform raw API patrol officer
function transformPatrol(raw: any): PatrolOfficer {
  return {
    id: String(raw.id),
    userId: String(raw.user_id || ''),
    badgeNumber: raw.badge_number,
    officerName: raw.officer_name || raw.user?.full_name || 'Officer',
    mobileNumber: raw.user?.mobile_number,
    stationId: String(raw.police_station_id || ''),
    stationName: raw.police_station?.station_name || 'Station',
    unitName: raw.patrol_unit_name,
    availabilityStatus: raw.availability_status,
    currentLatitude: raw.current_latitude ? Number(raw.current_latitude) : undefined,
    currentLongitude: raw.current_longitude ? Number(raw.current_longitude) : undefined,
    locationAccuracy: raw.location_accuracy ? Number(raw.location_accuracy) : undefined,
    locationUpdatedAt: raw.location_updated_at,
  };
}

// Transform raw station to PoliceStation
function transformStation(raw: any): PoliceStation {
  return {
    id: String(raw.id),
    stationName: raw.station_name || raw.name || '',
    stationCode: raw.station_code || '',
    address: raw.address || '',
    contactNumber: raw.contact_number || '',
    latitude: Number(raw.latitude || 0),
    longitude: Number(raw.longitude || 0),
    totalPatrols: raw.total_patrols || 0,
    availablePatrols: raw.available_patrols || 0,
    activeIncidents: raw.active_incidents || 0,
  };
}

export const stationService = {
  async getDashboard(): Promise<StationDashboardData> {
    const res = await api.get('/station/dashboard');
    const data = res.data.data;
    return {
      station: transformStation(data.station),
      stats: data.stats as StationDashboardStats,
    };
  },

  async getIncidents(status?: string): Promise<Incident[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const res = await api.get('/station/incidents', { params });
    const items = res.data.data || [];
    return items.map(transformIncident);
  },

  async getIncidentDetail(id: string): Promise<Incident> {
    const res = await api.get(`/station/incidents/${id}`);
    return transformIncident(res.data.data);
  },

  async getPatrols(): Promise<PatrolOfficer[]> {
    const res = await api.get('/station/patrols');
    const items = res.data.data || [];
    return items.map(transformPatrol);
  },

  async getProfile() {
    const res = await api.get('/station/profile');
    return res.data.data;
  },

  async dispatchPatrol(incidentId: string, patrolId: number | string): Promise<Incident> {
    const res = await api.post(`/station/incidents/${incidentId}/dispatch`, { patrol_id: patrolId });
    return transformIncident(res.data.data);
  },

  // Used by Admin pages — calls the admin endpoint
  async getStations(): Promise<PoliceStation[]> {
    const res = await api.get('/admin/stations');
    const items = res.data.data || [];
    return items.map(transformStation);
  },
};
