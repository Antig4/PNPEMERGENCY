import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  PhoneCall,
  PhoneIncoming,
  Shield,
  Building2,
  PhoneOff,
  User,
  Minimize2,
  Maximize2,
  Phone,
} from 'lucide-react-native';

import { callBridgeService, CallBridgeEvent } from '../services/callBridgeService';

export type CallRole = 'STATION' | 'PATROL' | 'CITIZEN';

export interface EmergencyCallModalProps {
  visible: boolean;
  name: string;
  phoneNumber: string;
  role: CallRole;
  isIncoming?: boolean;
  onClose: () => void;
  onConfirmContact?: () => void;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  visible,
  name,
  phoneNumber,
  role,
  isIncoming = false,
  onClose,
  onConfirmContact,
}) => {
  const [callState, setCallState] = useState<'INCOMING' | 'CALLING' | 'CONNECTED'>('CALLING');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const hasInitialized = useRef(false);

  // Initialize call state ONCE when modal becomes visible
  useEffect(() => {
    if (visible && !hasInitialized.current) {
      hasInitialized.current = true;
      setIsMinimized(false);
      setDuration(0);
      if (isIncoming) {
        setCallState('INCOMING');
      } else {
        setCallState('CALLING');
      }
    }
    if (!visible) {
      hasInitialized.current = false;
      setCallState('CALLING');
      setIsMinimized(false);
      setDuration(0);
    }
  }, [visible]);

  // Subscribe to call bridge events to track CONNECTED / ENDED transitions
  useEffect(() => {
    if (!visible) return;

    const unsubscribe = callBridgeService.subscribe((evt: CallBridgeEvent) => {
      if (evt.status === 'CONNECTED') {
        setCallState('CONNECTED');
        setDuration(0);
      } else if (evt.status === 'ENDED') {
        onClose();
      }
    });

    return unsubscribe;
  }, [visible]);

  // Call duration timer
  useEffect(() => {
    let timer: any;
    if (visible && callState === 'CONNECTED') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, callState]);

  const handleAnswerCall = () => {
    setCallState('CONNECTED');
    setDuration(0);
    callBridgeService.acceptCall();
  };

  const handleEndCall = () => {
    callBridgeService.endCall();
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

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Minimized Call Floating Bar
  if (isMinimized) {
    return (
      <View style={styles.minimizedContainer}>
        <View style={styles.minimizedContent}>
          <View style={styles.minimizedInfo}>
            <View style={styles.pulseDot} />
            <Text style={styles.minimizedTitle} numberOfLines={1}>
              Call: {name || 'PNP Emergency'}
            </Text>
            <Text style={styles.minimizedTimer}>{formatSecs(duration)}</Text>
          </View>
          <View style={styles.minimizedActions}>
            <TouchableOpacity style={styles.minExpandBtn} onPress={() => setIsMinimized(false)}>
              <Maximize2 color="#FFFFFF" size={14} />
              <Text style={styles.minBtnText}>EXPAND</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.minEndBtn} onPress={handleEndCall}>
              <PhoneOff color="#FFFFFF" size={14} />
              <Text style={styles.minBtnText}>END</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.fullCallScreen}>
          {/* Header & Minimize Control */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.minimizeBtn} onPress={() => setIsMinimized(true)}>
              <Minimize2 color="#94A3B8" size={20} />
              <Text style={styles.minimizeBtnText}>MINIMIZE CALL</Text>
            </TouchableOpacity>
          </View>

          {/* Incoming Call View */}
          {callState === 'INCOMING' ? (
            <View style={styles.centerGroup}>
              <View style={styles.incomingBadgeRow}>
                <PhoneIncoming color="#10B981" size={20} />
                <Text style={styles.incomingBadgeText}>INCOMING EMERGENCY CALL</Text>
              </View>

              <View style={styles.roleBadgeContainer}>
                {role === 'STATION' ? (
                  <Building2 color="#FACC15" size={16} />
                ) : role === 'PATROL' ? (
                  <Shield color="#60A5FA" size={16} />
                ) : (
                  <User color="#10B981" size={16} />
                )}
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>

              <Text style={styles.targetName}>{name || 'Patrol Responder'}</Text>
              <Text style={styles.targetNumber}>{phoneNumber || '085-341-2111'}</Text>

              <View style={[styles.phoneIconPulse, styles.incomingPulse]}>
                <PhoneCall color="#10B981" size={48} />
              </View>

              <Text style={styles.callInstructionText}>Patrol Officer is calling you. Please answer.</Text>

              {/* Answer & Decline Buttons */}
              <View style={styles.incomingActionsRow}>
                <TouchableOpacity style={styles.declineBtn} onPress={handleEndCall}>
                  <PhoneOff color="#FFFFFF" size={24} />
                  <Text style={styles.incomingBtnText}>DECLINE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.answerBtn} onPress={handleAnswerCall}>
                  <Phone color="#FFFFFF" size={24} />
                  <Text style={styles.incomingBtnText}>ANSWER</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Active Call Screen */
            <View style={styles.centerGroup}>
              <Text style={styles.callingBadgeText}>
                {callState === 'CONNECTED' ? 'CALL CONNECTED' : 'CALLING...'}
              </Text>

              <View style={styles.roleBadgeContainer}>
                {role === 'STATION' ? (
                  <Building2 color="#FACC15" size={16} />
                ) : role === 'PATROL' ? (
                  <Shield color="#60A5FA" size={16} />
                ) : (
                  <User color="#10B981" size={16} />
                )}
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>

              <Text style={styles.targetName}>{name || 'PNP Responder'}</Text>
              <Text style={styles.targetNumber}>{phoneNumber || '085-341-2111'}</Text>

              <Text style={styles.timerDisplay}>{formatSecs(duration)}</Text>

              <View style={styles.phoneIconPulse}>
                <PhoneCall color="#FACC15" size={48} />
              </View>

              <View style={styles.footerGroup}>
                <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
                  <PhoneOff color="#FFFFFF" size={24} />
                  <Text style={styles.endCallBtnText}>END CALL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
        }
      : {}),
  },
  fullCallScreen: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  minimizeBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerGroup: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  incomingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  incomingBadgeText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  callingBadgeText: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  roleBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  targetName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  targetNumber: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
  },
  timerDisplay: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 20,
  },
  phoneIconPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    marginBottom: 30,
  },
  incomingPulse: {
    borderColor: '#10B981',
  },
  callInstructionText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 30,
  },
  incomingActionsRow: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    gap: 4,
  },
  answerBtn: {
    backgroundColor: '#10B981',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    gap: 4,
  },
  incomingBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  footerGroup: {
    width: '100%',
    alignItems: 'center',
  },
  endCallBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 10,
    minWidth: 180,
  },
  endCallBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Minimized Call Widget
  minimizedContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 20,
  },
  minimizedContent: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  minimizedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  minimizedTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 140,
  },
  minimizedTimer: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  minimizedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  minExpandBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minEndBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
