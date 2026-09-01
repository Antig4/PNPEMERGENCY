import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldAlert,
  Phone,
  PhoneOff,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Car,
  Check,
  X,
} from 'lucide-react-native';
import { usePatrolAuth } from '../../../context/PatrolAuthContext';
import { incidentService } from '../../../services/incidentService';
import { patrolIncidentService } from '../../../services/patrolIncidentService';
import { PatrolMapCard } from '../../../components/patrol/PatrolMapCard';
import { callBridgeService } from '../../../services/callBridgeService';
import { formatDateTime, formatCoordinates } from '../../../utils/formatters';
import { handleSafeBack } from '../../../utils/navigation';
import { Incident } from '../../../types/incident';

// Inline outgoing call UI shown on the patrol officer's side
function OutgoingCallOverlay({
  name,
  phoneNumber,
  onEnd,
}: {
  name: string;
  phoneNumber: string;
  onEnd: () => void;
}) {
  const [phase, setPhase] = React.useState<'RINGING' | 'CONNECTED'>('RINGING');
  const [seconds, setSeconds] = React.useState(0);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Subscribe to accept/end events from citizen
  React.useEffect(() => {
    const unsubscribe = callBridgeService.subscribe((evt) => {
      if (evt.status === 'CONNECTED') {
        setPhase('CONNECTED');
        setSeconds(0);
      } else if (evt.status === 'ENDED') {
        onEnd();
      }
    });
    return unsubscribe;
  }, []);

  // Duration timer — only runs when citizen has answered
  React.useEffect(() => {
    if (phase !== 'CONNECTED') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const iconColor = phase === 'CONNECTED' ? '#10B981' : '#FACC15';
  const borderColor = phase === 'CONNECTED' ? '#10B981' : '#FACC15';
  const bgColor = phase === 'CONNECTED' ? '#0F2A1A' : '#1A2A1A';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(10,18,38,0.97)',
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? { position: 'fixed' as any } : {}),
      }}
    >
      {/* Status Badge */}
      <Text
        style={{
          color: phase === 'CONNECTED' ? '#10B981' : '#FACC15',
          fontSize: 14,
          fontWeight: '900',
          letterSpacing: 2,
          marginBottom: 16,
        }}
      >
        {phase === 'CONNECTED' ? '● CALL CONNECTED' : 'RINGING...'}
      </Text>

      {/* Caller info */}
      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 4 }}>
        {name || 'Citizen'}
      </Text>
      <Text style={{ color: '#38BDF8', fontSize: 20, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}>
        {phoneNumber || '09171234567'}
      </Text>

      {/* Timer — shown only after connected */}
      {phase === 'CONNECTED' ? (
        <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '900', fontFamily: 'monospace', marginBottom: 24 }}>
          {fmt(seconds)}
        </Text>
      ) : (
        <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 24 }}>
          Waiting for citizen to answer...
        </Text>
      )}

      {/* Phone icon */}
      <View
        style={{
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: bgColor,
          borderWidth: 3,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        <Phone color={iconColor} size={52} />
      </View>

      {/* End call */}
      <TouchableOpacity
        onPress={() => {
          callBridgeService.endCall();
          onEnd();
        }}
        style={{
          backgroundColor: '#EF4444',
          paddingHorizontal: 48,
          paddingVertical: 18,
          borderRadius: 40,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <PhoneOff color="#fff" size={24} />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 }}>END CALL</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatrolIncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { officer, resolveIncident, refreshAssignment } = usePatrolAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Calling modal state
  const [showCallModal, setShowCallModal] = useState<boolean>(false);

  // Simplified Resolution Modal state
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolveSuccessMsg, setResolveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      let inc = await patrolIncidentService.getIncidentById(id);
      if (!inc) {
        inc = await incidentService.getIncidentById(id);
      }
      if (inc) {
        setIncident(inc);
      }
    } catch (e) {
      console.warn('[PatrolIncidentDetail] load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartResponding = async () => {
    if (!incident) return;
    setIsUpdating(true);
    try {
      const updated = await patrolIncidentService.updateIncidentStatus(incident.id, 'RESPONDING');
      if (updated) {
        setIncident(updated);
      } else {
        setIncident({ ...incident, status: 'RESPONDING' });
      }
    } catch (e) {
      console.warn('Status update to RESPONDING error:', e);
      setIncident({ ...incident, status: 'RESPONDING' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkOnScene = async () => {
    if (!incident) return;
    setIsUpdating(true);
    try {
      const updated = await patrolIncidentService.markOnScene(incident.id);
      if (updated) {
        setIncident(updated);
      } else {
        setIncident({ ...incident, status: 'ON_SCENE' });
      }
    } catch (e) {
      console.warn('Status update to ON_SCENE error:', e);
      setIncident({ ...incident, status: 'ON_SCENE' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenNavigation = () => {
    if (!incident) return;
    const lat = incident.latitude;
    const lng = incident.longitude;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      }
      return;
    }

    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(Emergency Location)`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const handleConfirmResolution = async () => {
    if (!incident) return;
    setIsResolving(true);
    try {
      await resolveIncident(incident.id, resolutionNotes.trim(), 'Resolved');
      setResolveSuccessMsg(`✓ Incident ${incident.referenceNumber || incident.id} has been marked as RESOLVED.`);
      setShowResolveModal(false);

      setTimeout(() => {
        router.replace('/patrol/history');
      }, 1200);
    } catch (e: any) {
      console.error('Resolve error:', e);
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading || !incident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading Incident Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isNotifiedOrAccepted = ['NEW', 'NOTIFIED', 'ACCEPTED'].includes(incident.status);
  const isResponding = incident.status === 'RESPONDING';
  const isOnScene = incident.status === 'ON_SCENE';
  const isResolved = incident.status === 'RESOLVED';

  const citizenName = incident.citizenName || 'Registered Citizen';
  const citizenPhone = incident.contactNumber || incident.citizenMobile || '09171234567';
  const refNumber = incident.referenceNumber || `INC-${String(incident.id).padStart(6, '0')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/patrol/dashboard')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{refNumber}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadIncident}>
          <RefreshCw color="#60A5FA" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Success Toast Banner */}
        {resolveSuccessMsg && (
          <View style={styles.toastSuccess}>
            <CheckCircle2 color="#10B981" size={20} />
            <Text style={styles.toastSuccessText}>{resolveSuccessMsg}</Text>
          </View>
        )}

        {/* Current Status Tracker Banner */}
        <View
          style={[
            styles.statusBanner,
            isResponding && styles.statusBannerResponding,
            isOnScene && styles.statusBannerOnScene,
            isResolved && styles.statusBannerResolved,
          ]}
        >
          <ShieldAlert
            color={
              isResolved ? '#10B981' : isOnScene ? '#FACC15' : isResponding ? '#60A5FA' : '#F59E0B'
            }
            size={26}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusBannerTitle}>STATUS: {incident.status}</Text>
            <Text style={styles.statusBannerSub}>
              {isResolved
                ? 'Incident resolved and archived.'
                : isOnScene
                ? 'Patrol Unit ON SCENE. Conduct assessment and resolve incident.'
                : isResponding
                ? 'Patrol Unit EN ROUTE to emergency location.'
                : 'Incident assigned. Click START RESPONDING to begin route.'}
            </Text>
          </View>
        </View>

        {/* Interactive Map & Route Section */}
        <Text style={styles.sectionHeader}>INCIDENT NAVIGATION & LOCATION</Text>
        <PatrolMapCard
          officerLat={officer?.latitude || 8.9482}
          officerLng={officer?.longitude || 125.5412}
          incidentLat={incident.latitude}
          incidentLng={incident.longitude}
          distanceKm={incident.distanceKm || 0.8}
          isOnScene={isOnScene}
          onNavigatePress={handleOpenNavigation}
        />

        {/* Incident Info Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>INCIDENT INFORMATION</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Type</Text>
            <Text style={styles.infoValHighlight}>{incident.emergencyType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time Reported</Text>
            <Text style={styles.infoVal}>{formatDateTime(incident.timestamp)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GPS Coordinates</Text>
            <Text style={styles.infoValMono}>
              {formatCoordinates(incident.latitude, incident.longitude)}
            </Text>
          </View>

          <View style={styles.infoRowNoBorder}>
            <View>
              <Text style={styles.infoLabel}>Citizen Informant</Text>
              <Text style={styles.citizenNameText}>{citizenName}</Text>
            </View>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => {
                if (!showCallModal) {
                  callBridgeService.startCall(
                    officer?.patrol_unit_name || 'Mobile Patrol Unit 1',
                    citizenPhone || '09171234567',
                    'PATROL',
                    'PATROL_OFFICER'
                  );
                  setShowCallModal(true);
                }
              }}
            >
              <Phone color="#FFFFFF" size={14} />
              <Text style={styles.contactBtnText}>CALL CITIZEN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Citizen Evidence Section */}
        {(incident.description || (incident.attachments && incident.attachments.length > 0)) && (
          <View style={styles.evidenceCard}>
            <Text style={styles.evidenceTitle}>EVIDENCE & CITIZEN NOTES</Text>

            {incident.description && (
              <Text style={styles.descriptionText}>"{incident.description}"</Text>
            )}

            {incident.attachments && incident.attachments.length > 0 && (
              <View style={styles.mediaContainer}>
                <Text style={styles.mediaLabel}>ATTACHED MEDIA EVIDENCE:</Text>
                <Image source={{ uri: incident.attachments[0].uri }} style={styles.evidenceImage} />
              </View>
            )}
          </View>
        )}

        {/* Sequential Officer Action Controls */}
        {!isResolved && (
          <View style={styles.actionControls}>
            {isNotifiedOrAccepted && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnResponding, isUpdating && styles.btnDisabled]}
                onPress={handleStartResponding}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Car color="#FFFFFF" size={22} />
                    <Text style={styles.btnActionText}>START RESPONDING</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isResponding && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnOnScene, isUpdating && styles.btnDisabled]}
                onPress={handleMarkOnScene}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MapPin color="#FFFFFF" size={22} />
                    <Text style={styles.btnActionText}>MARK AS ON SCENE</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isOnScene && (
              <TouchableOpacity
                style={[styles.btnAction, styles.btnResolve]}
                onPress={() => setShowResolveModal(true)}
              >
                <CheckCircle2 color="#FFFFFF" size={22} />
                <Text style={styles.btnActionText}>RESOLVE INCIDENT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Outgoing Call Overlay for Patrol Officer */}
      {showCallModal && (
        <OutgoingCallOverlay
          name={citizenName}
          phoneNumber={citizenPhone}
          onEnd={() => {
            setShowCallModal(false);
          }}
        />
      )}

      {/* Simplified Resolution Confirmation Modal */}
      <Modal visible={showResolveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resolveCard}>
            <View style={styles.resolveHeader}>
              <CheckCircle2 color="#10B981" size={36} />
              <Text style={styles.resolveTitle}>RESOLVE INCIDENT</Text>
              <Text style={styles.resolveSub}>Are you sure you want to mark this incident as resolved?</Text>
            </View>

            <View style={styles.resolveInfoBox}>
              <Text style={styles.resolveInfoLabel}>Incident Ref:</Text>
              <Text style={styles.resolveInfoVal}>{refNumber}</Text>
            </View>

            <View style={styles.resolveNotesBox}>
              <Text style={styles.resolveNotesLabel}>Optional Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Type any optional resolution details or leave empty..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
              />
            </View>

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowResolveModal(false)}
                disabled={isResolving}
              >
                <Text style={styles.btnCancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnConfirmResolve, isResolving && styles.btnDisabled]}
                onPress={handleConfirmResolution}
                disabled={isResolving}
              >
                {isResolving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnConfirmResolveText}>RESOLVE INCIDENT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  toastSuccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  statusBannerResponding: {
    backgroundColor: '#1E3A8A',
    borderColor: '#2563EB',
  },
  statusBannerOnScene: {
    backgroundColor: '#713F12',
    borderColor: '#CA8A04',
  },
  statusBannerResolved: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  statusBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statusBannerSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailsTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  infoVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoValHighlight: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
  },
  infoValMono: {
    color: '#38BDF8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  citizenNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  evidenceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  evidenceTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  descriptionText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  mediaContainer: {},
  mediaLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  actionControls: {
    marginTop: 6,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 4,
  },
  btnResponding: {
    backgroundColor: '#2563EB',
  },
  btnOnScene: {
    backgroundColor: '#CA8A04',
  },
  btnResolve: {
    backgroundColor: '#16A34A',
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resolveCard: {
    backgroundColor: '#0F172A',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 20,
    gap: 14,
  },
  resolveHeader: {
    alignItems: 'center',
    gap: 6,
  },
  resolveTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resolveSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  resolveInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resolveInfoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  resolveInfoVal: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  resolveNotesBox: {
    gap: 6,
  },
  resolveNotesLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalBtnGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnConfirmResolve: {
    flex: 1.5,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmResolveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
