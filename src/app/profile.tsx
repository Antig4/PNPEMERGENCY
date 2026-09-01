import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Mail, Shield, LogOut, FileText, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { usePatrolAuth } from '../context/PatrolAuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { formatDate } from '../utils/formatters';

import { handleSafeBack } from '../utils/navigation';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout: citizenLogout } = useAuth();
  const { logout: patrolLogout } = usePatrolAuth();
  // Enforce CITIZEN-only access
  useRoleGuard('CITIZEN');

  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await citizenLogout();
      await patrolLogout();
    } catch (e) {
      console.warn('[ProfileScreen] Logout error:', e);
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/home')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Badge Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <User color="#3B82F6" size={38} />
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Citizen User'}</Text>
          <Text style={styles.userRole}>REGISTERED CITIZEN</Text>
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>ACCOUNT ID: {user?.id || 'CIT-88219'}</Text>
          </View>
        </View>

        {/* Account Details Group */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>ACCOUNT INFORMATION</Text>

          <View style={styles.infoRow}>
            <User color="#64748B" size={18} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoVal}>{user?.fullName || 'Juan dela Cruz'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Phone color="#64748B" size={18} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Mobile Contact</Text>
              <Text style={styles.infoVal}>{user?.mobileNumber || '0917 123 4567'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Mail color="#64748B" size={18} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoVal}>{user?.email || 'juan.delacruz@example.com'}</Text>
            </View>
          </View>

          <View style={styles.infoRowNoBorder}>
            <Shield color="#64748B" size={18} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Registration Date</Text>
              <Text style={styles.infoVal}>
                {user?.createdAt ? formatDate(user.createdAt) : 'Aug 23, 2026'}
              </Text>
            </View>
          </View>
        </View>

        {/* System & Dispatch Disclaimer */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PUBLIC SAFETY SYSTEM</Text>

          <View style={styles.noticeBox}>
            <CheckCircle2 color="#10B981" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Session Security Enabled</Text>
              <Text style={styles.noticeText}>
                Your session is safely stored in mobile SecureStore. You do not need to re-login during emergencies.
              </Text>
            </View>
          </View>

          <View style={styles.noticeBoxWarning}>
            <FileText color="#F59E0B" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitleWarning}>PNP GIS Dispatch Protocol</Text>
              <Text style={styles.noticeTextWarning}>
                Emergency location reports are dispatched to BCPO Station 1 & nearest available patrol units. False reports are audited.
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.btnLogout, isLoggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FCA5A5" />
          ) : (
            <LogOut color="#EF4444" size={18} />
          )}
          <Text style={styles.btnLogoutText}>
            {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT ACCOUNT'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    fontWeight: '800',
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  userRole: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  idChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  idChipText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  infoRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  infoVal: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  noticeTitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeText: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  noticeBoxWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2D1B0D',
    borderColor: '#78350F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  noticeTitleWarning: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeTextWarning: {
    color: '#FEF3C7',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  btnLogoutText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
