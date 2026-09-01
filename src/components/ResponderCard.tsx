import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Shield, Phone, MapPin, Navigation } from 'lucide-react-native';
import { Responder } from '../types/responder';
import { formatDistance } from '../utils/formatters';

interface ResponderCardProps {
  responder: Responder;
  onCallPress?: () => void;
}

export const ResponderCard: React.FC<ResponderCardProps> = ({
  responder,
  onCallPress,
}) => {
  const handleCall = () => {
    if (onCallPress) {
      onCallPress();
    } else if (responder.contactNumber) {
      Linking.openURL(`tel:${responder.contactNumber}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>NEAREST RESPONDER</Text>
        </View>
        <Text style={styles.distanceBadge}>{formatDistance(responder.distanceKm)}</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Shield color="#3B82F6" size={24} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.responderName}>🚓 {responder.name}</Text>
          <Text style={styles.responderType}>{responder.type}</Text>
          <Text style={styles.stationName} numberOfLines={1}>{responder.stationName}</Text>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Phone color="#FFFFFF" size={16} />
          <Text style={styles.callText}>CALL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.etaContainer}>
        <Navigation color="#60A5FA" size={14} />
        <Text style={styles.etaText}>
          Estimated Arrival: <Text style={styles.etaHighlight}>{responder.estimatedArrivalMins} mins</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeContainer: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceBadge: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoCol: {
    flex: 1,
  },
  responderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  responderType: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  stationName: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  etaText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  etaHighlight: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});
