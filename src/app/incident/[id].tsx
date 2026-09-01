import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Phone, Shield, Building2, Home, RefreshCw, Eye } from 'lucide-react-native';
import { incidentService } from '../../services/incidentService';
import { EmergencyCallModal, CallRole } from '../../components/EmergencyCallModal';
import { Incident } from '../../types/incident';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showStatusTimeline, setShowStatusTimeline] = useState<boolean>(false);

  // Reusable call modal state
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);
  const [callTarget, setCallTarget] = useState<{ name: string; number: string; role: CallRole } | null>(null);

  useEffect(() => {
    fetchIncidentDetails();
  }, [id]);

  const fetchIncidentDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const inc = await incidentService.getIncidentById(id);
      if (inc) {
        setIncident(inc);
      }
    } catch (e) {
      console.warn('[IncidentDetailScreen] fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallStation = () => {
    const stationName = incident?.assignedStationName || 'Butuan City Police Station 1';
    const stationPhone = incident?.responderContactNumber || '085-341-2111';
    setCallTarget({ name: stationName, number: stationPhone, role: 'STATION' });
    setCallModalVisible(true);
  };

  const handleCallPatrol = () => {
    const patrolName = incident?.assignedPatrolName || 'Nearest Patrol Unit';
    const patrolPhone = incident?.assignedPatrolMobile || '09171234567';
    setCallTarget({ name: patrolName, number: patrolPhone, role: 'PATROL' });
    setCallModalVisible(true);
  };

  if (isLoading || !incident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Retrieving Emergency Report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const refNumber = incident.referenceNumber || `INC-${String(incident.id).padStart(6, '0')}`;
  const statusDisplay = incident.status === 'NEW' ? 'DISPATCHING RESPONDER' : incident.status;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/home')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Report Sent</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchIncidentDetails}>
          <RefreshCw color="#60A5FA" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Success Confirmation Hero Box */}
        <View style={styles.heroCard}>
          <View style={styles.successBadgeCircle}>
            <CheckCircle2 color="#10B981" size={44} />
          </View>
          <Text style={styles.heroTitle}>✓ REPORT SENT</Text>
          <Text style={styles.heroSub}>
            Your emergency report has been successfully submitted to PNP EmergencyLink dispatch.
          </Text>

          {/* Reference & Status Card */}
          <View style={styles.refStatusCard}>
            <View style={styles.refBlock}>
              <Text style={styles.labelSmall}>REFERENCE ID</Text>
              <Text style={styles.refText}>{refNumber}</Text>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.statusBlock}>
              <Text style={styles.labelSmall}>CURRENT STATUS</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>{statusDisplay}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Status Timeline Dropdown View */}
        {showStatusTimeline && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>DISPATCH TIMELINE & UPDATES</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotActive} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineLabel}>Report Transmitted</Text>
                <Text style={styles.timelineTime}>Coordinates and mandatory evidence received.</Text>
              </View>
            </View>
            {['NOTIFIED', 'ACCEPTED', 'RESPONDING', 'ON_SCENE', 'RESOLVED'].includes(incident.status) && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDotActive} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineLabel}>Patrol Dispatched</Text>
                  <Text style={styles.timelineTime}>
                    Assigned unit: {incident.assignedPatrolName || 'BCPO Unit'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.btnStatus}
            onPress={() => setShowStatusTimeline(!showStatusTimeline)}
          >
            <Eye color="#38BDF8" size={18} />
            <Text style={styles.btnStatusText}>
              {showStatusTimeline ? 'HIDE REPORT STATUS' : 'VIEW REPORT STATUS'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnHome} onPress={() => router.replace('/home')}>
            <Home color="#FFFFFF" size={18} />
            <Text style={styles.btnHomeText}>RETURN TO HOME</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Unified Reusable Calling Component */}
      {callTarget && (
        <EmergencyCallModal
          visible={callModalVisible}
          name={callTarget.name}
          phoneNumber={callTarget.number}
          role={callTarget.role}
          onClose={() => setCallModalVisible(false)}
          onConfirmContact={() => {
            console.log('[IncidentDetailScreen] Citizen confirmed call with:', callTarget.name);
          }}
        />
      )}
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
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '900',
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
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  successBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  heroTitle: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroSub: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  refStatusCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  refBlock: {
    alignItems: 'center',
  },
  statusBlock: {
    alignItems: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
  },
  labelSmall: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  refText: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  statusBadgeText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  contactSection: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  btnCallStation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#CA8A04',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  btnCallStationText: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnCallPatrol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  btnCallPatrolText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timelineCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  timelineTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  timelineLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  timelineTime: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  btnStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnStatusText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnHome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnHomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
