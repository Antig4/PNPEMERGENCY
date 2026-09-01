import { User, LoginDTO, RegisterDTO, AuthResponse } from '../types/auth';
import { storage } from '../utils/storage';
import { api } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  /**
   * Retrieves stored session if present so citizen stays logged in
   */
  async getSavedSession(): Promise<AuthResponse | null> {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const userJson = await storage.getItem(USER_KEY);

      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        return { token, user };
      }
      return null;
    } catch (e) {
      console.warn('[authService] Error fetching saved session:', e);
      return null;
    }
  },

  /**
   * Register a new Citizen Account
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    try {
      const res = await api.request<{
        success: boolean;
        data: {
          token: string;
          user: any;
        };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          mobile_number: data.mobileNumber,
          password: data.password,
        }),
      });

      if (!res.success || !res.data?.token) {
        throw new Error('Registration failed.');
      }

      const { token, user: u } = res.data;
      const user: User = {
        id: String(u.id),
        fullName: u.full_name,
        firstName: u.full_name.split(' ')[0],
        mobileNumber: u.mobile_number,
        email: u.email,
        role: u.role || 'CITIZEN',
        createdAt: u.created_at || new Date().toISOString(),
      };

      await this.saveSession(token, user);
      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Unified login for Citizen and Patrol Officer.
   * The role field in the response determines which dashboard to show.
   */
  async login(credentials: LoginDTO): Promise<AuthResponse> {
    try {
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
          email_or_badge: credentials.email,
          password: credentials.password,
        }),
      });

      if (!res.success || !res.data?.token) {
        throw new Error('Invalid login credentials.');
      }

      const { token, user: u, patrol_officer } = res.data;
      const user: User = {
        id: String(u.id),
        fullName: u.full_name,
        firstName: u.full_name?.split(' ')[0] || u.full_name || 'User',
        mobileNumber: u.mobile_number || '',
        email: u.email,
        role: u.role || 'CITIZEN',
        createdAt: u.created_at || new Date().toISOString(),
      };

      // Store unified auth token under both keys so API calls work for both roles
      await this.saveSession(token, user);

      // If patrol officer, also save the patrol-specific data
      if (patrol_officer && user.role === 'PATROL_OFFICER') {
        await storage.setItem('patrol_auth_token', token);
        await storage.setItem('patrol_auth_user', JSON.stringify(patrol_officer));
      }

      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  async saveSession(token: string, user: User): Promise<void> {
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(USER_KEY, JSON.stringify(user));
  },

  async logout(): Promise<void> {
    // Call server logout endpoint to revoke the Sanctum token
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore server errors during logout — local session will still be cleared
    }
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    await storage.removeItem('patrol_auth_token');
    await storage.removeItem('patrol_auth_user');
  }
};
