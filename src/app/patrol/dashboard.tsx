import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Bell, History, LogOut, Navigation, CheckCircle2, AlertCircle, Radio, Sparkles, MapPin } from 'lucide-react-native';
import { usePatrolAuth } from '../../context/PatrolAuthContext';
import { useAuth } from '../../context/AuthContext';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { PatrolStatusBadge } from '../../components/patrol/PatrolStatusBadge';
import { EmergencyDispatchModal } from '../../components/patrol/EmergencyDispatchModal';
import { patrolService } from '../../services/patrolService';
import { PatrolOfficerStats } from '../../types/patrol';
import { IncidentCard } from '../../components/IncidentCard';
import { formatDateTime } from '../../utils/formatters';

export default function PatrolDashboardScreen() {
  const router = useRouter();
  const {
    officer,
    logout: patrolLogout,
    patrolStatus,
    updateStatus,
    activeAssignment,
    incomingAlert,
    acceptIncident,
    declineIncident,
    dismissAlert,
    triggerMockDispatchAlert,
    refreshAssignment,
  } = usePatrolAuth();
  const { logout: citizenLogout } = useAuth();
  // Enforce PATROL_OFFICER-only access — redirects citizens to /home
  useRoleGuard('PATROL_OFFICER');

  const [stats, setStats] = useState<PatrolOfficerStats>({ todayTotal: 4, resolved: 3, active: 1 });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (officer) {
      const s = await patrolService.getOfficerStats(officer.id);
      setStats(s);
      await refreshAssignment();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleToggleDuty = async () => {
    const nextStatus = patrolStatus === 'AVAILABLE' ? 'OFF_DUTY' : 'AVAILABLE';
    await updateStatus(nextStatus);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await patrolLogout();
      await citizenLogout();
    } catch (e) {
      console.warn('[PatrolDashboard] Logout error:', e);
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldCircle}>
            <Shield color="#3B82F6" size={22} />
          </View>
          <View>
            <Text style={styles.appName}>PNP EmergencyLink</Text>
            <Text style={styles.headerTitle}>Patrol Dashboard</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/patrol/history')}
          >
            <History color="#94A3B8" size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <LogOut color="#EF4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Officer Status Card */}
        <View style={styles.officerCard}>
          <View style={styles.officerHeader}>
            <View>
              <Text style={styles.officerName}>{officer?.name || 'Patrol 01'}</Text>
              <Text style={styles.officerBadge}>{officer?.badgeNumber || 'BCPO-99421'} • {officer?.unitName || 'Mobile Patrol Unit 1'}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>PATROL AVAILABILITY STATUS:</Text>
            <PatrolStatusBadge
              status={patrolStatus}
              interactive={true}
              onPressToggle={handleToggleDuty}
            />
          </View>
        </View>

        {/* Statistics Bar */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.todayTotal}</Text>
            <Text style={styles.statLabel}>Today's Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#10B981' }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>
              {activeAssignment ? 1 : stats.active}
            </Text>
            <Text style={styles.statLabel}>Active Duty</Text>
          </View>
        </View>

        {/* Priority Active Incident Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ACTIVE EMERGENCY ASSIGNMENT</Text>
        </View>

        {activeAssignment ? (
          <View style={styles.activeAssignmentCard}>
            <View style={styles.assignmentTop}>
              <View style={styles.activeBadge}>
                <Radio color="#FFFFFF" size={14} />
                <Text style={styles.activeBadgeText}>ACTIVE ASSIGNMENT</Text>
              </View>
              <Text style={styles.incId}>{activeAssignment.id}</Text>
            </View>

            <Text style={styles.incType}>{activeAssignment.emergencyType}</Text>
            <Text style={styles.incTime}>Dispatched: {formatDateTime(activeAssignment.timestamp)}</Text>

            <View style={styles.assignStatusBox}>
              <Text style={styles.assignStatusLabel}>Current Patrol Status:</Text>
              <Text style={styles.assignStatusVal}>{activeAssignment.status}</Text>
            </View>

            <View style={styles.assignActions}>
              <TouchableOpacity
                style={styles.btnNavMap}
                onPress={() => router.push('/patrol/map')}
              >
                <Navigation color="#FFFFFF" size={16} />
                <Text style={styles.btnActionText}>NAVIGATE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnViewDetails}
                onPress={() => router.push(`/patrol/incident/${activeAssignment.id}` as any)}
              >
                <Text style={styles.btnActionText}>VIEW INCIDENT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noActiveCard}>
            <CheckCircle2 color="#64748B" size={36} />
            <Text style={styles.noActiveTitle}>No Active Incident</Text>
            <Text style={styles.noActiveSub}>
              You are currently monitoring dispatches. When the GIS backend assigns an emergency, a high-priority alert will trigger here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Emergency Dispatch Alert Notification Modal */}
      <EmergencyDispatchModal
        notification={incomingAlert}
        onAccept={async (incId) => {
          const accepted = await acceptIncident(incId);
          if (accepted) {
            router.push(`/patrol/incident/${incId}` as any);
          }
        }}
        onDecline={async (incId, reason, note) => {
          await declineIncident(incId, reason, note);
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
  header: {
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
  shieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  appName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  officerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  officerHeader: {
    marginBottom: 12,
  },
  officerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  officerBadge: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    gap: 8,
  },
  statusLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeAssignmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    marginBottom: 16,
  },
  assignmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  incId: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '900',
  },
  incType: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  incTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  assignStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
    justifyContent: 'space-between',
  },
  assignStatusLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  assignStatusVal: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  assignActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnNavMap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnViewDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  noActiveCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  noActiveTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  noActiveSub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  btnSimulateDispatch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1B0D',
    borderColor: '#78350F',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  btnSimulateText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '800',
  },
});
