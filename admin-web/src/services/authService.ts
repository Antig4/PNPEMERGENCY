import { api } from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

const WEB_TOKEN_KEY = 'admin_token';
const WEB_USER_KEY = 'admin_user';

export const authService = {
  async login(emailOrBadge: string, password: string): Promise<LoginResponse> {
    const res = await api.post('/auth/login', {
      email_or_badge: emailOrBadge,
      password: password,
    });

    const data = res.data.data;
    const rawUser = data.user;

    // Only ADMIN and STATION_USER may access the web command center
    if (rawUser.role !== 'ADMIN' && rawUser.role !== 'STATION_USER') {
      throw new Error('Access Denied: Only Admin or Station Officers can access the Command Center.');
    }

    // Normalize user object (API returns snake_case, we store both)
    const user: User = {
      id: String(rawUser.id),
      fullName: rawUser.full_name || rawUser.name || '',
      full_name: rawUser.full_name || rawUser.name || '',
      email: rawUser.email,
      mobileNumber: rawUser.mobile_number,
      role: rawUser.role,
      status: rawUser.status,
      stationId: rawUser.police_station_id ?? rawUser.station_id ?? null,
      police_station_id: rawUser.police_station_id ?? rawUser.station_id ?? null,
      station_id: rawUser.police_station_id ?? rawUser.station_id ?? null,
      station: rawUser.station ?? null,
      createdAt: rawUser.created_at,
    };

    localStorage.setItem(WEB_TOKEN_KEY, data.token);
    localStorage.setItem(WEB_USER_KEY, JSON.stringify(user));

    return { token: data.token, user };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem(WEB_TOKEN_KEY);
      localStorage.removeItem(WEB_USER_KEY);
    }
  },

  getSavedUser(): User | null {
    const raw = localStorage.getItem(WEB_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    const rawUser = res.data.data.user;
    const user: User = {
      id: String(rawUser.id),
      fullName: rawUser.full_name || rawUser.name || '',
      full_name: rawUser.full_name || rawUser.name || '',
      email: rawUser.email,
      mobileNumber: rawUser.mobile_number,
      role: rawUser.role,
      status: rawUser.status,
      stationId: rawUser.police_station_id ?? rawUser.station_id ?? null,
      police_station_id: rawUser.police_station_id ?? rawUser.station_id ?? null,
      station_id: rawUser.police_station_id ?? rawUser.station_id ?? null,
      station: rawUser.station ?? null,
      createdAt: rawUser.created_at,
    };
    localStorage.setItem(WEB_USER_KEY, JSON.stringify(user));
    return user;
  },
};

