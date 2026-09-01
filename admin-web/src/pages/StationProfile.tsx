import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { stationService } from '../services/stationService';
import { Building2, Phone, MapPin, RefreshCw, Car, ShieldAlert } from 'lucide-react';

export const StationProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await stationService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error('Failed to fetch station profile:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const station = profile?.station || user?.station;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
      <Header title="Station Profile" subtitle="Station information and assignment" />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            {/* Officer Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg">
                  {user?.fullName?.substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{user?.fullName}</h2>
                  <p className="text-sm text-indigo-400 font-bold">Station Officer</p>
                  <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Station Info */}
            {station && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">Assigned Police Station</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Station Name</p>
                    <p className="text-base font-black text-white mt-0.5">{station.station_name || station.name}</p>
                  </div>
                  {station.station_code && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Station Code</p>
                      <p className="text-sm font-mono font-bold text-indigo-400 mt-0.5">{station.station_code}</p>
                    </div>
                  )}
                  {station.address && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address</p>
                      <p className="text-sm text-slate-300 mt-0.5 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        {station.address}
                      </p>
                    </div>
                  )}
                  {station.contact_number && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</p>
                      <p className="text-sm text-slate-300 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {station.contact_number}
                      </p>
                    </div>
                  )}
                  {(station.latitude && station.longitude) && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Station Coordinates</p>
                      <p className="text-sm font-mono text-slate-300 mt-0.5">
                        {station.latitude}, {station.longitude}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Access Notice */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-400 mb-1">Access Scope</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account has access to incidents, patrols, and GIS data belonging to{' '}
                <span className="text-white font-bold">{station?.station_name || station?.name || 'your station'}</span> only.
                For cross-station access, contact the Admin Command Center.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
