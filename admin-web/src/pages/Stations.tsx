import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { stationService } from '../services/stationService';
import { PoliceStation } from '../types';
import { Building2, Car, ShieldAlert, Phone, MapPin } from 'lucide-react';

export const Stations: React.FC = () => {
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setIsLoading(true);
    try {
      const data = await stationService.getStations();
      setStations(data);
    } catch (e) {
      console.warn('Stations fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Police Station Operational Desks"
        subtitle="Station Fleet Capacity, Active Duty Units & Sector Metrics"
        onRefresh={loadStations}
        isRefreshing={isLoading}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div
              key={station.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {station.stationCode}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">{station.stationName}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {station.address}
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {station.contactNumber}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/60 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-slate-400">TOTAL UNITS</p>
                  <p className="text-base font-black text-white">{station.totalPatrols}</p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-emerald-400">AVAILABLE</p>
                  <p className="text-base font-black text-emerald-400">{station.availablePatrols}</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-amber-400">ACTIVE</p>
                  <p className="text-base font-black text-amber-400">{station.activeIncidents}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
