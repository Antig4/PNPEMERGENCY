import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { PatrolStatus } from '../../types/patrol';

interface PatrolStatusBadgeProps {
  status: PatrolStatus;
  onPressToggle?: () => void;
  interactive?: boolean;
}

export const PatrolStatusBadge: React.FC<PatrolStatusBadgeProps> = ({
  status,
  onPressToggle,
  interactive = false,
}) => {
  const getStatusConfig = (st: PatrolStatus) => {
    switch (st) {
      case 'AVAILABLE':
        return { label: '🟢 AVAILABLE', bg: '#064E3B', border: '#059669', text: '#34D399' };
      case 'RESPONDING':
        return { label: '🔵 RESPONDING', bg: '#1E3A8A', border: '#2563EB', text: '#60A5FA' };
      case 'ON_SCENE':
        return { label: '🟡 ON SCENE', bg: '#713F12', border: '#CA8A04', text: '#FACC15' };
      case 'OFF_DUTY':
        return { label: '⚪ OFF DUTY', bg: '#374151', border: '#4B5563', text: '#9CA3AF' };
      case 'OFFLINE':
        return { label: '🔴 OFFLINE', bg: '#450A0A', border: '#991B1B', text: '#FCA5A5' };
      default:
        return { label: st, bg: '#1E293B', border: '#334155', text: '#CBD5E1' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>

      {interactive && onPressToggle && (
        <TouchableOpacity style={styles.toggleBtn} onPress={onPressToggle}>
          <Text style={styles.toggleBtnText}>
            {status === 'AVAILABLE' ? 'GO OFF DUTY' : 'GO AVAILABLE'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  toggleBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
});
