import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { stationService } from '../services/stationService';
import { Incident, PatrolOfficer, StationDashboardStats } from '../types';
import {
  ShieldAlert, Car, MapPin, CheckCircle2, Clock, AlertTriangle, Building2,
  RefreshCw, ChevronRight, Activity
} from 'lucide-react';

const EMERGENCY_LABELS: Record<string, string> = {
  CRIME_POLICE: 'Crime / Police',
  MEDICAL: 'Medical Emergency',
  FIRE_RESCUE: 'Fire / Rescue',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  NOTIFIED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  ACCEPTED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  RESPONDING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  ON_SCENE: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const PATROL_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  RESPONDING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  ON_SCENE: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  OFF_DUTY: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  OFFLINE: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const StationDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StationDashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        stationService.getDashboard(),
        stationService.getIncidents(),
        stationService.getPatrols(),
      ]);

      if (results[0].status === 'fulfilled') {
        setStats(results[0].value.stats);
      } else {
        console.error('getDashboard failed:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setIncidents(results[1].value.slice(0, 5));
      } else {
        console.error('getIncidents failed:', results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        setPatrols(results[2].value);
      } else {
        console.error('getPatrols failed:', results[2].reason);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error('Station dashboard fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stationName = user?.station?.station_name || user?.station?.name || 'Your Station';

  const statCards = [
    {
      label: 'Active Incidents',
      value: stats?.active_incidents ?? '—',
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'New Reports',
      value: stats?.new_reports ?? '—',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      label: 'Responding',
      value: stats?.responding ?? '—',
      icon: Car,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'On Scene',
      value: stats?.on_scene ?? '—',
      icon: MapPin,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Available Patrols',
      value: stats?.available_patrols ?? '—',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Resolved Today',
      value: stats?.resolved_today ?? '—',
      icon: Activity,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-mono">Loading Station Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
      <Header
        title="Station Dashboard"
        subtitle={stationName}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Station Identity Banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Station Dashboard</p>
            <h2 className="text-base font-black text-white">{stationName}</h2>
          </div>
          <div className="ml-auto flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-tight">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Live Incident Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-black text-white">Live Incident Feed</h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  Station Only
                </span>
              </div>
              <button
                onClick={() => navigate('/station/incidents')}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {incidents.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  No active incidents for your station.
                </div>
              ) : (
                incidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => navigate(`/station/incidents/${inc.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-black text-white font-mono">{inc.referenceNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[inc.status] || STATUS_COLORS.NEW}`}>
                            {inc.status}
                          </span>
                          {inc.responderType === 'STATION' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              FLOW B
                            </span>
                          )}
                          {inc.responderType === 'PATROL' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                              PATROL
                            </span>
                          )}
                          {(inc.photoUrl || inc.videoUrl) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              {inc.photoUrl && inc.videoUrl ? '📎 Media' : inc.photoUrl ? '📸 Photo' : '🎥 Video'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-300">{EMERGENCY_LABELS[inc.emergencyType] || inc.emergencyType}</p>
                        {inc.assignedPatrolName ? (
                          <p className="text-[11px] text-slate-500 mt-0.5">Patrol: {inc.assignedPatrolName}</p>
                        ) : inc.responderType === 'STATION' ? (
                          <p className="text-[11px] text-amber-500/70 mt-0.5">⚠ Awaiting patrol dispatch from desk</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Patrol Status Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black text-white">Patrol Status</h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  Station Only
                </span>
              </div>
              <button
                onClick={() => navigate('/station/patrols')}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {patrols.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  No patrol officers assigned to this station.
                </div>
              ) : (
                patrols.map((patrol) => (
                  <div key={patrol.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white">{patrol.unitName || patrol.badgeNumber}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{patrol.badgeNumber}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${PATROL_STATUS_COLORS[patrol.availabilityStatus] || PATROL_STATUS_COLORS.OFFLINE}`}>
                        {patrol.availabilityStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
