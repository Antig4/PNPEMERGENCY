import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export type ToastType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export interface NotificationToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const typeConfig = {
    SUCCESS: {
      bg: 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    INFO: {
      bg: 'bg-blue-950/90 border-blue-500/60 text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    WARNING: {
      bg: 'bg-amber-950/90 border-amber-500/60 text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    ERROR: {
      bg: 'bg-rose-950/90 border-rose-500/60 text-rose-300',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
  };

  const config = typeConfig[toast.type] || typeConfig.INFO;

  return (
    <div className="fixed top-6 right-6 z-[10050] max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`border rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5 ${config.bg}`}>
        {config.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${config.badge}`}>
              {toast.type}
            </span>
            <h4 className="text-xs font-black text-white truncate">{toast.title}</h4>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg text-xs font-bold transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
