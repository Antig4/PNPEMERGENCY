import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { MapPin, AlertTriangle, RefreshCw, Compass } from 'lucide-react-native';
import { LocationCoordinates } from '../types/location';
import { formatCoordinates } from '../utils/formatters';

interface LocationStatusProps {
  coordinates: LocationCoordinates | null;
  isReady: boolean;
  permissionDenied: boolean;
  servicesDisabled: boolean;
  isLoading?: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  coordinates,
  isReady,
  permissionDenied,
  servicesDisabled,
  isLoading = false,
  onRefresh,
  onOpenSettings,
}) => {
  if (permissionDenied || servicesDisabled) {
    return (
      <View style={[styles.card, styles.cardWarning]}>
        <View style={styles.headerRow}>
          <AlertTriangle color="#F59E0B" size={20} />
          <Text style={styles.warningTitle}>⚠️ Location Disabled</Text>
        </View>
        <Text style={styles.warningMessage}>
          {permissionDenied
            ? 'Location permission is required to send your emergency coordinates to responder units.'
            : 'Device Location Services (GPS) are turned off on your device.'}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnAction} onPress={onOpenSettings}>
            <Compass color="#FFFFFF" size={14} />
            <Text style={styles.btnActionText}>Enable Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAction, styles.btnSecondary]} onPress={onRefresh}>
            <RefreshCw color="#9CA3AF" size={14} />
            <Text style={styles.btnSecondaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MapPin color="#10B981" size={20} />
        <Text style={styles.readyTitle}>📍 Location Ready</Text>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh} disabled={isLoading}>
          <RefreshCw color="#6B7280" size={16} />
        </TouchableOpacity>
      </View>

      {coordinates ? (
        <View style={styles.coordDetails}>
          <Text style={styles.coordText}>
            GPS: {formatCoordinates(coordinates.latitude, coordinates.longitude)}
          </Text>
          {coordinates.accuracy !== null && (
            <Text style={styles.accuracyText}>Accuracy: ±{coordinates.accuracy}m</Text>
          )}
        </View>
      ) : (
        <Text style={styles.loadingText}>
          {isLoading ? '📡 Acquiring GPS coordinates...' : 'Tap below to obtain latest location'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardWarning: {
    backgroundColor: '#2D1B0D',
    borderColor: '#78350F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  readyTitle: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  warningMessage: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#334155',
  },
  btnSecondaryText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  coordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  coordText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracyText: {
    color: '#64748B',
    fontSize: 11,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  refreshIconBtn: {
    padding: 4,
  },
});
