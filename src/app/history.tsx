import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, History, Filter } from 'lucide-react-native';
import { incidentService } from '../services/incidentService';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { IncidentCard } from '../components/IncidentCard';
import { Incident } from '../types/incident';

import { handleSafeBack } from '../utils/navigation';

type FilterType = 'ALL' | 'ACTIVE' | 'RESOLVED';

export default function HistoryScreen() {
  const router = useRouter();
  // Enforce CITIZEN-only access
  useRoleGuard('CITIZEN');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const list = await incidentService.getIncidentHistory();
      setIncidents(list);
    } catch (e) {
      console.warn('[HistoryScreen] loadHistory error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'ACTIVE') {
      return inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED';
    }
    if (filter === 'RESOLVED') {
      return inc.status === 'RESOLVED' || inc.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/home')}>
          <ArrowLeft color="#94A3B8" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident History</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
            All Incidents ({incidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setFilter('ACTIVE')}
        >
          <Text style={[styles.filterText, filter === 'ACTIVE' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'RESOLVED' && styles.filterChipActive]}
          onPress={() => setFilter('RESOLVED')}
        >
          <Text style={[styles.filterText, filter === 'RESOLVED' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredIncidents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        renderItem={({ item }) => (
          <IncidentCard
            incident={item}
            onPress={() => router.push(`/incident/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <History color="#64748B" size={40} />
            <Text style={styles.emptyTitle}>No Emergency Incidents</Text>
            <Text style={styles.emptySub}>
              {filter === 'ALL'
                ? 'You have not submitted any emergency alerts.'
                : `No ${filter.toLowerCase()} incidents found.`}
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#0F172A',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
