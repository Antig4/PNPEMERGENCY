import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  PhoneCall,
  CheckCircle,
  Shield,
  Building2,
  MapPin,
  AlertTriangle,
  ArrowRight,
  PhoneOff,
  UserCheck,
  RotateCcw,
} from 'lucide-react-native';
import { callBridgeService } from '../services/callBridgeService';
import { Incident } from '../types/incident';

interface ResponderCallModalProps {
  visible: boolean;
  incident: Incident | null;
  onContinue: () => void;
  onConfirmContact?: (incidentId: string) => void;
}

export const ResponderCallModal: React.FC<ResponderCallModalProps> = ({
  visible,
  incident,
  onContinue,
  onConfirmContact,
}) => {
  const [callingMode, setCallingMode] = useState<boolean>(false);
  const [activeCallTarget, setActiveCallTarget] = useState<{ name: string; number: string; type: 'STATION' | 'PATROL' } | null>(null);
  const [callEnded, setCallEnded] = useState<boolean>(false);
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  if (!visible || !incident) return null;

  const stationName = incident.assignedStationName || 'Butuan City Police Station 1';
  const stationPhone = incident.responderContactNumber || incident.responder?.contactNumber || '085-341-2111';

  const hasPatrol = Boolean(incident.assignedPatrolName || incident.assignedPatrolId);
  const patrolName = incident.assignedPatrolName || 'Patrol Officer';
  const patrolBadge = incident.assignedPatrolBadge || 'PNP-BCPO';
  const patrolPhone = incident.assignedPatrolMobile || '09171234567';

  const handleInitiateCall = async (name: string, rawNumber: string, type: 'STATION' | 'PATROL') => {
    const cleanNumber = rawNumber.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    setActiveCallTarget({ name, number: rawNumber, type });
    setCallingMode(true);
    setCallEnded(false);

    try {
      callBridgeService.startCall(
        incident.citizenName || 'Citizen',
        incident.citizenMobile || rawNumber,
        type === 'STATION' ? 'STATION' : 'PATROL',
        'CITIZEN'
      );
    } catch (_) {}

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      }
    } catch (e) {
      console.warn('[ResponderCallModal] Call link launch error:', e);
    }
  };

  const handleEndCallInApp = () => {
    setCallingMode(false);
    if (onConfirmContact && incident) {
      onConfirmContact(incident.id);
    }
    onContinue();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onContinue}>
      <View style={styles.overlay}>
        {/* Calling Overlay Screen */}
        {callingMode && activeCallTarget ? (
          <View style={styles.fullCallScreen}>
            <View style={styles.callHeaderBox}>
              <Text style={styles.callingLabelText}>CALLING...</Text>
              <Text style={styles.callTargetName}>{activeCallTarget.name}</Text>
              <Text style={styles.callTargetNumber}>{activeCallTarget.number}</Text>

              <View style={styles.callPulseCircle}>
                <PhoneCall color="#FACC15" size={42} />
              </View>
            </View>

            <View style={styles.callFooterBox}>
              <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCallInApp}>
                <PhoneOff color="#FFFFFF" size={28} />
                <Text style={styles.endCallBtnText}>END CALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Main Emergency Report Sent Confirmation Screen */
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.successIconBadge}>
                <CheckCircle color="#10B981" size={36} />
              </View>
              <Text style={styles.statusBannerText}>EMERGENCY REPORT SENT</Text>
              <Text style={styles.headerSub}>Your report has been successfully registered.</Text>

              <View style={styles.metaBadgeRow}>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>ID: {incident.referenceNumber || incident.id}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>DISPATCHING RESPONDER</Text>
                </View>
              </View>
            </View>

            {/* Body — Call Nearest Responder Action Buttons */}
            <View style={styles.body}>
              <Text style={styles.sectionHeading}>CALL NEAREST RESPONDER:</Text>

              {/* Call Station */}
              <TouchableOpacity
                style={styles.btnCallStation}
                onPress={() => handleInitiateCall(stationName, stationPhone, 'STATION')}
              >
                <Building2 color="#000000" size={24} />
                <View style={styles.btnTextCol}>
                  <Text style={styles.btnStationTitle}>CALL NEAREST POLICE STATION</Text>
                  <Text style={styles.btnStationSub}>{stationName} · {stationPhone}</Text>
                </View>
                <PhoneCall color="#000000" size={20} />
              </TouchableOpacity>

              {/* Call Patrol Unit */}
              {hasPatrol ? (
                <TouchableOpacity
                  style={styles.btnCallPatrol}
                  onPress={() => handleInitiateCall(patrolName, patrolPhone, 'PATROL')}
                >
                  <Shield color="#FFFFFF" size={24} />
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnPatrolTitle}>CALL ASSIGNED PATROL UNIT</Text>
                    <Text style={styles.btnPatrolSub}>{patrolName} ({patrolBadge})</Text>
                  </View>
                  <PhoneCall color="#FFFFFF" size={20} />
                </TouchableOpacity>
              ) : (
                <View style={styles.patrolUnavailableBox}>
                  <AlertTriangle color="#FBBF24" size={18} />
                  <Text style={styles.patrolUnavailableText}>
                    Dispatched patrol unit details will appear as soon as an officer accepts.
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
                <Text style={styles.continueBtnText}>VIEW INCIDENT STATUS</Text>
                <ArrowRight color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullCallScreen: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  callHeaderBox: {
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  callingLabelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  callTargetName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  callTargetNumber: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  callPulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  callFooterBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  endCallBtn: {
    backgroundColor: '#EF4444',
    width: 180,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 8,
  },
  endCallBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#0F172A',
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  successIconBadge: {
    marginBottom: 8,
  },
  statusBannerText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  refBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statusBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: '#FACC15',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
  },
  body: {
    padding: 20,
    gap: 12,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  btnCallStation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  btnStationTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  btnStationSub: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  btnCallPatrol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  btnPatrolTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  btnPatrolSub: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  btnTextCol: {
    flex: 1,
  },
  patrolUnavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 10,
  },
  patrolUnavailableText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  confirmSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  btnYesContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  btnYesText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  btnNoTryAgain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnNoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
