import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import {
  X,
  FileCheck,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Video,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react-native';
import { CapturedEvidenceItem } from './EmergencyCameraModal';

interface EvidenceReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAddMore: () => void;
  onRemoveItem: (id: string) => void;
  evidenceItems: CapturedEvidenceItem[];
}

export const EvidenceReviewModal: React.FC<EvidenceReviewModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onAddMore,
  onRemoveItem,
  evidenceItems,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FileCheck color="#FACC15" size={24} />
              <Text style={styles.headerTitle}>EVIDENCE REVIEW ({evidenceItems.length})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          {/* Evidence List Scroll View */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.subtext}>
              Review captured photo/video evidence attached to your emergency report.
            </Text>

            {evidenceItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <ImageIcon color="#64748B" size={40} />
                <Text style={styles.emptyTitle}>No Evidence Attached Yet</Text>
                <Text style={styles.emptySub}>
                  Emergency reports require at least one photo or video evidence file for dispatch verification.
                </Text>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddMore}>
                  <Plus color="#000000" size={18} />
                  <Text style={styles.emptyAddText}>OPEN CAMERA TO CAPTURE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              evidenceItems.map((item, idx) => (
                <View key={item.id} style={styles.itemCard}>
                  {/* Media Preview Box */}
                  <View style={styles.mediaContainer}>
                    {item.type === 'photo' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaImg} resizeMode="cover" />
                    ) : Platform.OS === 'web' ? (
                      <video src={item.uri} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <View style={styles.videoFallback}>
                        <Video color="#FACC15" size={32} />
                        <Text style={styles.videoFallbackText}>Video File Captured</Text>
                      </View>
                    )}
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Details Meta */}
                  <View style={styles.itemDetails}>
                    <View style={styles.metaRow}>
                      <Clock color="#94A3B8" size={14} />
                      <Text style={styles.metaText}>Captured: {item.timestamp}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <MapPin color="#10B981" size={14} />
                      <Text style={styles.metaTextMono}>
                        Lat: {item.latitude?.toFixed(4)}, Lng: {item.longitude?.toFixed(4)} (±{item.accuracy || 8}m)
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.btnRemove} onPress={() => onRemoveItem(item.id)}>
                      <Trash2 color="#FCA5A5" size={14} />
                      <Text style={styles.btnRemoveText}>REMOVE ITEM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnAddMore} onPress={onAddMore}>
              <Plus color="#FFFFFF" size={18} />
              <Text style={styles.btnAddMoreText}>ADD MORE EVIDENCE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirm, evidenceItems.length === 0 && styles.btnConfirmDisabled]}
              onPress={onConfirm}
              disabled={evidenceItems.length === 0}
            >
              <CheckCircle2 color="#000000" size={20} />
              <Text style={styles.btnConfirmText}>CONFIRM EVIDENCE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxHeight: '85%',
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
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#0F172A',
    borderRadius: 20,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 12,
  },
  subtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  emptyAddText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mediaContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  videoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoFallbackText: {
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '800',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  typeBadgeText: {
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '900',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  metaTextMono: {
    color: '#38BDF8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  btnRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginTop: 4,
  },
  btnRemoveText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  btnAddMore: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnAddMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  btnConfirm: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnConfirmDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  btnConfirmText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
