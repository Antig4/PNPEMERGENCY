import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { patrolService } from '../services/patrolService';
import { PatrolOfficer } from '../types';
import { Car, MapPin, Radio, Shield, Clock } from 'lucide-react';

export const Patrols: React.FC = () => {
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPatrols();
  }, []);

  const loadPatrols = async () => {
    setIsLoading(true);
    try {
      const data = await patrolService.getPatrols();
      setPatrols(data);
    } catch (e) {
      console.warn('Patrols fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'RESPONDING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'ON_SCENE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Mobile Patrol Units"
        subtitle="Patrol Officers Availability, Duty Status & GPS Tracking"
        onRefresh={loadPatrols}
        isRefreshing={isLoading}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3.5 px-4">Patrol Unit</th>
                  <th className="py-3.5 px-4">Officer Name</th>
                  <th className="py-3.5 px-4">Badge Number</th>
                  <th className="py-3.5 px-4">Assigned Station</th>
                  <th className="py-3.5 px-4">Availability Status</th>
                  <th className="py-3.5 px-4">Latest GPS Coordinates</th>
                  <th className="py-3.5 px-4">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {patrols.length > 0 ? (
                  patrols.map((patrol) => (
                    <tr key={patrol.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-black text-white flex items-center gap-2">
                        <Car className="w-4 h-4 text-emerald-400" />
                        <span>{patrol.unitName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">{patrol.officerName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{patrol.badgeNumber}</td>
                      <td className="py-3.5 px-4 text-slate-300">{patrol.stationName}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(patrol.availabilityStatus)}`}>
                          {patrol.availabilityStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        {patrol.currentLatitude && patrol.currentLongitude
                          ? `${(Number(patrol.currentLatitude) || 0).toFixed(4)}, ${(Number(patrol.currentLongitude) || 0).toFixed(4)}`
                          : 'Location Unavailable'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {patrol.locationUpdatedAt ? new Date(patrol.locationUpdatedAt).toLocaleTimeString() : 'Active'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      No patrol officers registered in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
