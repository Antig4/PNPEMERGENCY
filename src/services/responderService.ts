import { Responder } from '../types/responder';
import { EmergencyCategory } from '../types/incident';
import { api } from './api';

export const responderService = {
  /**
   * Finds the nearest available responder based on GPS coordinates and emergency category.
   * Interfaces directly with future Laravel GIS spatial query endpoint (e.g. GET /api/responders/nearest?lat=...&lng=...).
   */
  async findNearestAvailableResponder(
    latitude: number,
    longitude: number,
    emergencyCategory: EmergencyCategory = 'Crime / Police Emergency'
  ): Promise<Responder> {
    try {
      // Prepared for Laravel API:
      // return await api.request<Responder>(`/responders/nearest?lat=${latitude}&lng=${longitude}&category=${encodeURIComponent(emergencyCategory)}`);

      // Mock calculation service simulating GIS proximity lookup in Butuan City area
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate brief network/GIS lookup

      const mockResponders: Responder[] = [
        {
          id: 'RESP-PAT01',
          name: 'Patrol 01',
          code: 'PAT-01',
          type: 'Patrol Officer',
          stationName: 'Butuan City Police Station 1 (San Jose)',
          contactNumber: '0998 598 6231',
          distanceKm: 0.8,
          estimatedArrivalMins: 4,
          latitude: latitude + 0.003,
          longitude: longitude + 0.002,
          isAvailable: true,
        },
        {
          id: 'RESP-PAT04',
          name: 'Patrol 04',
          code: 'PAT-04',
          type: 'Patrol Officer',
          stationName: 'Butuan Central Police Station',
          contactNumber: '0998 598 6234',
          distanceKm: 1.4,
          estimatedArrivalMins: 7,
          latitude: latitude + 0.006,
          longitude: longitude - 0.004,
          isAvailable: true,
        },
        {
          id: 'RESP-STN01',
          name: 'BCPO Station 1 Dispatch',
          code: 'STN-01',
          type: 'Police Station',
          stationName: 'Butuan City Police Office Headquarters',
          contactNumber: '(085) 342-5318',
          distanceKm: 2.1,
          estimatedArrivalMins: 10,
          latitude: latitude - 0.008,
          longitude: longitude + 0.005,
          isAvailable: true,
        }
      ];

      return mockResponders[0];
    } catch (error) {
      console.error('[responderService] Error finding responder:', error);
      throw error;
    }
  }
};
