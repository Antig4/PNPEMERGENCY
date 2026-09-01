import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  Car,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Radio,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isStationUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      window.location.href = '/login';
    }
  };

  // Admin gets full navigation
  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/incidents', label: 'Incidents', icon: ShieldAlert },
    { to: '/admin/map', label: 'Live GIS Map', icon: MapPin },
    { to: '/admin/patrols', label: 'Patrol Units', icon: Car },
    { to: '/admin/stations', label: 'Police Stations', icon: Building2 },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Station user gets station-scoped navigation (no Stations management)
  const stationNavItems = [
    { to: '/station/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/station/incidents', label: 'Incidents', icon: ShieldAlert },
    { to: '/station/map', label: 'Live GIS Map', icon: MapPin },
    { to: '/station/patrols', label: 'Patrol Units', icon: Car },
    { to: '/station/reports', label: 'Reports', icon: BarChart3 },
    { to: '/station/profile', label: 'Station Profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : stationNavItems;

  const stationName = user?.station?.station_name || user?.station?.name || '';
  const roleLabel = isAdmin ? 'Command Center' : 'Station Dashboard';
  const roleColor = isAdmin ? 'text-blue-400' : 'text-indigo-400';
  const iconBg = isAdmin ? 'bg-blue-600/20 border-blue-500/30 text-blue-500' : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-500';
  const activeClass = isAdmin
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg ${iconBg}`}>
            {isStationUser ? <Building2 className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-white tracking-wide">PNP EmergencyLink</h1>
            </div>
            <p className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${roleColor}`}>
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> {roleLabel}
            </p>
          </div>
        </div>

        {/* Station Name Banner (for Station Users) */}
        {isStationUser && stationName && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Assigned Station</p>
            <p className="text-xs font-bold text-white mt-0.5 leading-tight">{stationName}</p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? activeClass
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className={`w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs ${isAdmin ? 'text-blue-400' : 'text-indigo-400'}`}>
            {user?.fullName?.substring(0, 2).toUpperCase() || (isAdmin ? 'AD' : 'ST')}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.fullName || (isAdmin ? 'Administrator' : 'Station Officer')}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
};
