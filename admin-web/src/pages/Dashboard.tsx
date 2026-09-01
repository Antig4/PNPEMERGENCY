import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { LiveGISMap } from '../components/LiveGISMap';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { dashboardService } from '../services/dashboardService';
import { incidentService } from '../services/incidentService';
import { patrolService } from '../services/patrolService';
import { stationService } from '../services/stationService';
import { DashboardStats, Incident, PatrolOfficer, PoliceStation } from '../types';
import {
  ShieldAlert,
  Car,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  Radio,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    activeIncidents: 0,
    responding: 0,
    onScene: 0,
    resolvedToday: 0,
    availablePatrols: 0,
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAllDashboardData();
    // Poll data every 3 seconds for real-time monitoring updates
    const interval = setInterval(loadAllDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAllDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [st, incList, patList, stnList] = await Promise.all([
        dashboardService.getStatistics(),
        incidentService.getIncidents(),
        patrolService.getPatrols(),
        stationService.getStations(),
      ]);
      setStats(st);
      setIncidents(incList);
      setPatrols(patList);
      setStations(stnList);
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const statCards = [
    { label: 'TOTAL INCIDENTS', val: stats.totalIncidents, color: 'text-white', bg: 'bg-slate-800/80', border: 'border-slate-700' },
    { label: 'ACTIVE INCIDENTS', val: stats.activeIncidents, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { label: 'RESPONDING', val: stats.responding, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { label: 'ON SCENE', val: stats.onScene, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { label: 'RESOLVED TODAY', val: stats.resolvedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { label: 'AVAILABLE PATROLS', val: stats.availablePatrols, color: 'text-emerald-400', bg: 'bg-slate-800/80', border: 'border-emerald-500/30' },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Admin Command Center Dashboard"
        subtitle="Real-time PNP Emergency Incident Dispatch & Spatial Patrol Monitoring"
        onRefresh={loadAllDashboardData}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 1. Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.bg} border ${card.border} rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-transform hover:-translate-y-0.5`}
            >
              <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                {card.label}
              </p>
              <h3 className={`text-2xl font-black ${card.color} tracking-tight`}>{card.val}</h3>
            </div>
          ))}
        </div>

        {/* 2. Main GIS Map & Live Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[620px]">
          {/* GIS Map Panel (3/4 width) */}
          <div className="lg:col-span-3 h-full flex flex-col">
            <LiveGISMap
              incidents={incidents}
              patrols={patrols}
              stations={stations}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              enableHeatmap={false}
            />
          </div>

          {/* Live Incident Feed Panel (1/4 width) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider">
                <Radio className="w-4 h-4 animate-pulse" /> LIVE EMERGENCY FEED
              </div>
              <span className="text-[10px] font-mono text-slate-500">{incidents.length} Records</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/60 rounded-xl p-3 cursor-pointer transition-all hover:bg-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> {inc.referenceNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-200">{inc.emergencyType}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Station: {inc.assignedStationName || 'Station Desk'}</span>
                      <span className="font-mono">{new Date(inc.reportedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                  No active emergency incidents recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Side Panel */}
      <IncidentDetailModal
        incident={selectedIncident}
        patrols={patrols}
        stations={stations}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={loadAllDashboardData}
        onVerify={async (id) => {
          await incidentService.verifyIncident(id);
        }}
        onCancel={async (id, reason) => {
          await incidentService.cancelIncident(id, reason);
        }}
        onReassign={async (id, patrolId, reason) => {
          await incidentService.reassignIncident(id, patrolId, reason);
        }}
        onRequestAssistance={async (id, stationId, notes) => {
          await incidentService.requestAssistance(id, stationId, notes);
        }}
        onDelete={async (id) => {
          await incidentService.deleteIncident(id);
        }}
      />
    </div>
  );
};
