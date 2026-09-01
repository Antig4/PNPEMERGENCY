import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

/**
 * App entry point — role-based session check.
 *
 * Flow:
 *   1. While AuthContext is loading the saved session → show splash screen
 *   2. If logged in as CITIZEN  → /home
 *   3. If logged in as PATROL_OFFICER → /patrol/dashboard
 *   4. Otherwise (ADMIN / not logged in / expired) → /login
 */
export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (user.role === 'PATROL_OFFICER') {
        router.replace('/patrol/dashboard');
      } else if (user.role === 'CITIZEN') {
        router.replace('/home');
      } else {
        // ADMIN or unknown role → not allowed on mobile, send to login
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <View style={styles.shieldBox}>
          <Shield color="#3B82F6" size={48} />
        </View>
        <Text style={styles.appName}>PNP EmergencyLink</Text>
        <Text style={styles.tagline}>Swift Response. Safe Butuan.</Text>
      </View>
      <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  brandBox: {
    alignItems: 'center',
  },
  shieldBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
});
