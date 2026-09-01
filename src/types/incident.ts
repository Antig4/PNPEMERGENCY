import { Responder } from './responder';
import { LocationCoordinates } from './location';

export type EmergencyCategory = 
  | 'Crime / Police Emergency'
  | 'Medical Emergency'
  | 'Fire / Rescue'
  | 'Traffic Accident';

export type IncidentStatus = 
  | 'NEW'
  | 'NOTIFIED'
  | 'ACCEPTED'
  | 'RESPONDING'
  | 'ON_SCENE'
  | 'RESOLVED'
  | 'CANCELLED';

export interface IncidentAttachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  uri: string;
  createdAt: string;
}

export interface Incident {
  id: string; // e.g., "INC-00021"
  referenceNumber?: string;
  citizenId: string;
  citizenName: string;
  contactNumber: string;
  emergencyType: EmergencyCategory;
  description?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string; // ISO string
  responderId?: string;
  responder?: Responder;
  responderType?: 'PATROL' | 'STATION';
  responderName?: string;
  responderContactNumber?: string;
  declineReason?: string;
  photoUrl?: string;
  videoUrl?: string;
  status: IncidentStatus;
  distanceKm?: number;
  statusHistory: { status: IncidentStatus; timestamp: string; note?: string }[];
  attachments?: IncidentAttachment[];
}

export interface CreateIncidentDTO {
  citizenId: string;
  emergencyType: EmergencyCategory;
  location: LocationCoordinates;
  contactNumber: string;
  description?: string;
  photoUrl?: string;
  videoUrl?: string;
}
