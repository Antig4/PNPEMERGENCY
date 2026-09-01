export type ResponderType = 'Patrol Officer' | 'Police Station' | 'Traffic Police' | 'K9 Unit';

export interface Responder {
  id: string;
  name: string; // e.g., "Patrol 01" or "Butuan City Police Station 1"
  code: string; // e.g., "PAT-01"
  type: ResponderType;
  stationName: string;
  contactNumber: string;
  distanceKm: number;
  estimatedArrivalMins: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
}
