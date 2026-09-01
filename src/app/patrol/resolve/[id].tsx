import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { usePatrolAuth } from '../../../context/PatrolAuthContext';
import { handleSafeBack } from '../../../utils/navigation';

export default function ResolveIncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resolveIncident } = usePatrolAuth();

  const [summary, setSummary] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('Resolved');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const incidentRef = id ? (id.startsWith('INC-') ? id : `INC-${String(id).padStart(6, '0')}`) : 'INC-000011';

  const handleResolve = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const incidentId = id || '1';
      await resolveIncident(incidentId, summary.trim(), outcome.trim() || 'Resolved');
      router.replace('/patrol/history' as any);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to submit resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/patrol/dashboard')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resolve Incident</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resolveCard}>
          <View style={styles.iconCircle}>
            <CheckCircle2 color="#10B981" size={48} />
          </View>

          <Text style={styles.cardTitle}>RESOLVE INCIDENT</Text>
          <Text style={styles.cardSub}>Are you sure you want to mark this incident as resolved?</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Incident Reference:</Text>
              <Text style={styles.infoVal}>{incidentRef}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status Change:</Text>
              <Text style={styles.statusVal}>RESOLVED</Text>
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Optional Notes Input (NO MANDATORY SUMMARY OR OUTCOME FORM) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OPTIONAL RESOLUTION NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.summaryInput}
              placeholder="Type optional notes or leave blank..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={summary}
              onChangeText={setSummary}
            />
          </View>

          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => handleSafeBack(router, '/patrol/dashboard')}
              disabled={isSubmitting}
            >
              <Text style={styles.btnCancelText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
              onPress={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnSubmitText}>RESOLVE INCIDENT</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  container: {
    padding: 16,
    paddingBottom: 30,
    justifyContent: 'center',
    flexGrow: 1,
  },
  resolveCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  infoVal: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  statusVal: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '900',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  inputGroup: {
    width: '100%',
    gap: 6,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 6,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnSubmit: {
    flex: 1.5,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
