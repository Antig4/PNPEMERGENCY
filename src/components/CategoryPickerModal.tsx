import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ShieldAlert, Stethoscope, Flame, Car, X, Check } from 'lucide-react-native';
import { EmergencyCategory } from '../types/incident';

interface CategoryPickerModalProps {
  visible: boolean;
  selectedCategory: EmergencyCategory;
  onSelect: (category: EmergencyCategory) => void;
  onClose: () => void;
}

const CATEGORIES: { type: EmergencyCategory; icon: any; color: string; desc: string }[] = [
  {
    type: 'Crime / Police Emergency',
    icon: ShieldAlert,
    color: '#DC2626',
    desc: 'Robbery, assault, violence, suspicious activity, or law enforcement emergency.',
  },
  {
    type: 'Medical Emergency',
    icon: Stethoscope,
    color: '#2563EB',
    desc: 'Severe injury, cardiac arrest, collapse, or medical assistance required.',
  },
  {
    type: 'Fire / Rescue',
    icon: Flame,
    color: '#D97706',
    desc: 'Building fire, vehicle blaze, gas leak, or trapped victim rescue.',
  },
  {
    type: 'Traffic Accident',
    icon: Car,
    color: '#7C3AED',
    desc: 'Highway collision, vehicle crash, or road emergency assistance.',
  },
];

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  selectedCategory,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Select Emergency Category</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color="#94A3B8" size={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Default is <Text style={{ color: '#F87171', fontWeight: '700' }}>Crime / Police Emergency</Text>. Tap to change emergency classification.
              </Text>

              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.type;

                return (
                  <TouchableOpacity
                    key={cat.type}
                    activeOpacity={0.8}
                    style={[
                      styles.categoryCard,
                      isSelected && { borderColor: cat.color, backgroundColor: 'rgba(30, 41, 59, 0.9)' },
                    ]}
                    onPress={() => {
                      onSelect(cat.type);
                      onClose();
                    }}
                  >
                    <View style={[styles.iconBox, { backgroundColor: cat.color }]}>
                      <IconComponent color="#FFFFFF" size={22} />
                    </View>

                    <View style={styles.textCol}>
                      <Text style={styles.catTitle}>{cat.type}</Text>
                      <Text style={styles.catDesc}>{cat.desc}</Text>
                    </View>

                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: cat.color }]}>
                        <Check color="#FFFFFF" size={14} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  catTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  catDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
