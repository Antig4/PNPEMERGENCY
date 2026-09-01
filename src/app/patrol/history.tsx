import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, History, ShieldCheck } from 'lucide-react-native';
import { usePatrolAuth } from '../../context/PatrolAuthContext';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { patrolIncidentService } from '../../services/patrolIncidentService';
import { IncidentCard } from '../../components/IncidentCard';
import { handleSafeBack } from '../../utils/navigation';

export default function PatrolHistoryScreen() {
  const router = useRouter();
  const { officer } = usePatrolAuth();
  // Enforce PATROL_OFFICER-only access
  useRoleGuard('PATROL_OFFICER');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [officer])
  );

  const loadHistory = async () => {
    if (!officer) return;
    setIsLoading(true);
    try {
      const list = await patrolIncidentService.getPatrolHistory(officer.id);
      setIncidents(list);
    } catch (e) {
      console.warn('[PatrolHistoryScreen] load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/patrol/dashboard')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Officer Incident History</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        renderItem={({ item }) => (
          <IncidentCard
            incident={item}
            onPress={() => router.push(`/patrol/incident/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <ShieldCheck color="#64748B" size={40} />
            <Text style={styles.emptyTitle}>No Handled Incidents Yet</Text>
            <Text style={styles.emptySub}>
              Emergency dispatches assigned to {officer?.name || 'Patrol Unit'} will be logged here.
            </Text>
          </View>
        }
      />
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
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
