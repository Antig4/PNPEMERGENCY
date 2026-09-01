import { LocationCoordinates } from '../types/location';
import { PatrolStatus, PatrolLocationPayload } from '../types/patrol';
import { locationService } from './locationService';
import { api } from './api';

let trackingIntervalId: any = null;

export const patrolLocationService = {
  /**
   * Broadcast single patrol officer location update to backend API
   * Endpoint: POST /api/patrol/location
   */
  async sendPatrolLocation(
    patrolId: string,
    coords: LocationCoordinates,
    status: PatrolStatus,
    incidentId?: string
  ): Promise<void> {
    const payload: PatrolLocationPayload = {
      patrolId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: new Date(coords.timestamp).toISOString(),
      status,
      incidentId,
    };

    try {
      // Prepared for Laravel API:
      // await api.request('/patrol/location', { method: 'POST', body: JSON.stringify(payload) });
      console.log('[patrolLocationService] Location broadcast sent:', payload);
    } catch (e) {
      console.warn('[patrolLocationService] sendPatrolLocation error:', e);
    }
  },

  /**
   * Start interval location updates while officer is RESPONDING or ON_SCENE
   */
  startActiveTracking(patrolId: string, status: PatrolStatus, incidentId?: string, intervalMs: number = 10000): void {
    this.stopActiveTracking();

    if (status === 'OFF_DUTY' || status === 'OFFLINE') {
      console.log('[patrolLocationService] Active tracking skipped (Officer is Off Duty/Offline).');
      return;
    }

    trackingIntervalId = setInterval(async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        await this.sendPatrolLocation(patrolId, coords, status, incidentId);
      } catch (e) {
        console.warn('[patrolLocationService] Active tracking poll failed:', e);
      }
    }, intervalMs);
  },

  /**
   * Stop active location tracking
   */
  stopActiveTracking(): void {
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
      trackingIntervalId = null;
    }
  }
};
