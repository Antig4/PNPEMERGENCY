import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';

// Admin Pages
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { Patrols } from './pages/Patrols';
import { Stations } from './pages/Stations';
import { LiveMap } from './pages/LiveMap';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

// Station Pages
import { StationDashboard } from './pages/StationDashboard';
import { StationIncidents } from './pages/StationIncidents';
import { StationPatrols } from './pages/StationPatrols';
import { StationMap } from './pages/StationMap';
import { StationProfile } from './pages/StationProfile';

// ─── Loading Screen ────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold font-mono tracking-widest">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      LOADING COMMAND CENTER...
    </div>
  </div>
);

// ─── Protected Layout (shared for both roles) ──────────────────────────────────
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 select-none">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

// ─── Admin-Only Guard ──────────────────────────────────────────────────────────
const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/station/dashboard" replace />;
  return element;
};

// ─── Station-Only Guard ────────────────────────────────────────────────────────
const StationRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isStationUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStationUser) return <Navigate to="/admin/dashboard" replace />;
  return element;
};

// ─── Root Redirect: go to role-appropriate dashboard ──────────────────────────
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'STATION_USER') return <Navigate to="/station/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected Layout wraps all authenticated routes */}
        <Route element={<ProtectedLayout />}>
          {/* Root → role-based redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Legacy routes redirect to /admin/... */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/incidents" element={<Navigate to="/admin/incidents" replace />} />
          <Route path="/map" element={<Navigate to="/admin/map" replace />} />
          <Route path="/patrols" element={<Navigate to="/admin/patrols" replace />} />
          <Route path="/stations" element={<Navigate to="/admin/stations" replace />} />
          <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />

          {/* ── ADMIN ROUTES ── */}
          <Route path="/admin/dashboard" element={<AdminRoute element={<Dashboard />} />} />
          <Route path="/admin/incidents" element={<AdminRoute element={<Incidents />} />} />
          <Route path="/admin/incidents/:id" element={<AdminRoute element={<Incidents />} />} />
          <Route path="/admin/patrols" element={<AdminRoute element={<Patrols />} />} />
          <Route path="/admin/stations" element={<AdminRoute element={<Stations />} />} />
          <Route path="/admin/map" element={<AdminRoute element={<LiveMap />} />} />
          <Route path="/admin/reports" element={<AdminRoute element={<Reports />} />} />
          <Route path="/admin/settings" element={<AdminRoute element={<Settings />} />} />

          {/* ── STATION ROUTES ── */}
          <Route path="/station/dashboard" element={<StationRoute element={<StationDashboard />} />} />
          <Route path="/station/incidents" element={<StationRoute element={<StationIncidents />} />} />
          <Route path="/station/incidents/:id" element={<StationRoute element={<StationIncidents />} />} />
          <Route path="/station/patrols" element={<StationRoute element={<StationPatrols />} />} />
          <Route path="/station/map" element={<StationRoute element={<StationMap />} />} />
          <Route path="/station/reports" element={<StationRoute element={<Reports />} />} />
          <Route path="/station/profile" element={<StationRoute element={<StationProfile />} />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
