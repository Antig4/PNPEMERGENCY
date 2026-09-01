import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { incidentService } from '../services/incidentService';
import { patrolService } from '../services/patrolService';
import { stationService } from '../services/stationService';
import { Incident, IncidentFilters, PatrolOfficer, PoliceStation } from '../types';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { ShieldAlert, Filter, Eye, Search, Trash2 } from 'lucide-react';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter, stationFilter, dateFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters: IncidentFilters = {
        status: statusFilter,
        emergencyType: typeFilter,
        stationId: stationFilter,
        dateRange: dateFilter,
      };
      const [incList, patList, stnList] = await Promise.all([
        incidentService.getIncidents(filters),
        patrolService.getPatrols(),
        stationService.getStations(),
      ]);
      setIncidents(incList);
      setPatrols(patList);
      setStations(stnList);
    } catch (e) {
      console.warn('Incidents fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm('Permanently delete this incident record? This action CANNOT be undone.')) return;
    setDeletingId(id);
    try {
      await incidentService.deleteIncident(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete incident.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      inc.referenceNumber.toLowerCase().includes(query) ||
      inc.emergencyType.toLowerCase().includes(query) ||
      (inc.citizenName && inc.citizenName.toLowerCase().includes(query)) ||
      (inc.assignedPatrolName && inc.assignedPatrolName.toLowerCase().includes(query))
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'RESOLVED':   return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'CANCELLED':  return 'bg-slate-500/20  text-slate-400  border-slate-500/30';
      case 'RESPONDING': return 'bg-blue-500/10   text-blue-300   border-blue-500/30';
      case 'ON_SCENE':   return 'bg-amber-500/10  text-amber-300  border-amber-500/30';
      case 'NOTIFIED':   return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'ACCEPTED':   return 'bg-cyan-500/10   text-cyan-300   border-cyan-500/30';
      default:           return 'bg-red-500/10    text-red-300    border-red-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header
        title="Incident Operations Log"
        subtitle="Comprehensive Emergency Incident Records & Operational Tracking"
        onRefresh={loadData}
        isRefreshing={isLoading}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filter Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-400" /> FILTERS:
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, citizen, patrol unit..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Status: All</option>
            <option value="NEW">NEW</option>
            <option value="NOTIFIED">NOTIFIED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="RESPONDING">RESPONDING</option>
            <option value="ON_SCENE">ON SCENE</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Type: All</option>
            <option value="CRIME_POLICE">Crime / Police</option>
            <option value="MEDICAL">Medical</option>
            <option value="FIRE_RESCUE">Fire / Rescue</option>
          </select>

          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Station: All</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.stationName}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Date: All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
          </select>
        </div>

        {/* Incident Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Emergency Type</th>
                  <th className="py-3.5 px-4">Informant</th>
                  <th className="py-3.5 px-4">Station</th>
                  <th className="py-3.5 px-4">Assigned Patrol</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Time Reported</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((inc) => {
                    const isDeletable = inc.status === 'RESOLVED' || inc.status === 'CANCELLED';
                    const isDeleting = deletingId === inc.id;
                    return (
                      <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-black text-white font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${isDeletable ? 'text-slate-500' : 'text-red-400'}`} />
                            {inc.referenceNumber}
                            {inc.responderType === 'STATION' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                FLOW B
                              </span>
                            )}
                            {(inc.photoUrl || inc.videoUrl) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                {inc.photoUrl && inc.videoUrl ? '📎' : inc.photoUrl ? '📸' : '🎥'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold">{inc.emergencyType}</td>
                        <td className="py-3.5 px-4">{inc.citizenName}</td>
                        <td className="py-3.5 px-4 text-slate-300">{inc.assignedStationName || 'Station Desk'}</td>
                        <td className="py-3.5 px-4 text-blue-400 font-bold">
                          {inc.assignedPatrolName || (inc.responderType === 'STATION' ? (
                            <span className="text-amber-400/80 text-[10px]">Station Desk</span>
                          ) : 'Pending')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadgeClass(inc.status)}`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {new Date(inc.reportedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedIncident(inc)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              VIEW
                            </button>
                            {isDeletable && (
                              <button
                                onClick={() => handleDeleteIncident(inc.id)}
                                disabled={isDeleting}
                                title="Permanently delete incident record"
                                className="px-3 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              >
                                {isDeleting
                                  ? <span className="animate-pulse w-3.5 h-3.5">⏳</span>
                                  : <Trash2 className="w-3.5 h-3.5" />}
                                {isDeleting ? 'DELETING' : 'DELETE'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      No matching emergency incidents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <IncidentDetailModal
        incident={selectedIncident}
        patrols={patrols}
        stations={stations}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={loadData}
        onVerify={async (id) => { await incidentService.verifyIncident(id); }}
        onCancel={async (id, reason) => { await incidentService.cancelIncident(id, reason); }}
        onReassign={async (id, patrolId, reason) => { await incidentService.reassignIncident(id, patrolId, reason); }}
        onRequestAssistance={async (id, stationId, notes) => { await incidentService.requestAssistance(id, stationId, notes); }}
        onDelete={async (id) => { await incidentService.deleteIncident(id); }}
      />
    </div>
  );
};
