import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, MapPin, Zap, Lock, ArrowRight, UserCheck } from 'lucide-react-native';
import { locationService } from '../services/locationService';
import { LocationExplanationModal } from '../components/LocationExplanationModal';

export default function WelcomeScreen() {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const handleGetStarted = () => {
    setShowLocationModal(true);
  };

  const handleGrantLocation = async () => {
    try {
      const status = await locationService.requestPermission();
      if (status === 'granted') {
        setShowLocationModal(false);
        router.push('/register');
      } else {
        setPermissionDenied(true);
      }
    } catch (e) {
      console.warn('[WelcomeScreen] Location permission error:', e);
      setShowLocationModal(false);
      router.push('/register');
    }
  };

  const handleOpenSettings = () => {
    locationService.openDeviceSettings();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.shieldBadge}>
            <Shield color="#60A5FA" size={54} strokeWidth={2.2} />
          </View>
          <Text style={styles.appName}>PNP EmergencyLink</Text>
          <View style={styles.taglineChip}>
            <Text style={styles.taglineText}>Swift Response. Safe Butuan.</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.shortDescription}>
            Quickly send your location to the nearest available emergency responder.
          </Text>

          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Zap color="#F59E0B" size={18} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>One-Tap Dispatch</Text>
                <Text style={styles.featureSub}>Instant coordinate alert transmission</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MapPin color="#10B981" size={18} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>GIS Proximity Match</Text>
                <Text style={styles.featureSub}>Find nearest patrol officer in real-time</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Lock color="#3B82F6" size={18} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Persistent Session</Text>
                <Text style={styles.featureSub}>Never get locked out during critical alerts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer Notice */}
        <Text style={styles.disclaimerText}>
          PNP EmergencyLink Thesis Prototype • Official Public Safety GIS Integration
        </Text>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.btnStarted}
            onPress={handleGetStarted}
          >
            <Text style={styles.btnStartedText}>GET STARTED</Text>
            <ArrowRight color="#FFFFFF" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.btnLoginLink}
            onPress={() => router.push('/login')}
          >
            <UserCheck color="#60A5FA" size={16} />
            <Text style={styles.loginLinkText}>Already registered? Login here</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.btnPatrolPortal}
            onPress={() => router.push('/login')}
          >
            <Shield color="#F59E0B" size={16} />
            <Text style={styles.btnPatrolPortalText}>PATROL OFFICER PORTAL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Explanation Modal */}
      <LocationExplanationModal
        visible={showLocationModal}
        isDeniedState={permissionDenied}
        onGrantPress={handleGrantLocation}
        onOpenSettingsPress={handleOpenSettings}
        onClose={() => setShowLocationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  shieldBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  taglineChip: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  taglineText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shortDescription: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureGrid: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  featureSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 8,
  },
  actionContainer: {
    gap: 12,
    marginTop: 8,
  },
  btnStarted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnLoginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  loginLinkText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPatrolPortal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#78350F',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  btnPatrolPortalText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
