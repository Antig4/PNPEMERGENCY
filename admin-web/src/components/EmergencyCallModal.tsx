import React, { useState, useEffect } from 'react';
import { PhoneCall, CheckCircle, Shield, Building2, PhoneOff, UserCheck, RotateCcw, User } from 'lucide-react';

export type CallRole = 'STATION' | 'PATROL' | 'CITIZEN';

export interface EmergencyCallModalProps {
  visible: boolean;
  name: string;
  phoneNumber: string;
  role: CallRole;
  onClose: () => void;
  onConfirmContact?: () => void;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  visible,
  name,
  phoneNumber,
  role,
  onClose,
  onConfirmContact,
}) => {
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callEnded, setCallEnded] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      triggerCall();
    } else {
      setIsCalling(false);
      setCallEnded(false);
    }
  }, [visible]);

  const triggerCall = () => {
    const cleanNumber = (phoneNumber || '085-341-2111').replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    setIsCalling(true);
    setCallEnded(false);

    try {
      window.location.href = telUrl;
    } catch (e) {
      console.warn('[EmergencyCallModal Web] Call trigger error:', e);
    }
  };

  const handleEndCall = () => {
    if (onConfirmContact) {
      onConfirmContact();
    }
    onClose();
  };

  const handleYesContacted = () => {
    if (onConfirmContact) {
      onConfirmContact();
    }
    onClose();
  };

  if (!visible) return null;

  const roleLabel =
    role === 'STATION'
      ? 'POLICE STATION HOTLINE'
      : role === 'PATROL'
      ? 'PATROL OFFICER'
      : 'CITIZEN INFORMANT';

  return (
    <div className="fixed inset-0 z-[10020] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      {isCalling ? (
        /* Active Call UI */
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-between min-h-[480px] shadow-2xl text-center">
          <div className="space-y-4 w-full flex flex-col items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">CALLING</span>

            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-extrabold text-slate-200">
              {role === 'STATION' ? (
                <Building2 className="w-4 h-4 text-amber-400" />
              ) : role === 'PATROL' ? (
                <Shield className="w-4 h-4 text-blue-400" />
              ) : (
                <User className="w-4 h-4 text-emerald-400" />
              )}
              <span>{roleLabel}</span>
            </div>

            <h3 className="text-xl font-black text-white">{name || 'PNP Responder'}</h3>
            <p className="text-2xl font-mono font-bold text-sky-400">{phoneNumber || '085-341-2111'}</p>

            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center animate-pulse my-6">
              <PhoneCall className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <button
            onClick={handleEndCall}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
            <PhoneOff className="w-5 h-5" />
            <span>END CALL</span>
          </button>
        </div>
      ) : callEnded ? (
        /* Post-Call Verification Card */
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 bg-slate-800 border-b border-slate-700 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-emerald-400 tracking-wide">CALL COMPLETED?</h3>
            <p className="text-xs text-slate-300">Did you successfully contact {name}?</p>
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={handleYesContacted}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>YES, CONTACTED</span>
            </button>

            <button
              onClick={triggerCall}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
