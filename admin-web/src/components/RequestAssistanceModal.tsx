import React, { useState } from 'react';
import { Incident, PoliceStation } from '../types';
import { Building2, X, AlertCircle } from 'lucide-react';

interface RequestAssistanceModalProps {
  incident: Incident;
  stations: PoliceStation[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stationId: string, notes: string) => Promise<void>;
}

export const RequestAssistanceModal: React.FC<RequestAssistanceModalProps> = ({
  incident,
  stations,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      setError('Please select an assisting police station.');
      return;
    }
    if (!notes.trim()) {
      setError('Please enter request notes.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(selectedStationId, notes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to request assistance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Building2 className="w-5 h-5" />
            <span>REQUEST BACKUP ASSISTANCE</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Requesting secondary backup units from neighboring police stations.</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Assisting Police Station Desk *
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Select Station --</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.stationName} ({st.stationCode}) — Available Units: {st.availablePatrols}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Assistance Notes & Tactical Detail *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify required assistance (e.g., Traffic control, additional perimeter security)..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              disabled={isSubmitting || !selectedStationId}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'DISPATCHING...' : 'SEND ASSISTANCE REQUEST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
