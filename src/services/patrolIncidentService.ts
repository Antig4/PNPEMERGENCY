import { Incident } from '../types/incident';
import { DeclineReason, ResolutionOutcome } from '../types/patrol';
import { api } from './api';

export const patrolIncidentService = {
  /**
   * Fetch current active assigned incident for authenticated patrol officer
   * Endpoint: GET /api/patrol/active-incident
   */
  async getActiveIncident(): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>('/patrol/active-incident');
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthenticated')) {
        throw e;
      }
      console.warn('[patrolIncidentService] getActiveIncident error:', e);
      return null;
    }
  },

  /**
   * Fetch incident history for authenticated patrol officer
   * Endpoint: GET /api/patrol/incidents
   */
  async getPatrolHistory(officerId?: string): Promise<Incident[]> {
    try {
      const res = await api.request<{ success: boolean; data: any }>('/patrol/incidents');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return rawList.map((item: any) => this.transformIncident(item));
    } catch (e: any) {
      console.warn('[patrolIncidentService] getPatrolHistory error:', e);
      return [];
    }
  },

  /**
   * Get single incident details by ID for patrol officer
   * Endpoint: GET /api/patrol/incidents/{id} or /api/incidents/{id}
   */
  async getIncidentById(id: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${id}`);
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e) {
      console.warn('[patrolIncidentService] getIncidentById error:', e);
      return null;
    }
  },

  /**
   * Accepts assigned emergency incident
   * Endpoint: POST /api/patrol/incidents/{id}/accept
   */
  async acceptIncident(incidentId: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${incidentId}/accept`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e: any) {
      console.error('[patrolIncidentService] acceptIncident error:', e);
      throw e;
    }
  },

  /**
   * Declines emergency assignment with mandatory reason
   * Endpoint: POST /api/patrol/incidents/{id}/decline
   */
  async declineIncident(incidentId: string, reason: string): Promise<any> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${incidentId}/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return res.data;
    } catch (e: any) {
      console.error('[patrolIncidentService] declineIncident error:', e);
      throw e;
    }
  },

  /**
   * Updates incident status (RESPONDING, ON_SCENE)
   * Endpoint: PATCH /api/patrol/incidents/{id}/status
   */
  async updateIncidentStatus(incidentId: string, status: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e: any) {
      console.error('[patrolIncidentService] updateIncidentStatus error:', e);
      throw e;
    }
  },

  /**
   * Marks officer as ON SCENE
   * Endpoint: PATCH /api/patrol/incidents/{id}/status
   */
  async markOnScene(incidentId: string): Promise<Incident | null> {
    return this.updateIncidentStatus(incidentId, 'ON_SCENE');
  },

  /**
   * Resolves emergency incident with outcome summary
   * Endpoint: POST /api/patrol/incidents/{id}/resolve
   */
  async resolveIncident(
    incidentId: string,
    summary: string,
    outcome: ResolutionOutcome
  ): Promise<Incident | null> {
    const outcomeMap: Record<string, string> = {
      'Resolved': 'RESOLVED',
      'Referred to another unit': 'REFERRED',
      'No assistance required': 'NO_ASSISTANCE_REQUIRED',
      'Unable to locate': 'UNABLE_TO_LOCATE',
      'Other': 'OTHER',
    };
    const outcomeCode = outcomeMap[outcome] || outcome || 'OTHER';

    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${incidentId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolution_summary: summary,
          resolution_outcome: outcomeCode,
        }),
      });
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e: any) {
      console.error('[patrolIncidentService] resolveIncident error:', e);
      throw e;
    }
  },

  /**
   * Transform backend API response into frontend Incident model
   */
  transformIncident(data: any): Incident {
    const assignedPatrol = data.assigned_patrol || data.patrol_officer || {};
    const assignedStation = data.assigned_station || data.police_station || {};
    const citizen = data.citizen || {};

    return {
      id: String(data.id || data.reference_number),
      referenceNumber: data.reference_number || data.referenceNumber,
      emergencyType: data.emergency_type || data.emergencyType || 'CRIME_POLICE',
      status: data.status || 'NEW',
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      locationAccuracy: data.location_accuracy ? Number(data.location_accuracy) : 10,
      description: data.description || '',
      citizenId: String(citizen.id || data.citizen_id || ''),
      citizenName: citizen.full_name || citizen.name || data.citizen_name || 'Citizen Informant',
      citizenMobile: citizen.mobile_number || data.citizen_mobile || '',
      assignedPatrolId: assignedPatrol.id ? String(assignedPatrol.id) : undefined,
      assignedPatrolBadge: assignedPatrol.badge_number || assignedPatrol.badgeNumber,
      assignedPatrolName: assignedPatrol.patrol_unit_name || assignedPatrol.unitName || assignedPatrol.officer_name,
      assignedStationId: assignedStation.id ? String(assignedStation.id) : undefined,
      assignedStationName: assignedStation.station_name || assignedStation.stationName,
      timestamp: data.reported_at || data.created_at || new Date().toISOString(),
    } as Incident;
  }
};
