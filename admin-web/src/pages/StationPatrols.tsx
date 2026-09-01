import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { stationService } from '../services/stationService';
import { PatrolOfficer } from '../types';
import { Car, RefreshCw, MapPin, ShieldAlert } from 'lucide-react';

const AVAILABILITY_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  AVAILABLE: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Available' },
  RESPONDING: { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-500', label: 'Responding' },
  ON_SCENE: { color: 'bg-violet-500/10 text-violet-400 border-violet-500/30', dot: 'bg-violet-500', label: 'On Scene' },
  OFF_DUTY: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-500', label: 'Off Duty' },
  OFFLINE: { color: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-500', label: 'Offline' },
};

export const StationPatrols: React.FC = () => {
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPatrols = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const data = await stationService.getPatrols();
      setPatrols(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch station patrols:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatrols();
    const interval = setInterval(fetchPatrols, 5000);
    return () => clearInterval(interval);
  }, [fetchPatrols]);

  const available = patrols.filter(p => p.availabilityStatus === 'AVAILABLE').length;
  const responding = patrols.filter(p => p.availabilityStatus === 'RESPONDING').length;
  const onScene = patrols.filter(p => p.availabilityStatus === 'ON_SCENE').length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
      <Header
        title="Station Patrols"
        subtitle="Your station patrol officers only"
        onRefresh={() => fetchPatrols(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">{available}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Available</p>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-indigo-400">{responding}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Responding</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-violet-400">{onScene}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">On Scene</p>
          </div>
        </div>

        {/* Patrols Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : patrols.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Car className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-sm font-semibold">No patrol officers assigned to this station.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-white">Patrol Officers</h3>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{patrols.length} total</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patrol Unit</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badge</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Location</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {patrols.map((patrol) => {
                  const cfg = AVAILABILITY_CONFIG[patrol.availabilityStatus] || AVAILABILITY_CONFIG.OFFLINE;
                  return (
                    <tr key={patrol.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-black text-white">{patrol.unitName || `Unit ${patrol.badgeNumber}`}</p>
                        <p className="text-[11px] text-slate-500">{patrol.officerName}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-300">{patrol.badgeNumber}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${cfg.dot} ${patrol.availabilityStatus === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {patrol.currentLatitude && patrol.currentLongitude ? (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {(Number(patrol.currentLatitude) || 0).toFixed(4)}, {(Number(patrol.currentLongitude) || 0).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 hidden lg:table-cell">
                        {patrol.locationUpdatedAt
                          ? new Date(patrol.locationUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
