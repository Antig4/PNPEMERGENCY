import { api } from './api';
import { Incident, IncidentFilters } from '../types';

export const incidentService = {
  async getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
    const params: Record<string, any> = {};
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters?.emergencyType && filters.emergencyType !== 'ALL') params.emergency_type = filters.emergencyType;
    if (filters?.stationId && filters.stationId !== 'ALL') params.station_id = filters.stationId;
    if (filters?.dateRange && filters.dateRange !== 'ALL') params.date_range = filters.dateRange;
    if (filters?.flaggedOnly) params.flagged_only = true;

    const res = await api.get('/admin/incidents', { params });
    const items = res.data.data || [];
    return items.map(transformIncident);
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await api.get(`/admin/incidents/${id}`);
    return transformIncident(res.data.data);
  },

  async verifyIncident(id: string): Promise<Incident> {
    const res = await api.post(`/admin/incidents/${id}/verify`);
    return transformIncident(res.data.data);
  },

  async cancelIncident(id: string, reason: string): Promise<Incident> {
    const res = await api.post(`/admin/incidents/${id}/cancel`, { cancellation_reason: reason });
    return transformIncident(res.data.data);
  },

  async reassignIncident(id: string, patrolOfficerId: string, reason: string): Promise<Incident> {
    const res = await api.post(`/admin/incidents/${id}/reassign`, {
      patrol_officer_id: patrolOfficerId,
      reason: reason,
    });
    return transformIncident(res.data.data);
  },

  async requestAssistance(id: string, assistingStationId: string, notes: string): Promise<void> {
    await api.post(`/admin/incidents/${id}/request-assistance`, {
      assisting_station_id: assistingStationId,
      notes: notes,
    });
  },

  async deleteIncident(id: string): Promise<void> {
    await api.delete(`/admin/incidents/${id}`);
  },
};

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
