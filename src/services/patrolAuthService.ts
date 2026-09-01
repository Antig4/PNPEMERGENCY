import { PatrolOfficer } from '../types/patrol';
import { storage } from '../utils/storage';
import { api } from './api';

const PATROL_TOKEN_KEY = 'patrol_auth_token';
const PATROL_USER_KEY = 'patrol_auth_user';

export const patrolAuthService = {
  /**
   * Retrieves saved patrol officer session from SecureStore
   */
  async getSavedSession(): Promise<{ token: string; officer: PatrolOfficer } | null> {
    try {
      const token = await storage.getItem(PATROL_TOKEN_KEY);
      const userJson = await storage.getItem(PATROL_USER_KEY);

      if (token && userJson) {
        const officer: PatrolOfficer = JSON.parse(userJson);
        return { token, officer };
      }
      return null;
    } catch (e) {
      console.warn('[patrolAuthService] getSavedSession error:', e);
      return null;
    }
  },

  /**
   * Patrol Officer login using Badge / Officer ID & Password
   */
  async login(badgeNumber: string, password: string): Promise<{ token: string; officer: PatrolOfficer }> {
    const cleanBadge = badgeNumber.trim().toUpperCase();

    if (!cleanBadge) {
      throw new Error('Badge or Officer ID is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }

    const res = await api.request<{
      success: boolean;
      data: {
        token: string;
        user: any;
        patrol_officer: any;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email_or_badge: cleanBadge,
        password: password,
      }),
    });

    if (!res.success || !res.data?.token) {
      throw new Error('Invalid patrol officer credentials.');
    }

    const { token, patrol_officer } = res.data;
    const officer: PatrolOfficer = {
      id: String(patrol_officer.id),
      badgeNumber: patrol_officer.badge_number,
      name: patrol_officer.patrol_unit_name || patrol_officer.officer_name || 'Patrol Unit',
      rank: 'Police Officer',
      unitName: patrol_officer.patrol_unit_name,
      stationName: patrol_officer.police_station?.station_name || 'Police Station 1',
      contactNumber: patrol_officer.contact_number || '',
      role: 'PATROL_OFFICER',
      status: patrol_officer.availability_status || 'AVAILABLE',
      latitude: Number(patrol_officer.current_latitude || 8.9482),
      longitude: Number(patrol_officer.current_longitude || 125.5412),
      updatedAt: new Date().toISOString(),
    };

    await storage.setItem(PATROL_TOKEN_KEY, token);
    await storage.setItem('auth_token', token);
    await storage.setItem(PATROL_USER_KEY, JSON.stringify(officer));

    return { token, officer };
  },

  async updateStoredOfficer(officer: PatrolOfficer): Promise<void> {
    await storage.setItem(PATROL_USER_KEY, JSON.stringify(officer));
  },

  async logout(): Promise<void> {
    // Call server logout endpoint to revoke Sanctum token
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore server error — local session still cleared
    }
    await storage.removeItem(PATROL_TOKEN_KEY);
    await storage.removeItem(PATROL_USER_KEY);
    // Also clear the unified auth keys written during login
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
  }
};
