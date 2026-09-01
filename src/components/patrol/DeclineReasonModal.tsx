import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { AlertCircle, X, Check } from 'lucide-react-native';
import { DeclineReason } from '../../types/patrol';

interface DeclineReasonModalProps {
  visible: boolean;
  onDeclineSubmit: (reason: DeclineReason, note: string) => void;
  onCancel: () => void;
}

const REASONS: DeclineReason[] = [
  'Unable to respond',
  'Already handling another emergency',
  'Vehicle problem',
  'Safety concern',
  'Other',
];

export const DeclineReasonModal: React.FC<DeclineReasonModalProps> = ({
  visible,
  onDeclineSubmit,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<DeclineReason>('Unable to respond');
  const [note, setNote] = useState<string>('');

  const handleSubmit = () => {
    onDeclineSubmit(selectedReason, note);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AlertCircle color="#EF4444" size={22} />
              <Text style={styles.title}>Decline Emergency Dispatch</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Reason is required. The GIS system will automatically re-assign this emergency to the next available officer.
          </Text>

          {REASONS.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.reasonOption, isSelected && styles.reasonSelected]}
                onPress={() => setSelectedReason(r)}
              >
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>{r}</Text>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check color="#FFFFFF" size={14} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <Text style={styles.label}>OPTIONAL NOTE FOR DISPATCH</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Provide brief details (e.g. engine trouble at BCPO 1)..."
            placeholderTextColor="#64748B"
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit}>
              <Text style={styles.btnSubmitText}>CONFIRM DECLINE</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reasonSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#450A0A',
  },
  reasonText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  reasonTextSelected: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  btnCancelText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  btnSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
