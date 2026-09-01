import React from 'react';
import { Radio, RefreshCw, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>LIVE MONITORED</span>
        </div>

        {/* Sync / Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh GIS & Incident Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        {/* Timestamp */}
        {lastUpdated && (
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  );
};
