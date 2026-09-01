import { api } from './api';
import { DashboardStats } from '../types';

export const dashboardService = {
  async getStatistics(): Promise<DashboardStats> {
    const res = await api.get('/admin/dashboard/stats');
    const raw = res.data.data;
    return {
      totalIncidents: raw.total_incidents,
      activeIncidents: raw.active_incidents,
      responding: raw.responding,
      onScene: raw.on_scene,
      resolvedToday: raw.resolved_today,
      availablePatrols: raw.available_patrols,
    };
  },
};
