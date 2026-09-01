import { Incident, CreateIncidentDTO, EmergencyCategory } from '../types/incident';
import { api } from './api';

const emergencyTypeToBackend: Record<string, string> = {
  'Crime / Police Emergency': 'CRIME_POLICE',
  'Medical Emergency': 'MEDICAL',
  'Fire / Rescue': 'FIRE_RESCUE',
  'Traffic Accident': 'CRIME_POLICE',
  'CRIME_POLICE': 'CRIME_POLICE',
  'MEDICAL': 'MEDICAL',
  'FIRE_RESCUE': 'FIRE_RESCUE',
};

const emergencyTypeToFrontend: Record<string, EmergencyCategory> = {
  'CRIME_POLICE': 'Crime / Police Emergency',
  'MEDICAL': 'Medical Emergency',
  'FIRE_RESCUE': 'Fire / Rescue',
  'TRAFFIC_ACCIDENT': 'Traffic Accident',
};

export const incidentService = {
  /**
   * Send rapid emergency request and create incident via Laravel REST API
   * Endpoint: POST /api/incidents
   */
  async createIncident(dto: CreateIncidentDTO): Promise<Incident> {
    try {
      const backendType = emergencyTypeToBackend[dto.emergencyType] || 'CRIME_POLICE';

      const res = await api.request<{ success: boolean; data: any; dispatch_result?: any }>('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          emergency_type: backendType,
          latitude: dto.location.latitude,
          longitude: dto.location.longitude,
          location_accuracy: dto.location.accuracy || 10,
          description: dto.description || '',
          photo_url: dto.photoUrl || null,
          video_url: dto.videoUrl || null,
        }),
      });

      if (res.success && res.data) {
        const incident = this.transformIncident(res.data);
        if (res.dispatch_result) {
          incident.responderType = res.dispatch_result.responder_type;
          incident.responderName = res.dispatch_result.responder_name || incident.responderName;
          incident.responderContactNumber = res.dispatch_result.responder_contact_number || incident.responderContactNumber;
          if (res.dispatch_result.distance_km) {
            incident.distanceKm = res.dispatch_result.distance_km;
          }
        }
        return incident;
      }
      throw new Error('Failed to create incident on server.');
    } catch (error) {
      console.error('[incidentService] createIncident error:', error);
      throw error;
    }
  },

  /**
   * Fetch active incident reported by authenticated citizen
   * Endpoint: GET /api/citizen/active-incident
   */
  async getActiveIncident(): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>('/citizen/active-incident');
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthenticated')) {
        throw e;
      }
      console.warn('[incidentService] getActiveIncident error:', e);
      return null;
    }
  },

  /**
   * Fetch incident history for citizen
   * Endpoint: GET /api/citizen/incidents
   */
  async getIncidentHistory(): Promise<Incident[]> {
    try {
      const res = await api.request<{ success: boolean; data: any[] }>('/citizen/incidents');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((item) => this.transformIncident(item));
      }
      return [];
    } catch (e) {
      console.warn('[incidentService] getIncidentHistory error:', e);
      return [];
    }
  },

  /**
   * Get single incident details by ID
   * Endpoint: GET /api/incidents/{id}
   */
  async getIncidentById(id: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/incidents/${id}`);
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return null;
    } catch (e) {
      console.warn('[incidentService] getIncidentById error:', e);
      return null;
    }
  },

  /**
   * Update incident status (e.g. simulation or officer status transition)
   */
  async updateIncidentStatus(id: string, status: string, note?: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/patrol/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return this.getIncidentById(id);
    } catch (e) {
      console.warn('[incidentService] updateIncidentStatus error:', e);
      return this.getIncidentById(id);
    }
  },

  /**
   * Add extra description notes or image details to incident
   */
  async addIncidentDetails(id: string, description?: string, imageUri?: string): Promise<Incident | null> {
    try {
      const res = await api.request<{ success: boolean; data: any }>(`/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description, image_uri: imageUri }),
      });
      if (res.success && res.data) {
        return this.transformIncident(res.data);
      }
      return this.getIncidentById(id);
    } catch (e) {
      console.warn('[incidentService] addIncidentDetails error:', e);
      return this.getIncidentById(id);
    }
  },

  /**
   * Transform backend API response into frontend Incident model
   */
  transformIncident(data: any): Incident {
    const assignedPatrol = data.assigned_patrol || data.patrol_officer || {};
    const assignedStation = data.assigned_station || data.police_station || {};
    const citizen = data.citizen || {};

    const responder = assignedPatrol.id
      ? {
          id: String(assignedPatrol.id),
          name: assignedPatrol.patrol_unit_name || assignedPatrol.unitName || assignedPatrol.officer_name || 'Patrol Unit',
          code: assignedPatrol.badge_number || 'PATROL',
          type: 'Patrol Officer',
          stationName: assignedStation.station_name || 'Station Desk',
          contactNumber: assignedPatrol.contact_number || '0998 598 6231',
          distanceKm: data.distance_km || 0.8,
          estimatedArrivalMins: 4,
          latitude: Number(assignedPatrol.current_latitude || data.latitude),
          longitude: Number(assignedPatrol.current_longitude || data.longitude),
          isAvailable: true,
        }
      : undefined;

    const frontendCategory = emergencyTypeToFrontend[data.emergency_type] || data.emergency_type || 'Crime / Police Emergency';

    return {
      id: String(data.id || data.reference_number),
      referenceNumber: data.reference_number || data.referenceNumber,
      emergencyType: frontendCategory as EmergencyCategory,
      status: data.status || 'NEW',
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: data.location_accuracy ? Number(data.location_accuracy) : 10,
      description: data.description || '',
      photoUrl: data.photo_url || data.photoUrl || undefined,
      videoUrl: data.video_url || data.videoUrl || undefined,
      responderType: data.responder_type || (assignedPatrol.id ? 'PATROL' : 'STATION'),
      responderName: data.responder_name || (assignedPatrol.id ? (assignedPatrol.user?.full_name || assignedPatrol.patrol_unit_name) : assignedStation.station_name),
      responderContactNumber: data.responder_contact_number || (assignedPatrol.id ? (assignedPatrol.user?.mobile_number || assignedPatrol.contact_number) : assignedStation.contact_number),
      declineReason: data.decline_reason || data.declineReason || undefined,
      citizenId: String(citizen.id || data.citizen_id || ''),
      citizenName: citizen.full_name || citizen.name || data.citizen_name || 'Citizen Informant',
      contactNumber: citizen.mobile_number || data.citizen_mobile || '',
      timestamp: data.reported_at || data.created_at || new Date().toISOString(),
      responderId: assignedPatrol.id ? String(assignedPatrol.id) : undefined,
      responder,
      statusHistory: Array.isArray(data.status_history)
        ? data.status_history.map((h: any) => ({
            status: h.new_status || h.status,
            timestamp: h.created_at || h.timestamp,
            note: h.remarks || h.note,
          }))
        : [],
      attachments: [],
    } as Incident;
  }
};
