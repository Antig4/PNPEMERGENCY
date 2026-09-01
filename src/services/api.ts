import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * PNP EmergencyLink — Platform-Aware API Base URL Resolution
 *
 * Priority order:
 *  1. EXPO_PUBLIC_API_URL environment variable
 *  2. Constants.expoConfig.extra.EXPO_PUBLIC_API_URL from app.json
 *  3. Platform.OS === 'web'     → http://localhost:8000/api
 *  4. Platform.OS === 'android' → http://10.0.2.2:8000/api  (emulator loopback)
 *  5. Platform.OS === 'ios'     → http://localhost:8000/api  (iOS simulator)
 */
function resolveApiBaseUrl(): string {
  // 1. Expo Web — running inside browser
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:8000/api`;
    }
    return 'http://localhost:8000/api';
  }

  // 2. Explicit override via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Dynamic host IP from Expo debugger host (for Expo Go / Dev Client on physical device)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }

  // 4. Extra field in app.json (embedded into standalone APK build)
  const extraApiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  if (extraApiUrl) {
    return extraApiUrl;
  }

  // 5. Mobile Devices fallback (Physical Android phone / Standalone APK default)
  return 'http://192.168.1.148:8000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  /**
   * Build request headers, attaching the Sanctum Bearer token if present.
   */
  async getHeaders(customHeaders: Record<string, string> = {}, endpoint: string = ''): Promise<Record<string, string>> {
    let token: string | null = null;
    const patrolToken = await storage.getItem('patrol_auth_token');
    const citizenToken = await storage.getItem('auth_token');

    const isPatrolEndpoint = endpoint.startsWith('/patrol');
    const isCitizenEndpoint = endpoint.startsWith('/citizen');
    const isPatrolPage = typeof window !== 'undefined' && window.location?.pathname?.includes('/patrol');

    if (isPatrolEndpoint || (isPatrolPage && !isCitizenEndpoint)) {
      token = patrolToken || citizenToken;
    } else {
      token = citizenToken || patrolToken;
    }

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    };
  },

  /**
   * Generic typed HTTP request.
   * Throws ApiError on non-2xx responses or network failures.
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders(options.headers as Record<string, string>, endpoint);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Clear stale tokens if server returns 401 Unauthenticated
          try {
            await storage.removeItem('auth_token');
            await storage.removeItem('auth_user');
            await storage.removeItem('patrol_auth_token');
            await storage.removeItem('patrol_auth_user');
          } catch (_) {}
        }
        throw new ApiError(
          data.message || `HTTP ${response.status} — API request failed`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network request failed — check server is running and API URL is correct', 0, error);
    }
  },
};
