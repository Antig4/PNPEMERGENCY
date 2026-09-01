import { PatrolOfficer, PatrolStatus, PatrolOfficerStats } from '../types/patrol';
import { patrolAuthService } from './patrolAuthService';
import { api } from './api';

export const patrolService = {
  /**
   * Update patrol officer availability status (e.g. AVAILABLE -> OFF_DUTY or RESPONDING)
   * Interfaces with PATCH /api/patrol/status
   */
  async updateStatus(officer: PatrolOfficer, newStatus: PatrolStatus): Promise<PatrolOfficer> {
    try {
      await api.request<{ success: boolean }>('/patrol/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      const updatedOfficer: PatrolOfficer = {
        ...officer,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await patrolAuthService.updateStoredOfficer(updatedOfficer);
      return updatedOfficer;
    } catch (e) {
      console.error('[patrolService] updateStatus error:', e);
      // Gracefully return updated local state even if API fails
      const updatedOfficer: PatrolOfficer = { ...officer, status: newStatus, updatedAt: new Date().toISOString() };
      return updatedOfficer;
    }
  },

  /**
   * Fetch officer stats (Today's Total, Resolved, Active)
   */
  async getOfficerStats(officerId: string): Promise<PatrolOfficerStats> {
    try {
      const res = await api.request<{ success: boolean; data: { today_total: number; resolved: number; active: number } }>('/patrol/stats');
      if (res && res.data) {
        return {
          todayTotal: res.data.today_total,
          resolved: res.data.resolved,
          active: res.data.active,
        };
      }
    } catch (e) {
      console.warn('[patrolService] getOfficerStats API error, calculating from history:', e);
    }

    try {
      const { patrolIncidentService } = await import('./patrolIncidentService');
      const history = await patrolIncidentService.getPatrolHistory(officerId);
      const active = await patrolIncidentService.getActiveIncident();
      return {
        todayTotal: history.length,
        resolved: history.filter(i => i.status === 'RESOLVED').length,
        active: active ? 1 : 0,
      };
    } catch (_) {
      return { todayTotal: 0, resolved: 0, active: 0 };
    }
  }
};
