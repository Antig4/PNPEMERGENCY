import { api } from './api';
import { PatrolOfficer } from '../types';

export const patrolService = {
  async getPatrols(): Promise<PatrolOfficer[]> {
    const res = await api.get('/admin/patrols');
    const items = res.data.data || [];
    return items.map(transformPatrol);
  },

  async getPatrolLocations(): Promise<PatrolOfficer[]> {
    return this.getPatrols();
  },
};

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
