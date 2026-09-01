import React from 'react';
import { Header } from '../components/Header';
import { Settings as SettingsIcon, Shield, Database, Radio, Bell } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Command Center System Settings"
        subtitle="Backend Configuration, GIS Spatial Drivers & API Endpoint Settings"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-sm font-black text-white">Central System Information</h3>
              <p className="text-xs text-slate-400">PNP EmergencyLink Thesis Prototype Build 1.0.0</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">Backend Architecture</span>
              <span className="text-white font-mono bg-slate-800 px-3 py-1 rounded-lg">Laravel 13 REST API + Sanctum</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">Spatial Database</span>
              <span className="text-emerald-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">PostgreSQL + PostGIS (ST_Distance)</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">Web GIS Engine</span>
              <span className="text-blue-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">Leaflet OpenStreetMap Dark Theme</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 font-bold">API Base Endpoint</span>
              <span className="text-slate-300 font-mono bg-slate-800 px-3 py-1 rounded-lg">http://localhost:8000/api</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
