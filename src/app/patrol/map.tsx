import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Navigation, MapPin, Shield, Compass, ExternalLink } from 'lucide-react-native';
import { usePatrolAuth } from '../../context/PatrolAuthContext';
import { PatrolMapCard } from '../../components/patrol/PatrolMapCard';
import { handleSafeBack } from '../../utils/navigation';

export default function PatrolMapScreen() {
  const router = useRouter();
  const { officer, activeAssignment } = usePatrolAuth();

  const officerLat = officer?.latitude || 8.9482;
  const officerLng = officer?.longitude || 125.5412;
  const incidentLat = activeAssignment?.latitude || 8.9475;
  const incidentLng = activeAssignment?.longitude || 125.5406;
  const distanceKm = activeAssignment?.distanceKm || 0.8;

  const handleLaunchTurnByTurn = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${incidentLat},${incidentLng}`,
      android: `geo:0,0?q=${incidentLat},${incidentLng}(Emergency Target)`,
      default: `https://www.google.com/maps/dir/?api=1&origin=${officerLat},${officerLng}&destination=${incidentLat},${incidentLng}&travelmode=driving`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/patrol/dashboard')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GIS Incident Navigation</Text>
        <TouchableOpacity style={styles.extBtn} onPress={handleLaunchTurnByTurn}>
          <ExternalLink color="#60A5FA" size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Active Route Summary Banner */}
        <View style={styles.routeHeaderCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetBadge}>
              <MapPin color="#EF4444" size={16} />
              <Text style={styles.targetBadgeText}>INCIDENT TARGET</Text>
            </View>
            <Text style={styles.incIdText}>{activeAssignment?.id || 'INC-00021'}</Text>
          </View>

          <Text style={styles.incTypeTitle}>
            {activeAssignment?.emergencyType || 'Crime / Police Emergency'}
          </Text>

          <View style={styles.distRow}>
            <Navigation color="#60A5FA" size={16} />
            <Text style={styles.distVal}>{distanceKm} km away</Text>
            <Text style={styles.etaVal}>• Est. Arrival: ~2 mins</Text>
          </View>
        </View>

        {/* Map Visualization */}
        <PatrolMapCard
          officerLat={officerLat}
          officerLng={officerLng}
          incidentLat={incidentLat}
          incidentLng={incidentLng}
          distanceKm={distanceKm}
          onNavigatePress={handleLaunchTurnByTurn}
        />

        {/* Live GPS Broadcast Indicator */}
        <View style={styles.broadcastBox}>
          <Compass color="#10B981" size={18} />
          <View style={{ flex: 1 }}>
            <Text style={styles.broadcastTitle}>Live Patrol Tracking Active</Text>
            <Text style={styles.broadcastSub}>
              Patrol location is being continuously broadcasted to Station Dispatch & Admin Monitoring while RESPONDING.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.btnLaunchNav} onPress={handleLaunchTurnByTurn}>
          <Navigation color="#FFFFFF" size={20} />
          <Text style={styles.btnLaunchText}>LAUNCH EXTERNAL MAP NAVIGATION</Text>
        </TouchableOpacity>
      </View>
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
  extBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    flex: 1,
  },
  routeHeaderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  targetBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  incIdText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '900',
  },
  incTypeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  distVal: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  etaVal: {
    color: '#94A3B8',
    fontSize: 12,
  },
  broadcastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    gap: 10,
  },
  broadcastTitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
  },
  broadcastSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  btnLaunchNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    marginTop: 'auto',
  },
  btnLaunchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
