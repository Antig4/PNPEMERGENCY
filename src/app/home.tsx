import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, User, History, ChevronRight, Sliders, AlertTriangle, XCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { EmergencyButton } from '../components/EmergencyButton';
import { LocationStatus } from '../components/LocationStatus';
import { IncidentCard } from '../components/IncidentCard';
import { CategoryPickerModal } from '../components/CategoryPickerModal';
import { IncidentDetailsModal } from '../components/IncidentDetailsModal';
import { ResponderCallModal } from '../components/ResponderCallModal';
import { locationService } from '../services/locationService';
import { incidentService } from '../services/incidentService';
import { LocationCoordinates } from '../types/location';
import { EmergencyCategory, Incident } from '../types/incident';

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeIncident, refreshActiveIncident, setActiveIncident } = useAuth();
  // Enforce CITIZEN-only access — redirects patrol officers to /patrol/dashboard
  useRoleGuard('CITIZEN');

  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [isLocationReady, setIsLocationReady] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [servicesDisabled, setServicesDisabled] = useState<boolean>(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  const [emergencyCategory, setEmergencyCategory] = useState<EmergencyCategory>('Crime / Police Emergency');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [showResponderCallModal, setShowResponderCallModal] = useState<boolean>(false);
  const [createdIncidentForCall, setCreatedIncidentForCall] = useState<Incident | null>(null);
  const [isSendingEmergency, setIsSendingEmergency] = useState<boolean>(false);

  const [historyList, setHistoryList] = useState<Incident[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  // Tracks a recently-cancelled incident so we can show a dismissible notification
  const [cancelledNotice, setCancelledNotice] = useState<Incident | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadInitialState();
    }, [])
  );

  const loadInitialState = async () => {
    await fetchGPSLocation();
    const active = await refreshActiveIncident();

    // If we got back a cancelled incident, surface the notice banner
    if (!active) {
      // Check history for most recent cancelled item (top 1)
      try {
        const history = await incidentService.getIncidentHistory();
        const mostRecent = history[0];
        if (mostRecent && mostRecent.status === 'CANCELLED') {
          setCancelledNotice(mostRecent);
        }
        setHistoryList(history.slice(0, 3));
      } catch (_) {}
    } else {
      const history = await incidentService.getIncidentHistory();
      setHistoryList(history.slice(0, 3));
    }
  };

  const fetchGPSLocation = async () => {
    setIsFetchingLocation(true);
    setPermissionDenied(false);
    setServicesDisabled(false);

    try {
      const isEnabled = await locationService.checkLocationServicesEnabled();
      if (!isEnabled) {
        setServicesDisabled(true);
        setIsLocationReady(false);
        setIsFetchingLocation(false);
        return;
      }

      const coords = await locationService.getCurrentLocation();
      setLocation(coords);
      setIsLocationReady(true);
    } catch (e: any) {
      console.warn('[HomeScreen] fetchGPSLocation error:', e.message);
      if (e.message.includes('permission denied')) {
        setPermissionDenied(true);
      } else if (e.message.includes('Location Services')) {
        setServicesDisabled(true);
      }
      setIsLocationReady(false);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleOpenSettings = () => {
    locationService.openDeviceSettings();
  };

  const handleSendEmergency = async () => {
    // If there is an ongoing active incident (not resolved/cancelled), alert citizen
    if (activeIncident && activeIncident.status !== 'RESOLVED' && activeIncident.status !== 'CANCELLED') {
      Alert.alert(
        'Active Emergency in Progress',
        `You already have an active emergency alert (${activeIncident.referenceNumber || activeIncident.id}) in progress.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Incident', onPress: () => router.push(`/incident/${activeIncident.id}`) },
        ]
      );
      return;
    }

    // Acquire GPS location first if not ready
    if (!location || !isLocationReady) {
      try {
        const currentCoords = await locationService.getCurrentLocation();
        setLocation(currentCoords);
        setIsLocationReady(true);
      } catch (locErr: any) {
        Alert.alert(
          'Unable to obtain location',
          'Unable to get your current location. Please make sure Location Services (GPS) are enabled.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleSendEmergency },
            { text: 'Enable Settings', onPress: handleOpenSettings },
          ]
        );
        return;
      }
    }

    // Open Incident Details Form Modal FIRST (Requirement: form must be submitted before call)
    setShowIncidentModal(true);
  };

  const handleFormSubmit = async (formData: {
    emergencyType: EmergencyCategory;
    description: string;
    photoUrl?: string;
    videoUrl?: string;
  }) => {
    let currentCoords = location;
    if (!currentCoords) {
      currentCoords = await locationService.getCurrentLocation();
      setLocation(currentCoords);
    }

    setIsSendingEmergency(true);
    try {
      // Create incident in backend FIRST (Server-authoritative GIS Routing)
      const newIncident = await incidentService.createIncident({
        citizenId: user?.id || 'CIT-88219',
        emergencyType: formData.emergencyType,
        location: currentCoords,
        contactNumber: user?.mobileNumber || '09171234567',
        description: formData.description,
        photoUrl: formData.photoUrl,
        videoUrl: formData.videoUrl,
      });

      setActiveIncident(newIncident);
      setCreatedIncidentForCall(newIncident);
      setShowIncidentModal(false);
      setShowResponderCallModal(true);
    } catch (err: any) {
      Alert.alert('Emergency Submission Error', err?.message || 'Failed to register emergency report.');
      throw err;
    } finally {
      setIsSendingEmergency(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialState();
    setRefreshing(false);
  };

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Citizen';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.smallShield}>
            <Shield color="#3B82F6" size={20} />
          </View>
          <View>
            <Text style={styles.greetingText}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreetingText}>PNP EmergencyLink Citizen App</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/history')}
          >
            <History color="#94A3B8" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/profile')}
          >
            <User color="#94A3B8" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Active Incident Banner (only if active incident exists and is NOT resolved/cancelled) */}
        {activeIncident && activeIncident.status !== 'RESOLVED' && activeIncident.status !== 'CANCELLED' && (
          <View style={styles.activeIncidentSection}>
            <IncidentCard
              incident={activeIncident}
              isActiveHighlight={true}
              onPress={() => router.push(`/incident/${activeIncident.id}`)}
            />
          </View>
        )}

        {/* Cancellation Notice Banner — shown when admin cancels an incident */}
        {cancelledNotice && (
          <View style={styles.cancelledNoticeBanner}>
            <View style={styles.cancelledNoticeIconRow}>
              <XCircle color="#F87171" size={20} />
              <Text style={styles.cancelledNoticeTitle}>Report Cancelled by Admin</Text>
            </View>
            <Text style={styles.cancelledNoticeRef}>Reference: {cancelledNotice.id}</Text>
            <Text style={styles.cancelledNoticeBody}>
              Your emergency report was cancelled by PNP Dispatch. You may submit a new report if this was an error or if you still need assistance.
            </Text>
            <View style={styles.cancelledNoticeActions}>
              <TouchableOpacity
                style={styles.cancelledNoticeDismiss}
                onPress={() => setCancelledNotice(null)}
              >
                <Text style={styles.cancelledNoticeDismissText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelledNoticeNewReport}
                onPress={() => setCancelledNotice(null)}
              >
                <Text style={styles.cancelledNoticeNewReportText}>Send New Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Location Status Bar */}
        <LocationStatus
          coordinates={location}
          isReady={isLocationReady}
          permissionDenied={permissionDenied}
          servicesDisabled={servicesDisabled}
          isLoading={isFetchingLocation}
          onRefresh={fetchGPSLocation}
          onOpenSettings={handleOpenSettings}
        />

        {/* Emergency Category Selector Bar */}
        <View style={styles.categorySelectorContainer}>
          <Text style={styles.categoryLabel}>EMERGENCY TYPE:</Text>
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categoryChipText}>{emergencyCategory}</Text>
            <Sliders color="#60A5FA" size={14} />
          </TouchableOpacity>
        </View>

        {/* Primary Emergency Action Section */}
        <View style={styles.emergencySection}>
          <EmergencyButton
            onPress={handleSendEmergency}
            isLoading={isSendingEmergency}
            disabled={isFetchingLocation && !location}
            emergencyType={emergencyCategory}
          />
          <Text style={styles.instructionText}>
            Tap to instantly broadcast your GPS coordinates to nearest PNP patrol officer
          </Text>
        </View>

        {/* Recent History Quick Section */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>Recent Incident History</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/history')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight color="#60A5FA" size={16} />
            </TouchableOpacity>
          </View>

          {historyList.length > 0 ? (
            historyList.map(item => (
              <IncidentCard
                key={item.id}
                incident={item}
                onPress={() => router.push(`/incident/${item.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryText}>No emergency incidents reported yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Emergency Category Selector Modal */}
      <CategoryPickerModal
        visible={showCategoryModal}
        selectedCategory={emergencyCategory}
        onSelect={(cat) => setEmergencyCategory(cat)}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Incident Form Modal — Mandatory Submission Before Call */}
      <IncidentDetailsModal
        visible={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSubmit={handleFormSubmit}
        location={location}
        initialCategory={emergencyCategory}
        isSubmitting={isSendingEmergency}
      />

      {/* Responder Confirmation & Phone Call Trigger Modal */}
      <ResponderCallModal
        visible={showResponderCallModal}
        incident={createdIncidentForCall}
        onConfirmContact={async (incId) => {
          try {
            console.log('[Home] Citizen confirmed responder contacted for incident:', incId);
          } catch (e) {
            console.warn('Confirm contact update error:', e);
          }
        }}
        onContinue={() => {
          setShowResponderCallModal(false);
          if (createdIncidentForCall) {
            router.push(`/incident/${createdIncidentForCall.id}`);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallShield: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subGreetingText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  activeIncidentSection: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  categorySelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  categoryChipText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  emergencySection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  instructionText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
    lineHeight: 17,
  },
  historySection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historySectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHistoryCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyHistoryText: {
    color: '#64748B',
    fontSize: 13,
  },
  cancelledNoticeBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1C0A0A',
    borderWidth: 1.5,
    borderColor: '#7F1D1D',
    borderRadius: 14,
    padding: 14,
  },
  cancelledNoticeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cancelledNoticeTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '900',
  },
  cancelledNoticeRef: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  cancelledNoticeBody: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cancelledNoticeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelledNoticeDismiss: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  cancelledNoticeDismissText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelledNoticeNewReport: {
    flex: 2,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  cancelledNoticeNewReportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
