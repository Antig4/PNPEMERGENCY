import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Radio, AlertCircle, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      // Route by role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STATION_USER') {
        navigate('/station/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background decorative glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500 mx-auto mb-4 shadow-lg shadow-blue-600/10">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PNP EmergencyLink</h1>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> COMMAND CENTER
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium p-3.5 rounded-2xl mb-6 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@emergencylink.ph"
                autoComplete="username"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>

        {/* Role hint cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setEmail('admin@emergencylink.ph'); setPassword('adminpass123'); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/40 hover:bg-slate-800 transition-all text-left group"
          >
            <Shield className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin</p>
              <p className="text-[10px] text-slate-500">Command Center</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => { setEmail('station1@emergencylink.ph'); setPassword('stationpass123'); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800 transition-all text-left group"
          >
            <Building2 className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Station</p>
              <p className="text-[10px] text-slate-500">Station Dashboard</p>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Authorized Personnel Only • Philippine National Police
          </p>
        </div>
      </div>
    </div>
  );
};
