import React, { createContext, useContext, useState, useEffect } from 'react';
import { PatrolOfficer, PatrolStatus, DeclineReason, ResolutionOutcome } from '../types/patrol';
import { Incident } from '../types/incident';
import { patrolAuthService } from '../services/patrolAuthService';
import { patrolService } from '../services/patrolService';
import { patrolIncidentService } from '../services/patrolIncidentService';
import { patrolLocationService } from '../services/patrolLocationService';
import { notificationService, SystemNotification } from '../services/notificationService';
import { locationService } from '../services/locationService';

interface PatrolAuthContextType {
  officer: PatrolOfficer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  patrolStatus: PatrolStatus;
  activeAssignment: Incident | null;
  incomingAlert: SystemNotification | null;
  login: (badgeNumber: string, password: string) => Promise<PatrolOfficer>;
  initFromSession: () => Promise<PatrolOfficer | null>;
  logout: () => Promise<void>;
  updateStatus: (newStatus: PatrolStatus) => Promise<void>;
  acceptIncident: (incidentId: string) => Promise<Incident | null>;
  declineIncident: (incidentId: string, reason: DeclineReason, note?: string) => Promise<void>;
  startResponding: (incidentId: string) => Promise<Incident | null>;
  markOnScene: (incidentId: string) => Promise<Incident | null>;
  resolveIncident: (incidentId: string, summary: string, outcome: ResolutionOutcome) => Promise<Incident | null>;
  dismissAlert: () => void;
  triggerMockDispatchAlert: (incidentId?: string) => void;
  refreshAssignment: () => Promise<Incident | null>;
}

const PatrolAuthContext = createContext<PatrolAuthContextType | undefined>(undefined);

export const PatrolAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [officer, setOfficer] = useState<PatrolOfficer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>('AVAILABLE');
  const [activeAssignment, setActiveAssignment] = useState<Incident | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<SystemNotification | null>(null);

  useEffect(() => {
    initPatrolAuth();
  }, []);

  const refreshAssignment = async (): Promise<Incident | null> => {
    if (!officer) return null;
    try {
      const active = await patrolIncidentService.getActiveIncident();
      if (active) {
        if (active.status === 'NOTIFIED') {
          setIncomingAlert((prev: SystemNotification | null) => {
            if (prev && (prev as any).incidentId === active.id) return prev;
            return {
              id: `alert-${active.id}`,
              title: 'EMERGENCY DISPATCH ALERT',
              message: `New Incident ${active.referenceNumber}: ${active.emergencyType}`,
              type: 'CRIME_POLICE',
              incidentId: active.id,
              referenceNumber: active.referenceNumber,
              timestamp: active.timestamp,
              citizenName: active.citizenName,
              latitude: active.latitude,
              longitude: active.longitude,
            } as any;
          });
          setActiveAssignment(null);
        } else if (['ACCEPTED', 'RESPONDING', 'ON_SCENE'].includes(active.status)) {
          setActiveAssignment(active);
          setIncomingAlert(null);
          setPatrolStatus(active.status === 'ON_SCENE' ? 'ON_SCENE' : 'RESPONDING');
        } else {
          setActiveAssignment(null);
          setIncomingAlert(null);
        }
        return active;
      } else {
        setActiveAssignment(null);
        setIncomingAlert(null);
        return null;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthenticated')) {
        setOfficer(null);
        setActiveAssignment(null);
        setIncomingAlert(null);
        await patrolAuthService.logout();
      } else {
        console.warn('[PatrolAuthContext] refreshAssignment error:', e);
      }
      return null;
    }
  };

  // Reliable 3-second polling loop for assigned emergency dispatches
  useEffect(() => {
    if (!officer) return;

    refreshAssignment();
    const interval = setInterval(() => {
      refreshAssignment();
    }, 3000);

    return () => clearInterval(interval);
  }, [officer?.id]);

  const initPatrolAuth = async () => {
    try {
      setIsLoading(true);
      const session = await patrolAuthService.getSavedSession();
      if (session) {
        setOfficer(session.officer);
        setPatrolStatus(session.officer.status || 'AVAILABLE');
      }
    } catch (e) {
      console.warn('[PatrolAuthProvider] init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (badgeNumber: string, password: string): Promise<PatrolOfficer> => {
    setIsLoading(true);
    try {
      const res = await patrolAuthService.login(badgeNumber, password);
      setOfficer(res.officer);
      setPatrolStatus(res.officer.status);
      return res.officer;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * initFromSession — load patrol state from an already-saved SecureStore session.
   * Used by the unified login screen after authService.login has already persisted
   * the patrol_auth_user data, avoiding a second API round-trip.
   */
  const initFromSession = async (): Promise<PatrolOfficer | null> => {
    try {
      const session = await patrolAuthService.getSavedSession();
      if (session) {
        setOfficer(session.officer);
        setPatrolStatus(session.officer.status || 'AVAILABLE');
        return session.officer;
      }
      return null;
    } catch (e) {
      console.warn('[PatrolAuthContext] initFromSession error:', e);
      return null;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      patrolLocationService.stopActiveTracking();
      await patrolAuthService.logout();
    } catch (e) {
      console.warn('[PatrolAuthContext] logout warning:', e);
    } finally {
      setOfficer(null);
      setActiveAssignment(null);
      setIncomingAlert(null);
      setPatrolStatus('OFFLINE');
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: PatrolStatus) => {
    if (!officer) return;
    const updated = await patrolService.updateStatus(officer, newStatus);
    setOfficer(updated);
    setPatrolStatus(newStatus);

    if (newStatus === 'OFF_DUTY' || newStatus === 'OFFLINE') {
      patrolLocationService.stopActiveTracking();
    }
  };

  // refreshAssignment is defined above the polling useEffect

  const acceptIncident = async (incidentId: string): Promise<Incident | null> => {
    if (!officer) return null;
    const inc = await patrolIncidentService.acceptIncident(incidentId);
    if (inc) {
      setActiveAssignment(inc);
      setPatrolStatus('RESPONDING');
      setIncomingAlert(null);

      // Start location updates
      try {
        patrolLocationService.startActiveTracking(officer.id, 'RESPONDING', incidentId);
      } catch (e) {
        console.warn('GPS location error on accept:', e);
      }
    }
    return inc;
  };

  const declineIncident = async (incidentId: string, reason: DeclineReason, note?: string) => {
    if (!officer) return;
    const reasonText = note ? `${reason}: ${note}` : reason;
    await patrolIncidentService.declineIncident(incidentId, reasonText);
    setIncomingAlert(null);
    setActiveAssignment(null);
    setPatrolStatus('AVAILABLE');
  };

  const startResponding = async (incidentId: string): Promise<Incident | null> => {
    if (!officer) return null;
    const inc = await patrolIncidentService.updateIncidentStatus(incidentId, 'RESPONDING');
    if (inc) {
      setActiveAssignment(inc);
      setPatrolStatus('RESPONDING');
    }
    return inc;
  };

  const markOnScene = async (incidentId: string): Promise<Incident | null> => {
    if (!officer) return null;
    const inc = await patrolIncidentService.markOnScene(incidentId);
    if (inc) {
      setActiveAssignment(inc);
      setPatrolStatus('ON_SCENE');
    }
    return inc;
  };

  const resolveIncident = async (
    incidentId: string,
    summary: string,
    outcome: ResolutionOutcome
  ): Promise<Incident | null> => {
    if (!officer) return null;
    const resolved = await patrolIncidentService.resolveIncident(incidentId, summary, outcome);
    if (resolved) {
      setActiveAssignment(null);
      patrolLocationService.stopActiveTracking();
      setPatrolStatus('AVAILABLE');
    }
    return resolved;
  };

  const dismissAlert = () => {
    setIncomingAlert(null);
  };

  const triggerMockDispatchAlert = (incidentId: string = 'INC-00021') => {
    const alertNotif = notificationService.createMockDispatchNotification(incidentId);
    setIncomingAlert(alertNotif);
  };

  return (
    <PatrolAuthContext.Provider
      value={{
        officer,
        isAuthenticated: !!officer,
        isLoading,
        patrolStatus,
        activeAssignment,
        incomingAlert,
        login,
        initFromSession,
        logout,
        updateStatus,
        acceptIncident,
        declineIncident,
        startResponding,
        markOnScene,
        resolveIncident,
        dismissAlert,
        triggerMockDispatchAlert,
        refreshAssignment,
      }}
    >
      {children}
    </PatrolAuthContext.Provider>
  );
};

export const usePatrolAuth = (): PatrolAuthContextType => {
  const context = useContext(PatrolAuthContext);
  if (!context) {
    throw new Error('usePatrolAuth must be used within a PatrolAuthProvider');
  }
  return context;
};
