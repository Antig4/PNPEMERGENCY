import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  ShieldAlert,
  Camera,
  Video,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Eye,
} from 'lucide-react-native';
import { LocationCoordinates } from '../types/location';
import { EmergencyCategory } from '../types/incident';
import { EmergencyCameraModal, CapturedEvidenceItem } from './EmergencyCameraModal';
import { EvidenceReviewModal } from './EvidenceReviewModal';

interface IncidentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    emergencyType: EmergencyCategory;
    description: string;
    photoUrl?: string;
    videoUrl?: string;
  }) => Promise<void>;
  location: LocationCoordinates | null;
  initialCategory?: EmergencyCategory;
  isSubmitting?: boolean;
}

const CATEGORIES: { label: EmergencyCategory; icon: string; bg: string; border: string; color: string }[] = [
  {
    label: 'Crime / Police Emergency',
    icon: '🛡️',
    bg: 'rgba(220, 38, 38, 0.15)',
    border: '#DC2626',
    color: '#F87171',
  },
  {
    label: 'Medical Emergency',
    icon: '🚑',
    bg: 'rgba(37, 99, 235, 0.15)',
    border: '#2563EB',
    color: '#60A5FA',
  },
  {
    label: 'Fire / Rescue',
    icon: '🚒',
    bg: 'rgba(217, 119, 6, 0.15)',
    border: '#D97706',
    color: '#FBBF24',
  },
];

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  visible,
  onClose,
  onSubmit,
  location,
  initialCategory = 'Crime / Police Emergency',
  isSubmitting = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>(initialCategory);
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<CapturedEvidenceItem[]>([]);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [submittingLocal, setSubmittingLocal] = useState<boolean>(false);

  const handleConfirmEvidenceFromCamera = (items: CapturedEvidenceItem[]) => {
    setEvidenceItems(items);
    const photo = items.find((i) => i.type === 'photo');
    const video = items.find((i) => i.type === 'video');
    if (photo) setPhotoUrl(photo.uri);
    if (video) setVideoUrl(video.uri);
  };

  const handleRemoveEvidenceItem = (id: string) => {
    const updated = evidenceItems.filter((i) => i.id !== id);
    setEvidenceItems(updated);
    const photo = updated.find((i) => i.type === 'photo');
    const video = updated.find((i) => i.type === 'video');
    setPhotoUrl(photo ? photo.uri : null);
    setVideoUrl(video ? video.uri : null);
  };

  const handleSubmit = async () => {
    // MANDATORY EVIDENCE ENFORCEMENT: At least ONE photo OR video is required
    if (evidenceItems.length === 0 && !photoUrl && !videoUrl) {
      Alert.alert(
        'EVIDENCE REQUIRED ⚠️',
        'Please capture at least one photo or video before submitting your emergency report.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OPEN CAMERA 📸', onPress: () => setShowCameraModal(true) },
        ]
      );
      return;
    }

    setSubmittingLocal(true);
    try {
      await onSubmit({
        emergencyType: selectedCategory,
        description: description.trim() || '',
        photoUrl: photoUrl || undefined,
        videoUrl: videoUrl || undefined,
      });
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Failed to submit emergency report.');
    } finally {
      setSubmittingLocal(false);
    }
  };

  const isBusy = isSubmitting || submittingLocal;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ShieldAlert color="#EF4444" size={24} />
              <Text style={styles.headerTitle}>INCIDENT DETAILS</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isBusy} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
            {/* Step 1: Emergency Category */}
            <Text style={styles.sectionLabel}>1. EMERGENCY CATEGORY *</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: cat.bg, borderColor: isSelected ? cat.border : '#334155' },
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.label)}
                    disabled={isBusy}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <CheckCircle2 color="#FFFFFF" size={14} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 2: Notes / Description (Optional) */}
            <Text style={styles.sectionLabel}>2. NOTES / DESCRIPTION (OPTIONAL)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Describe your situation (optional, e.g. suspect wearing black jacket)..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                editable={!isBusy}
              />
            </View>

            {/* Step 3: Evidence Capture (Mandatory Photo / Video) */}
            <Text style={styles.sectionLabel}>3. EVIDENCE CAPTURE (MANDATORY PHOTO / VIDEO) *</Text>
            
            <TouchableOpacity
              style={styles.launchCameraBtn}
              onPress={() => setShowCameraModal(true)}
              disabled={isBusy}
            >
              <Camera color="#000000" size={22} />
              <Text style={styles.launchCameraBtnText}>
                {evidenceItems.length > 0 || photoUrl || videoUrl
                  ? `OPEN CAMERA (ATTACHED: ${evidenceItems.length || (photoUrl ? 1 : 0) + (videoUrl ? 1 : 0)})`
                  : 'OPEN EVIDENCE CAMERA 📸'}
              </Text>
            </TouchableOpacity>

            {(evidenceItems.length > 0 || photoUrl || videoUrl) ? (
              <View style={styles.attachedEvidenceCard}>
                <View style={styles.attachedHeader}>
                  <Text style={styles.attachedTitle}>✓ Evidence Attached ({evidenceItems.length || 1} files)</Text>
                  <TouchableOpacity
                    style={styles.btnReviewEvidence}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Eye color="#FACC15" size={14} />
                    <Text style={styles.btnReviewText}>REVIEW</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.evidenceRow}>
                  {photoUrl && (
                    <View style={styles.evidenceBoxActive}>
                      <Camera color="#10B981" size={20} />
                      <Text style={styles.evidenceBoxTextActive}>Photo Attached</Text>
                    </View>
                  )}
                  {videoUrl && (
                    <View style={styles.evidenceBoxActive}>
                      <Video color="#10B981" size={20} />
                      <Text style={styles.evidenceBoxTextActive}>Video Attached</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.mandatoryNotice}>
                ⚠️ Evidence is required for PNP dispatch. Tap button above to launch camera.
              </Text>
            )}

            {/* Step 4: GPS Location Auto-Captured */}
            <Text style={styles.sectionLabel}>4. AUTOMATIC GPS LOCATION</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationHeaderRow}>
                <MapPin color="#10B981" size={20} />
                <Text style={styles.locationDetectedTitle}>📍 Location Detected (GPS)</Text>
              </View>
              <Text style={styles.locationCoords}>
                {location
                  ? `Lat: ${location.latitude.toFixed(6)} | Lng: ${location.longitude.toFixed(6)} (±${Math.round(location.accuracy || 10)}m)`
                  : 'Acquiring GPS coordinates...'}
              </Text>
              <Text style={styles.locationNote}>
                Your coordinates are captured automatically. Manual entry is not required.
              </Text>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isBusy}
            >
              {isBusy ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitBtnText}>SUBMITTING REPORT & LOCATING RESPONDER...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>SUBMIT REPORT 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Emergency Evidence Camera Modal */}
      <EmergencyCameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onConfirmEvidence={handleConfirmEvidenceFromCamera}
        location={location}
        existingEvidence={evidenceItems}
      />

      {/* Evidence Review Modal */}
      <EvidenceReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={() => setShowReviewModal(false)}
        onAddMore={() => {
          setShowReviewModal(false);
          setShowCameraModal(true);
        }}
        onRemoveItem={handleRemoveEvidenceItem}
        evidenceItems={evidenceItems}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingVertical: 16,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  categoriesRow: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  checkBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#10B981',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
  },
  textArea: {
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  launchCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  launchCameraBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mandatoryNotice: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 4,
  },
  attachedEvidenceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 8,
    marginBottom: 4,
  },
  attachedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachedTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  btnReviewEvidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  btnReviewText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  evidenceBoxActive: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  evidenceBoxTextActive: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  locationCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  locationDetectedTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
  },
  locationCoords: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationNote: {
    color: '#6EE7B7',
    fontSize: 11,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
