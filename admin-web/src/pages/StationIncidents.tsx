import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { stationService } from '../services/stationService';
import { Incident, PatrolOfficer } from '../types';
import { ShieldAlert, RefreshCw, ChevronLeft, Clock, MapPin, User, Car, CheckCircle2, Shield, Building2, AlertTriangle, Send } from 'lucide-react';
import { NotificationToast } from '../components/NotificationToast';

const EMERGENCY_LABELS: Record<string, string> = {
  CRIME_POLICE: 'Crime / Police',
  MEDICAL: 'Medical Emergency',
  FIRE_RESCUE: 'Fire / Rescue',
};

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  NEW:        { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',   dot: 'bg-yellow-500' },
  NOTIFIED:   { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',   dot: 'bg-orange-500' },
  ACCEPTED:   { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',          dot: 'bg-blue-500' },
  RESPONDING: { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',   dot: 'bg-indigo-500' },
  ON_SCENE:   { color: 'bg-violet-500/10 text-violet-400 border-violet-500/30',   dot: 'bg-violet-500' },
  RESOLVED:   { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  CANCELLED:  { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',      dot: 'bg-slate-500' },
};

const FILTER_OPTIONS = ['ALL', 'NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE', 'RESOLVED'];

const safeFormatTime = (val: any) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

const safeFormatDateTime = (val: any) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch {
    return '—';
  }
};

// Incident Detail Panel
const IncidentDetailPanel: React.FC<{ incidentId: string; onBack: () => void }> = ({ incidentId, onBack }) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [patrols, setPatrols] = useState<PatrolOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('');
  const [toast, setToast] = useState<{ id: string; type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'; title: string; message: string } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'photo' | 'video'; url: string; timestamp: string; lat: number; lng: number } | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await stationService.getIncidentDetail(incidentId);
      setIncident(data);
      setFetchError(null);
    } catch (e: any) {
      console.error('Failed to fetch incident:', e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to load incident details.';
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  const fetchPatrols = useCallback(async () => {
    try {
      const data = await stationService.getPatrols();
      setPatrols(data);
    } catch (e) {
      console.error('Failed to fetch patrols:', e);
    }
  }, []);

  useEffect(() => {
    fetch();
    fetchPatrols();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [fetch, fetchPatrols]);

  const handleDispatch = async () => {
    if (!incident || !selectedPatrolId) return;
    setIsDispatching(true);
    try {
      const updated = await stationService.dispatchPatrol(incident.id, selectedPatrolId);
      setIncident(updated);
      setToast({
        id: String(Date.now()),
        type: 'SUCCESS',
        title: 'Patrol Officer Dispatched',
        message: 'The selected patrol officer has been successfully assigned to this incident.',
      });
      setSelectedPatrolId('');
    } catch (e: any) {
      console.error('Dispatch failed:', e);
      setToast({
        id: String(Date.now()),
        type: 'ERROR',
        title: 'Unable to Dispatch Patrol',
        message: e?.response?.data?.message || 'The system could not complete patrol assignment. Please try again.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 min-h-[400px]">
      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
      <p className="text-xs font-bold font-mono tracking-widest uppercase">Loading Incident Details...</p>
    </div>
  );

  if (fetchError) return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">Unable to Load Incident</h3>
      <p className="text-xs text-red-400 max-w-sm mb-2 font-mono">{fetchError}</p>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        Check that you are logged in as the correct station user and that this incident is assigned to your station.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => { setIsLoading(true); setFetchError(null); fetch(); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> RETRY
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> BACK TO LIST
        </button>
      </div>
    </div>
  );

  if (!incident) return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">Incident Record Not Found</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        This incident may have been deleted, re-assigned to another station, or you do not have permission to view it.
      </p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
      >
        <ChevronLeft className="w-4 h-4" /> RETURN TO INCIDENTS LIST
      </button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.NEW;
  const isStationResponder = incident.responderType === 'STATION';
  const canDispatch = ['NEW', 'NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE'].includes(incident.status);

  return (
    <div className="h-full overflow-y-auto p-6">
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Incidents
      </button>

      <div className="max-w-2xl space-y-5">
        {/* Reference & Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-white font-mono">{incident.referenceNumber}</h2>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
              {incident.status}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-300 mb-2">{EMERGENCY_LABELS[incident.emergencyType] || incident.emergencyType}</p>

          {/* Responder Type Badge */}
          <div className="flex items-center gap-2 mt-2">
            {isStationResponder ? (
              <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Building2 className="w-3 h-3" /> FLOW B — STATION DESK HANDLING
              </span>
            ) : incident.responderType === 'PATROL' ? (
              <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" /> FLOW A — PATROL DISPATCHED
              </span>
            ) : null}
          </div>

          {/* Citizen Description */}
          {incident.description && (
            <div className="mt-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Citizen Notes</p>
              <p className="text-sm text-slate-300 leading-relaxed">{incident.description}</p>
            </div>
          )}

          {/* Decline Reason */}
          {incident.declineReason && (
            <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Patrol Decline Reason</p>
              </div>
              <p className="text-sm text-red-300">{incident.declineReason}</p>
            </div>
          )}

          {/* Evidence Attachments */}
          <div className="mt-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                EVIDENCE ATTACHMENTS ({(incident.photoUrl ? 1 : 0) + (incident.videoUrl ? 1 : 0)})
              </h4>
              {(incident.photoUrl || incident.videoUrl) && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  VERIFIED MANDATORY EVIDENCE
                </span>
              )}
            </div>

            {!(incident.photoUrl || incident.videoUrl) ? (
              <p className="text-xs text-slate-500 italic py-1">No evidence attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {incident.photoUrl && (
                  <div
                    onClick={() => setPreviewMedia({ type: 'photo', url: incident.photoUrl!, timestamp: incident.reportedAt, lat: Number(incident.latitude) || 0, lng: Number(incident.longitude) || 0 })}
                    className="group cursor-pointer bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 space-y-2 transition-all"
                  >
                    <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={incident.photoUrl} alt="Evidence photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2 left-2 bg-slate-950/80 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded border border-emerald-500/30">
                        PHOTO
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Evidence 1 (PHOTO)</p>
                      <p className="text-[10px] text-slate-400">Captured: {incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : 'N/A'}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">GPS: {(Number(incident.latitude) || 0).toFixed(5)}, {(Number(incident.longitude) || 0).toFixed(5)}</p>
                    </div>
                  </div>
                )}

                {incident.videoUrl && (
                  <div
                    onClick={() => setPreviewMedia({ type: 'video', url: incident.videoUrl!, timestamp: incident.reportedAt, lat: Number(incident.latitude) || 0, lng: Number(incident.longitude) || 0 })}
                    className="group cursor-pointer bg-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-xl p-3 space-y-2 transition-all"
                  >
                    <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                      <video src={incident.videoUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-600/90 text-white flex items-center justify-center font-bold text-xs">
                          ▶
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 bg-slate-950/80 text-purple-400 font-extrabold text-[9px] px-2 py-0.5 rounded border border-purple-500/30">
                        VIDEO
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Evidence 2 (VIDEO)</p>
                      <p className="text-[10px] text-slate-400">Captured: {incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : 'N/A'}</p>
                      <p className="text-[10px] text-purple-400 font-mono">GPS: {(Number(incident.latitude) || 0).toFixed(5)}, {(Number(incident.longitude) || 0).toFixed(5)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evidence Preview Lightbox Modal */}
          {previewMedia && (
            <div className="fixed inset-0 z-[10010] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      EVIDENCE PREVIEW — {previewMedia.type.toUpperCase()}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Captured: {previewMedia.timestamp ? new Date(previewMedia.timestamp).toLocaleString() : 'N/A'} | GPS: {(Number(previewMedia.lat) || 0).toFixed(5)}, {(Number(previewMedia.lng) || 0).toFixed(5)}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewMedia(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="p-4 flex-1 flex items-center justify-center bg-black overflow-hidden min-h-[300px]">
                  {previewMedia.type === 'photo' ? (
                    <img src={previewMedia.url} alt="Evidence" className="max-h-[65vh] w-auto object-contain rounded-lg" />
                  ) : (
                    <video src={previewMedia.url} controls autoPlay className="max-h-[65vh] w-full rounded-lg" />
                  )}
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">Incident #{incident.referenceNumber}</span>
                  <button
                    onClick={() => setPreviewMedia(null)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    CLOSE PREVIEW
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dispatch Patrol Panel (Flow B — Station is responder) */}
        {canDispatch && (
          <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Dispatch Available Patrol</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              This incident is routed to your station desk. Select an available patrol officer to dispatch on-field.
            </p>

            {patrols.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                No available patrol officers at this time.
              </div>
            ) : (
              <div className="flex gap-3">
                <select
                  value={selectedPatrolId}
                  onChange={e => setSelectedPatrolId(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Select patrol officer —</option>
                  {patrols.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.officerName} • {p.badgeNumber} • {p.unitName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDispatch}
                  disabled={!selectedPatrolId || isDispatching}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  {isDispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  DISPATCH
                </button>
              </div>
            )}
          </div>
        )}

        {/* Incident Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Incident Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {safeFormatDateTime(incident.reportedAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</p>
              <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                {(Number(incident.latitude) || 0).toFixed(5)}, {(Number(incident.longitude) || 0).toFixed(5)}
              </p>
            </div>
            {incident.assignedPatrolName && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Patrol</p>
                <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1">
                  <Car className="w-3 h-3 text-indigo-400" />
                  {incident.assignedPatrolName}
                </p>
              </div>
            )}
            {incident.assignedPatrolBadge && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badge Number</p>
                <p className="text-sm font-mono font-semibold text-white mt-0.5">{incident.assignedPatrolBadge}</p>
              </div>
            )}
            {incident.assignedStationName && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Station</p>
                <p className="text-sm font-semibold text-white mt-0.5">{incident.assignedStationName}</p>
              </div>
            )}
            {incident.citizenName && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reporter</p>
                <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {incident.citizenName}
                </p>
              </div>
            )}
            {incident.citizenMobile && incident.citizenMobile !== 'N/A' && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Citizen Contact</p>
                <p className="text-sm font-mono font-semibold text-white mt-0.5">{incident.citizenMobile}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {incident.statusHistory && incident.statusHistory.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Incident Timeline</h3>
            <div className="space-y-3">
              {incident.statusHistory.map((entry, idx) => {
                const cfg = STATUS_CONFIG[entry.newStatus] || STATUS_CONFIG.NEW;
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${cfg.dot}`} />
                      {idx < (incident.statusHistory?.length ?? 0) - 1 && (
                        <div className="w-px h-full bg-slate-700 mt-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          {entry.newStatus}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono shrink-0">
                          {safeFormatTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.remarks && (
                        <p className="text-[11px] text-slate-500 mt-1">{entry.remarks}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolution (if resolved) */}
        {incident.status === 'RESOLVED' && incident.resolutionSummary && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resolution</h3>
            </div>
            <p className="text-sm text-slate-300">{incident.resolutionSummary}</p>
            {incident.resolutionOutcome && (
              <p className="text-xs text-emerald-400 font-bold mt-1">{incident.resolutionOutcome}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const StationIncidents: React.FC = () => {
  const navigate = useNavigate();
  const { id: selectedId } = useParams<{ id: string }>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchIncidents = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const data = await stationService.getIncidents(filter !== 'ALL' ? filter : undefined);
      setIncidents(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch station incidents:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  if (selectedId) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        <Header title="Incident Detail" subtitle="Station View" />
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <IncidentDetailPanel incidentId={selectedId} onBack={() => navigate('/station/incidents')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
      <Header
        title="Station Incidents"
        subtitle="Your station incidents only"
        onRefresh={() => fetchIncidents(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 flex gap-2 overflow-x-auto">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Incidents Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold">No incidents found for your station.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Type</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Patrol</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Reported</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {incidents.map((inc) => {
                    const statusCfg = STATUS_CONFIG[inc.status] || STATUS_CONFIG.NEW;
                    return (
                      <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-white text-xs">{inc.referenceNumber}</td>
                        <td className="px-5 py-4 text-slate-300 text-xs font-semibold">
                          {EMERGENCY_LABELS[inc.emergencyType] || inc.emergencyType}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell">
                          {inc.assignedPatrolName || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusCfg.color}`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono hidden lg:table-cell">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {safeFormatTime(inc.reportedAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => navigate(`/station/incidents/${inc.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-[11px] font-bold border border-indigo-500/30 transition-colors"
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
