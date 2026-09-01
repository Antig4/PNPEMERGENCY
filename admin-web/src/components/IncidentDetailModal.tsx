import React, { useState } from 'react';
import { Incident, PatrolOfficer, PoliceStation } from '../types';
import {
  ShieldAlert,
  X,
  Clock,
  MapPin,
  User,
  Phone,
  Car,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Send,
  Trash2,
} from 'lucide-react';
import { ReassignModal } from './ReassignModal';
import { RequestAssistanceModal } from './RequestAssistanceModal';

interface IncidentDetailModalProps {
  incident: Incident | null;
  patrols: PatrolOfficer[];
  stations: PoliceStation[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onVerify: (id: string) => Promise<void>;
  onCancel: (id: string, reason: string) => Promise<void>;
  onReassign: (id: string, patrolId: string, reason: string) => Promise<void>;
  onRequestAssistance: (id: string, stationId: string, notes: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  patrols,
  stations,
  isOpen,
  onClose,
  onRefresh,
  onVerify,
  onCancel,
  onReassign,
  onRequestAssistance,
  onDelete,
}) => {
  const [showReassign, setShowReassign] = useState<boolean>(false);
  const [showAssistance, setShowAssistance] = useState<boolean>(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'photo' | 'video'; url: string; timestamp: string; lat: number; lng: number } | null>(null);

  if (!isOpen || !incident) return null;

  const steps = [
    { key: 'NEW', label: 'Report Created' },
    { key: 'NOTIFIED', label: 'Patrol Notified' },
    { key: 'ACCEPTED', label: 'Patrol Accepted' },
    { key: 'RESPONDING', label: 'En Route Responding' },
    { key: 'ON_SCENE', label: 'Arrived On Scene' },
    { key: 'RESOLVED', label: 'Incident Resolved' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'NEW': return 0;
      case 'NOTIFIED': return 1;
      case 'ACCEPTED': return 2;
      case 'RESPONDING': return 3;
      case 'ON_SCENE': return 4;
      case 'RESOLVED': return 5;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(incident.status);

  const handleVerify = async () => {
    setIsProcessing(true);
    try {
      await onVerify(incident.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to verify incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return;
    setIsProcessing(true);
    try {
      await onCancel(incident.id, cancelReason);
      setShowCancelPrompt(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsProcessing(true);
    try {
      await onDelete(incident.id);
      setShowDeleteConfirm(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{incident.referenceNumber}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {incident.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{incident.emergencyType}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Timeline */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4">INCIDENT DISPATCH TIMELINE</h4>
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-700">
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={step.key} className="relative flex items-center justify-between">
                      <div
                        className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                      <span className={`text-xs font-bold ${isCurrent ? 'text-blue-400' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>CITIZEN INFORMANT</span>
                </div>
                <p className="text-sm font-extrabold text-white">{incident.citizenName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" /> {incident.citizenMobile}
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>ASSIGNED PATROL</span>
                </div>
                <p className="text-sm font-extrabold text-white">{incident.assignedPatrolName || 'Unassigned'}</p>
                <p className="text-xs text-slate-400 font-mono">
                  Badge: {incident.assignedPatrolBadge || 'N/A'}
                </p>
              </div>
            </div>

            {/* Location & GPS Info */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>GIS TARGET LOCATION</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {(Number(incident.latitude) || 0).toFixed(5)}, {(Number(incident.longitude) || 0).toFixed(5)}
                </span>
              </div>
              <p className="text-xs text-slate-300">Station Area: <strong className="text-white">{incident.assignedStationName || 'Station Desk'}</strong></p>
            </div>

            {/* Citizen Notes */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">CITIZEN NOTES</h4>
              <p className="text-xs text-slate-300 italic">{incident.description ? `"${incident.description}"` : 'No additional notes provided.'}</p>
            </div>

            {/* Evidence Attachments Section */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  EVIDENCE ATTACHMENTS ({ (incident.photoUrl ? 1 : 0) + (incident.videoUrl ? 1 : 0) })
                </h4>
                {(incident.photoUrl || incident.videoUrl) && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    VERIFIED MANDATORY EVIDENCE
                  </span>
                )}
              </div>

              {!(incident.photoUrl || incident.videoUrl) ? (
                <p className="text-xs text-slate-500 italic py-2">No evidence attached.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Photo Evidence Card */}
                  {incident.photoUrl && (
                    <div
                      onClick={() => setPreviewMedia({ type: 'photo', url: incident.photoUrl!, timestamp: incident.reportedAt, lat: Number(incident.latitude) || 0, lng: Number(incident.longitude) || 0 })}
                      className="group cursor-pointer bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 space-y-2 transition-all"
                    >
                      <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={incident.photoUrl} alt="Photo Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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

                  {/* Video Evidence Card */}
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

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">ADMIN CONTROL ACTIONS</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowReassign(true)}
                  disabled={incident.status === 'RESOLVED' || incident.status === 'CANCELLED'}
                  className="py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <Car className="w-4 h-4" />
                  <span>REASSIGN PATROL</span>
                </button>

                <button
                  onClick={() => setShowAssistance(true)}
                  disabled={incident.status === 'RESOLVED' || incident.status === 'CANCELLED'}
                  className="py-3 px-4 rounded-xl bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span>REQUEST BACKUP</span>
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                {incident.flaggedForReview && (
                  <button
                    onClick={handleVerify}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>VERIFY & CLEAR</span>
                  </button>
                )}

                <button
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={incident.status === 'RESOLVED' || incident.status === 'CANCELLED'}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  <span>CANCEL INCIDENT</span>
                </button>
              </div>

              {/* Delete button — only for RESOLVED or CANCELLED */}
              {(incident.status === 'RESOLVED' || incident.status === 'CANCELLED') && onDelete && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-rose-900/30 border border-rose-700/50 hover:bg-rose-800/40 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>DELETE RECORD PERMANENTLY</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      <ReassignModal
        incident={incident}
        patrols={patrols}
        isOpen={showReassign}
        onClose={() => setShowReassign(false)}
        onConfirm={async (patrolId, reason) => {
          await onReassign(incident.id, patrolId, reason);
          onRefresh();
        }}
      />

      {/* Request Assistance Modal */}
      <RequestAssistanceModal
        incident={incident}
        stations={stations}
        isOpen={showAssistance}
        onClose={() => setShowAssistance(false)}
        onConfirm={async (stationId, notes) => {
          await onRequestAssistance(incident.id, stationId, notes);
          onRefresh();
        }}
      />

      {/* Cancel Prompt Dialog */}
      {showCancelPrompt && (
        <div className="fixed inset-0 z-[10005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-sm font-black text-white">CANCEL INCIDENT #{incident.referenceNumber}</h4>
            <p className="text-xs text-slate-400">Please provide administrative cancellation justification:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. Duplicate report, Test signal)..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
              >
                BACK
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isProcessing || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-50"
              >
                CONFIRM CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10005] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-700/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">DELETE INCIDENT RECORD</h4>
                <p className="text-xs text-rose-400 font-mono">{incident.referenceNumber}</p>
              </div>
            </div>
            <div className="bg-rose-900/20 border border-rose-700/40 rounded-xl p-3">
              <p className="text-xs text-rose-300 font-semibold">⚠️ This action is PERMANENT and cannot be undone.</p>
              <p className="text-xs text-slate-400 mt-1">The incident record, GPS data, and all status history will be permanently erased from the system.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-black transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'DELETING...' : 'YES, DELETE PERMANENTLY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Lightbox Preview Modal */}
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
    </>
  );
};
