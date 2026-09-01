import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from 'react-native';
import { Navigation, MapPin, Compass, Shield, ExternalLink, CheckCircle2, Target } from 'lucide-react-native';
import { formatCoordinates } from '../../utils/formatters';

interface PatrolMapCardProps {
  officerLat: number;
  officerLng: number;
  incidentLat: number;
  incidentLng: number;
  distanceKm: number;
  incidentAddress?: string;
  isOnScene?: boolean;
  onNavigatePress?: () => void;
}

export const PatrolMapCard: React.FC<PatrolMapCardProps> = ({
  officerLat,
  officerLng,
  incidentLat,
  incidentLng,
  distanceKm,
  incidentAddress = 'Butuan City Incident Target',
  isOnScene = false,
  onNavigatePress,
}) => {
  const handleOpenExternalMap = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${incidentLat},${incidentLng}`,
      android: `geo:${incidentLat},${incidentLng}?q=${incidentLat},${incidentLng}(Exact Incident Location)`,
      default: `https://www.google.com/maps/search/?api=1&query=${incidentLat},${incidentLng}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={[styles.card, isOnScene && styles.cardOnScene]}>
      {isOnScene ? (
        /* ON SCENE Exact Incident Map View */
        <View style={styles.onSceneGraphicBox}>
          <View style={styles.gridOverlay} />
          
          <View style={styles.onSceneBadgeHeader}>
            <CheckCircle2 color="#10B981" size={16} />
            <Text style={styles.onSceneBadgeText}>ARRIVED ON SCENE — EXACT INCIDENT LOCATION</Text>
          </View>

          <View style={styles.targetPulseCircle}>
            <Target color="#10B981" size={42} />
          </View>

          <View style={styles.incidentMarkerOnScene}>
            <MapPin color="#FFFFFF" size={18} />
            <Text style={styles.incidentMarkerText}>EXACT INCIDENT POINT</Text>
          </View>
        </View>
      ) : (
        /* En Route / Standard Patrol Map View */
        <View style={styles.mapGraphicBox}>
          <View style={styles.gridOverlay} />
          
          {/* Officer Node */}
          <View style={styles.officerMarker}>
            <Shield color="#FFFFFF" size={16} />
            <Text style={styles.markerText}>Patrol Unit</Text>
          </View>

          {/* Route Line Simulation */}
          <View style={styles.routeLineContainer}>
            <View style={styles.dashedLine} />
            <View style={styles.distPill}>
              <Navigation color="#60A5FA" size={12} />
              <Text style={styles.distPillText}>{distanceKm} km route</Text>
            </View>
          </View>

          {/* Incident Node */}
          <View style={styles.incidentMarker}>
            <MapPin color="#FFFFFF" size={18} />
            <Text style={styles.incidentMarkerText}>INCIDENT TARGET</Text>
          </View>
        </View>
      )}

      <View style={styles.mapInfoFooter}>
        <View style={styles.coordCol}>
          <Text style={styles.coordLabel}>
            {isOnScene ? 'EXACT INCIDENT GPS POSITION' : 'TARGET GPS COORDINATES'}
          </Text>
          <Text style={[styles.coordValue, isOnScene && styles.coordValueOnScene]}>
            {formatCoordinates(incidentLat, incidentLng)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btnNavigate, isOnScene && styles.btnNavigateOnScene]}
          onPress={onNavigatePress || handleOpenExternalMap}
        >
          {isOnScene ? (
            <>
              <ExternalLink color="#000000" size={16} />
              <Text style={styles.btnNavigateTextOnScene}>OPEN EXACT MAP</Text>
            </>
          ) : (
            <>
              <Navigation color="#FFFFFF" size={16} />
              <Text style={styles.btnNavigateText}>NAVIGATE</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    marginVertical: 10,
  },
  cardOnScene: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  mapGraphicBox: {
    height: 180,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    position: 'relative',
  },
  onSceneGraphicBox: {
    height: 190,
    backgroundColor: '#052E16',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  onSceneBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  onSceneBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  targetPulseCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  officerMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  routeLineContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  dashedLine: {
    width: 2,
    height: 30,
    backgroundColor: '#3B82F6',
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginTop: -15,
  },
  distPillText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700',
  },
  incidentMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    elevation: 4,
    alignSelf: 'flex-end',
  },
  incidentMarkerOnScene: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    elevation: 4,
  },
  incidentMarkerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapInfoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  coordCol: {
    flex: 1,
  },
  coordLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coordValue: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  coordValueOnScene: {
    color: '#34D399',
  },
  btnNavigate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  btnNavigateOnScene: {
    backgroundColor: '#10B981',
  },
  btnNavigateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnNavigateTextOnScene: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
