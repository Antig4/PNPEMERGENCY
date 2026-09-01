import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { ShieldAlert, Navigation, Phone, User, Check, X, MapPin } from 'lucide-react-native';
import { SystemNotification } from '../../services/notificationService';
import { DeclineReasonModal } from './DeclineReasonModal';
import { DeclineReason } from '../../types/patrol';

interface EmergencyDispatchModalProps {
  notification: SystemNotification | null;
  onAccept: (incidentId: string) => void;
  onDecline: (incidentId: string, reason: DeclineReason, note?: string) => void;
}

export const EmergencyDispatchModal: React.FC<EmergencyDispatchModalProps> = ({
  notification,
  onAccept,
  onDecline,
}) => {
  const [showDeclineReason, setShowDeclineReason] = useState<boolean>(false);

  if (!notification) return null;

  const data = notification.data || notification || {};
  const incidentId = notification.incidentId || data.incidentId || notification.referenceNumber || data.referenceNumber || 'INC-00021';

  const handleDeclineSubmit = (reason: DeclineReason, note: string) => {
    setShowDeclineReason(false);
    onDecline(incidentId, reason, note);
  };

  return (
    <>
      <Modal visible={!showDeclineReason} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.topBanner}>
              <ShieldAlert color="#FFFFFF" size={24} />
              <Text style={styles.topBannerText}>🚨 NEW EMERGENCY DISPATCH</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.rowBetween}>
                <Text style={styles.incId}>{incidentId}</Text>
                <View style={styles.distBadge}>
                  <Navigation color="#60A5FA" size={13} />
                  <Text style={styles.distText}>{data.distanceKm || 0.8} km away</Text>
                </View>
              </View>

              <Text style={styles.typeText}>{data.emergencyType || 'Crime / Police Emergency'}</Text>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <User color="#64748B" size={16} />
                  <Text style={styles.infoVal}>{data.citizenName || 'Registered Citizen (Juan dela Cruz)'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Phone color="#64748B" size={16} />
                  <Text style={styles.infoVal}>{data.contactNumber || '0917 123 4567'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MapPin color="#10B981" size={16} />
                  <Text style={styles.infoValMono}>
                    Lat: {data.latitude || 8.9475}, Lng: {data.longitude || 125.5406}
                  </Text>
                </View>

                {data.description ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>CITIZEN NOTE:</Text>
                    <Text style={styles.noteText}>{data.description}</Text>
                  </View>
                ) : null}

                {data.photoUrl || data.photo_url ? (
                  <View style={styles.evidenceBadge}>
                    <Text style={styles.evidenceBadgeText}>📸 Photo Evidence Attached</Text>
                  </View>
                ) : null}

                {data.videoUrl || data.video_url ? (
                  <View style={styles.evidenceBadge}>
                    <Text style={styles.evidenceBadgeText}>🎥 Video Evidence Attached</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.dispatchNotice}>
                GIS Dispatch match: You are nearest available responder unit.
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnDecline} onPress={() => setShowDeclineReason(true)}>
                  <X color="#FCA5A5" size={18} />
                  <Text style={styles.btnDeclineText}>DECLINE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnAccept} onPress={() => onAccept(incidentId)}>
                  <Check color="#FFFFFF" size={20} strokeWidth={3} />
                  <Text style={styles.btnAcceptText}>ACCEPT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <DeclineReasonModal
        visible={showDeclineReason}
        onDeclineSubmit={handleDeclineSubmit}
        onCancel={() => setShowDeclineReason(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
    overflow: 'hidden',
    elevation: 20,
  },
  topBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  topBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incId: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  distText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  typeText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 14,
  },
  infoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoVal: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValMono: {
    color: '#38BDF8',
    fontSize: 12,
  },
  noteBox: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  noteLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  noteText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  evidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  evidenceBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  dispatchNotice: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnDecline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  btnDeclineText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
  btnAccept: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    elevation: 4,
  },
  btnAcceptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
