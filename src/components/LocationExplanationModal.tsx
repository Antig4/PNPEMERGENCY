import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { MapPin, ShieldCheck, AlertTriangle, Settings, ArrowRight } from 'lucide-react-native';

interface LocationExplanationModalProps {
  visible: boolean;
  isDeniedState?: boolean;
  onGrantPress: () => void;
  onOpenSettingsPress?: () => void;
  onClose?: () => void;
}

export const LocationExplanationModal: React.FC<LocationExplanationModalProps> = ({
  visible,
  isDeniedState = false,
  onGrantPress,
  onOpenSettingsPress,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.iconHeader, isDeniedState && styles.iconHeaderDenied]}>
            {isDeniedState ? (
              <AlertTriangle color="#F59E0B" size={36} />
            ) : (
              <MapPin color="#3B82F6" size={36} />
            )}
          </View>

          <Text style={styles.title}>
            {isDeniedState ? 'Location Access Required' : 'Enable Emergency Location'}
          </Text>

          <Text style={styles.explanationText}>
            PNP EmergencyLink needs your location to identify the nearest available emergency responder and send your emergency location.
          </Text>

          {!isDeniedState ? (
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <ShieldCheck color="#10B981" size={18} />
                <Text style={styles.bulletText}>Fast dispatch to nearby patrol units</Text>
              </View>
              <View style={styles.bulletRow}>
                <ShieldCheck color="#10B981" size={18} />
                <Text style={styles.bulletText}>No typing coordinates required during emergency</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.deniedNotice}>
              Location access is currently blocked. To use quick emergency dispatch, please enable Location Permissions in your phone settings.
            </Text>
          )}

          <View style={styles.buttonContainer}>
            {isDeniedState ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.primaryBtn}
                  onPress={onOpenSettingsPress}
                >
                  <Settings color="#FFFFFF" size={18} />
                  <Text style={styles.primaryBtnText}>OPEN SETTINGS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={onGrantPress}>
                  <Text style={styles.secondaryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.primaryBtn}
                onPress={onGrantPress}
              >
                <Text style={styles.primaryBtnText}>ALLOW LOCATION ACCESS</Text>
                <ArrowRight color="#FFFFFF" size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 20,
  },
  iconHeader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  iconHeaderDenied: {
    borderColor: '#F59E0B',
    backgroundColor: '#2D1B0D',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  explanationText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  bulletList: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  deniedNotice: {
    color: '#FCD34D',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    backgroundColor: '#2D1B0D',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
