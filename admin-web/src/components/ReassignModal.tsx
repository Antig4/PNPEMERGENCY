import React, { useState } from 'react';
import { Incident, PatrolOfficer } from '../types';
import { Car, X, ShieldAlert, Check } from 'lucide-react';

interface ReassignModalProps {
  incident: Incident;
  patrols: PatrolOfficer[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (patrolId: string, reason: string) => Promise<void>;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  incident,
  patrols,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availablePatrols = patrols.filter(
    (p) => p.availabilityStatus === 'AVAILABLE' && p.id !== incident.assignedPatrolId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatrolId) {
      setError('Please select an available patrol officer.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for reassignment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(selectedPatrolId, reason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Car className="w-5 h-5" />
            <span>REASSIGN PATROL OFFICER</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400">TARGET INCIDENT</p>
              <h4 className="text-sm font-black text-white">{incident.referenceNumber} • {incident.emergencyType}</h4>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400">CURRENT ASSIGNED</p>
              <p className="text-xs font-bold text-amber-400">{incident.assignedPatrolName || 'Unassigned'}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Available Patrol Unit *
            </label>
            {availablePatrols.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availablePatrols.map((patrol) => {
                  const isSelected = selectedPatrolId === patrol.id;
                  return (
                    <div
                      key={patrol.id}
                      onClick={() => setSelectedPatrolId(patrol.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{patrol.unitName} ({patrol.badgeNumber})</p>
                        <p className="text-[11px] text-slate-400">{patrol.officerName} • {patrol.stationName}</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-800/40 rounded-xl border border-slate-700">
                No available patrol officers found. Officers must be in AVAILABLE status.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Reason for Reassignment *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State official administrative reason (e.g. Officer nearer to scene, priority dispatch)..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatrolId}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'REASSIGNING...' : 'CONFIRM REASSIGNMENT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
