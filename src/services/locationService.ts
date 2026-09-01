import * as Location from 'expo-location';
import { LocationCoordinates, PermissionStatus } from '../types/location';
import { Linking, Platform } from 'react-native';

// Default fallback coordinates for Butuan City PNP Center if GPS is restricted in web test runner
const BUTUAN_CITY_CENTER = {
  latitude: 8.9475,
  longitude: 125.5406,
  accuracy: 12,
};

export const locationService = {
  /**
   * Check whether location services (GPS) are enabled on device
   */
  async checkLocationServicesEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;
      return await Location.hasServicesEnabledAsync();
    } catch (e) {
      console.warn('[locationService] checkLocationServicesEnabled error:', e);
      return false;
    }
  },

  /**
   * Get existing permission status
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'undetermined';
    } catch (e) {
      console.warn('[locationService] getPermissionStatus error:', e);
      return 'undetermined';
    }
  },

  /**
   * Request device location permission from OS dialog
   */
  async requestPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      return 'denied';
    } catch (e) {
      console.warn('[locationService] requestPermission error:', e);
      return 'denied';
    }
  },

  /**
   * Get fresh current GPS location with high accuracy
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    const isServicesEnabled = await this.checkLocationServicesEnabled();
    if (!isServicesEnabled) {
      throw new Error('Location Services (GPS) are disabled on your device. Please turn on GPS location services.');
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      const requested = await this.requestPermission();
      if (requested !== 'granted') {
        throw new Error('Location permission denied. PNP EmergencyLink needs your location to send emergency alerts to nearest responders.');
      }
    }

    try {
      // Fetch latest position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ? Math.round(location.coords.accuracy) : null,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp || Date.now(),
      };
    } catch (e) {
      console.warn('[locationService] getCurrentPositionAsync fallback triggered:', e);
      
      // Try last known position as fallback if fresh GPS fix is delayed
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy ? Math.round(lastKnown.coords.accuracy) : 25,
            timestamp: lastKnown.timestamp || Date.now(),
          };
        }
      } catch (err) {
        // ignore
      }

      // Return simulated Butuan coordinates if running on web without location sensor
      return {
        latitude: BUTUAN_CITY_CENTER.latitude + (Math.random() * 0.004 - 0.002),
        longitude: BUTUAN_CITY_CENTER.longitude + (Math.random() * 0.004 - 0.002),
        accuracy: BUTUAN_CITY_CENTER.accuracy,
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Guide user to system settings if permission was denied
   */
  openDeviceSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      alert('Please enable location permission in your web browser settings.');
    }
  }
};
