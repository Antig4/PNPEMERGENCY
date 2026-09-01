export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  address?: string;
}

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface LocationState {
  coordinates: LocationCoordinates | null;
  permissionStatus: PermissionStatus;
  isServicesEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}
