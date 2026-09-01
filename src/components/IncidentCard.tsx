import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AlertCircle, Clock, ChevronRight, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react-native';
import { Incident, IncidentStatus } from '../types/incident';
import { formatDateTime, formatDistance } from '../utils/formatters';

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
  isActiveHighlight?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPress,
  isActiveHighlight = false,
}) => {
  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'NEW':
      case 'NOTIFIED':
        return { bg: '#3730A3', text: '#A5B4FC', border: '#4F46E5', label: 'PATROL NOTIFIED' };
      case 'ACCEPTED':
      case 'RESPONDING':
        return { bg: '#9A3412', text: '#FFEDD5', border: '#EA580C', label: 'RESPONDING' };
      case 'ON_SCENE':
        return { bg: '#854D0E', text: '#FEF08A', border: '#CA8A04', label: 'ON SCENE' };
      case 'RESOLVED':
        return { bg: '#065F46', text: '#A7F3D0', border: '#059669', label: 'RESOLVED' };
      case 'CANCELLED':
        return { bg: '#374151', text: '#D1D5DB', border: '#4B5563', label: 'CANCELLED' };
      default:
        return { bg: '#3730A3', text: '#A5B4FC', border: '#4F46E5', label: status };
    }
  };

  const statusStyle = getStatusColor(incident.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isActiveHighlight && styles.activeCard,
      ]}
    >
      {isActiveHighlight && (
        <View style={styles.activeTopBanner}>
          <Text style={styles.activeBannerText}>🚨 ACTIVE EMERGENCY INCIDENT</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.idContainer}>
          <ShieldAlert color={isActiveHighlight ? '#EF4444' : '#60A5FA'} size={18} />
          <Text style={styles.incidentId}>{incident.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <Text style={styles.emergencyType}>{incident.emergencyType}</Text>

      <View style={styles.detailRow}>
        <Clock color="#64748B" size={13} />
        <Text style={styles.detailText}>{formatDateTime(incident.timestamp)}</Text>
      </View>

      {incident.responder && (
        <View style={styles.responderRow}>
          <Text style={styles.responderName}>🚓 {incident.responder.name}</Text>
          <Text style={styles.responderDistance}>{formatDistance(incident.responder.distanceKm)}</Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.viewActionText}>VIEW INCIDENT STATUS</Text>
        <ChevronRight color={isActiveHighlight ? '#EF4444' : '#60A5FA'} size={18} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
    borderWidth: 1.5,
  },
  activeTopBanner: {
    backgroundColor: '#DC2626',
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 10,
    paddingVertical: 5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  activeBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incidentId: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emergencyType: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  responderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  responderName: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  responderDistance: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewActionText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
