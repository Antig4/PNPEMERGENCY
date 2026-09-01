type CallRole = 'STATION' | 'PATROL' | 'CITIZEN';

export interface CallBridgeEvent {
  status: 'INCOMING' | 'RINGING' | 'CONNECTED' | 'ENDED';
  callerName: string;
  callerNumber: string;
  role: CallRole;
  initiatorRole?: 'PATROL_OFFICER' | 'CITIZEN';
  timestamp?: number;
}

type CallEventListener = (event: CallBridgeEvent) => void;

class CallBridgeService {
  private listeners: Set<CallEventListener> = new Set();
  private currentCall: CallBridgeEvent | null = null;
  private channel: any = null;
  private pollInterval: any = null;
  private lastCallJSON: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. BroadcastChannel (fast in-memory web worker channel)
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('pnp_emergency_call_channel');
          this.channel.onmessage = (event: MessageEvent) => {
            if (event.data) {
              this.handleIncomingEvent(event.data);
            }
          };
        } catch (e) {
          console.warn('[CallBridgeService] BroadcastChannel error:', e);
        }
      }

      // 2. LocalStorage Event Listener (Cross-Tab sync trigger)
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'pnp_active_call_event') {
          if (e.newValue) {
            try {
              const parsed = JSON.parse(e.newValue);
              this.handleIncomingEvent(parsed);
            } catch (err) {}
          } else {
            this.handleIncomingEvent({
              status: 'ENDED',
              callerName: '',
              callerNumber: '',
              role: 'CITIZEN',
            });
          }
        }
      });

      // 3. Fast 300ms Polling fallback for web to guarantee cross-tab state sync
      this.pollInterval = setInterval(() => {
        try {
          const stored = localStorage.getItem('pnp_active_call_event');
          if (stored !== this.lastCallJSON) {
            this.lastCallJSON = stored || '';
            if (stored) {
              const parsed = JSON.parse(stored);
              this.handleIncomingEvent(parsed);
            } else if (this.currentCall && this.currentCall.status !== 'ENDED') {
              this.handleIncomingEvent({
                status: 'ENDED',
                callerName: '',
                callerNumber: '',
                role: 'CITIZEN',
              });
            }
          }
        } catch (e) {}
      }, 300);
    }
  }

  private handleIncomingEvent(evt: CallBridgeEvent) {
    const isDifferent =
      !this.currentCall ||
      this.currentCall.status !== evt.status ||
      this.currentCall.timestamp !== evt.timestamp;

    if (evt.status === 'ENDED') {
      this.currentCall = null;
    } else {
      this.currentCall = evt;
    }

    if (isDifferent) {
      this.notifyListeners(evt);
    }
  }

  subscribe(listener: CallEventListener): () => void {
    this.listeners.add(listener);
    if (this.currentCall) {
      listener(this.currentCall);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentCall(): CallBridgeEvent | null {
    return this.currentCall;
  }

  private notifyListeners = (evt: CallBridgeEvent) => {
    this.listeners.forEach((listener) => listener({ ...evt }));
  };

  private broadcast(evt: CallBridgeEvent) {
    this.notifyListeners(evt);

    if (typeof window !== 'undefined') {
      // BroadcastChannel post
      if (this.channel) {
        try {
          this.channel.postMessage(evt);
        } catch (e) {}
      }

      // LocalStorage post
      try {
        if (evt.status === 'ENDED') {
          this.lastCallJSON = '';
          localStorage.removeItem('pnp_active_call_event');
        } else {
          const jsonStr = JSON.stringify({ ...evt, timestamp: Date.now() });
          this.lastCallJSON = jsonStr;
          localStorage.setItem('pnp_active_call_event', jsonStr);
        }
      } catch (e) {}
    }
  }

  /**
   * Officer calls citizen -> Triggers INCOMING alert on Citizen UI
   */
  startCall(
    callerName: string,
    callerNumber: string,
    role: CallRole = 'PATROL',
    initiatorRole: 'PATROL_OFFICER' | 'CITIZEN' = 'PATROL_OFFICER'
  ) {
    this.currentCall = {
      status: 'RINGING',
      callerName,
      callerNumber,
      role,
      initiatorRole,
      timestamp: Date.now(),
    };
    this.broadcast(this.currentCall);
  }

  /**
   * Citizen accepts call -> Both officer & citizen move to CONNECTED state
   */
  acceptCall() {
    if (this.currentCall) {
      this.currentCall = {
        ...this.currentCall,
        status: 'CONNECTED',
        timestamp: Date.now(),
      };
      this.broadcast(this.currentCall);
    }
  }

  private isEnding = false;

  /**
   * Ends call -> Dismisses call modal on all participating screens
   */
  endCall() {
    if (this.isEnding) return;
    this.isEnding = true;
    try {
      const endedEvt: CallBridgeEvent = {
        status: 'ENDED',
        callerName: '',
        callerNumber: '',
        role: 'CITIZEN',
        timestamp: Date.now(),
      };
      this.currentCall = null;
      this.broadcast(endedEvt);
    } finally {
      this.isEnding = false;
    }
  }
}

export const callBridgeService = new CallBridgeService();
