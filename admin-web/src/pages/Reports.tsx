import React from 'react';
import { Header } from '../components/Header';
import { BarChart3, TrendingUp, ShieldCheck, Clock, FileSpreadsheet } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Incident Analytics & Operations Reports"
        subtitle="Historical Response Performance, Incident Densities & Police Sector Reports"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Avg Response Time</p>
              <h3 className="text-2xl font-black text-white">4.2 Mins</h3>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">↓ 1.1 min faster than benchmark</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Resolution Success Rate</p>
              <h3 className="text-2xl font-black text-emerald-400">96.8%</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">92 / 95 Incidents Closed</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Monthly Peak Category</p>
              <h3 className="text-xl font-black text-white">Crime / Police</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">64% of total emergency dispatches</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto" />
          <div>
            <h3 className="text-lg font-black text-white">Export Official PNP Emergency Reports</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Generate standardized executive summaries for District Headquarters, Station Commanders, and Municipal Law Enforcement.
            </p>
          </div>
          <button className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 transition-all">
            EXPORT EXCEL / PDF REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
