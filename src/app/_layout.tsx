import React, { useEffect, useRef, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Phone, PhoneOff, PhoneIncoming, Shield } from 'lucide-react-native';
import { AuthProvider } from '../context/AuthContext';
import { PatrolAuthProvider } from '../context/PatrolAuthContext';
import { callBridgeService, CallBridgeEvent } from '../services/callBridgeService';

/**
 * IncomingCallBanner — rendered always in the layout tree.
 * Shows the incoming call UI directly when a patrol officer calls a citizen.
 * Skips rendering if the current route is a patrol screen (officer's own tab).
 */
function IncomingCallBanner() {
  const [call, setCall] = useState<CallBridgeEvent | null>(null);
  const [localState, setLocalState] = useState<'INCOMING' | 'CONNECTED' | 'IDLE'>('IDLE');
  const [duration, setDuration] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = callBridgeService.subscribe((event) => {
      if (event.status === 'ENDED') {
        setCall(null);
        setLocalState('IDLE');
        setDuration(0);
      } else if (event.status === 'RINGING') {
        setCall({ ...event });
        setLocalState('INCOMING');
        setDuration(0);
      } else if (event.status === 'CONNECTED') {
        setCall((prev) => (prev ? { ...prev, status: 'CONNECTED' } : null));
        setLocalState('CONNECTED');
        setDuration(0);
      }
    });
    return unsubscribe;
  }, []);

  // Duration timer when connected
  useEffect(() => {
    if (localState !== 'CONNECTED') return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [localState]);

  const formatSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Don't show on patrol tabs — patrol handles outgoing UI itself
  if (!call || pathname?.startsWith('/patrol')) return null;

  const handleAnswer = () => {
    setLocalState('CONNECTED');
    callBridgeService.acceptCall();
  };

  const handleDecline = () => {
    callBridgeService.endCall();
    setCall(null);
    setLocalState('IDLE');
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.screen}>
        {/* Top minimize area — not used for incoming but keeps layout same */}
        <View style={styles.topSpacer} />

        <View style={styles.centerGroup}>
          {localState === 'INCOMING' ? (
            <>
              <View style={styles.incomingBadgeRow}>
                <PhoneIncoming color="#10B981" size={22} />
                <Text style={styles.incomingBadgeText}>INCOMING EMERGENCY CALL</Text>
              </View>

              <View style={styles.roleBadge}>
                <Shield color="#60A5FA" size={14} />
                <Text style={styles.roleBadgeText}>PATROL OFFICER</Text>
              </View>

              <Text style={styles.callerName}>{call.callerName || 'Mobile Patrol Unit'}</Text>
              <Text style={styles.callerNumber}>{call.callerNumber || '09171234567'}</Text>

              <View style={styles.pulseCircle}>
                <PhoneIncoming color="#10B981" size={52} />
              </View>

              <Text style={styles.instructionText}>Patrol Officer is calling. Please answer.</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                  <PhoneOff color="#fff" size={26} />
                  <Text style={styles.actionBtnLabel}>DECLINE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.answerBtn} onPress={handleAnswer}>
                  <Phone color="#fff" size={26} />
                  <Text style={styles.actionBtnLabel}>ANSWER</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.connectedBadge}>● CALL CONNECTED</Text>

              <View style={styles.roleBadge}>
                <Shield color="#60A5FA" size={14} />
                <Text style={styles.roleBadgeText}>PATROL OFFICER</Text>
              </View>

              <Text style={styles.callerName}>{call.callerName || 'Mobile Patrol Unit'}</Text>
              <Text style={styles.callerNumber}>{call.callerNumber || '09171234567'}</Text>

              <Text style={styles.timerText}>{formatSecs(duration)}</Text>

              <View style={[styles.pulseCircle, styles.connectedPulse]}>
                <Phone color="#FACC15" size={52} />
              </View>

              <TouchableOpacity style={styles.endCallBtn} onPress={handleDecline}>
                <PhoneOff color="#fff" size={24} />
                <Text style={styles.endCallText}>END CALL</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PatrolAuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0F172A' },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="home" />
            <Stack.Screen name="history" />
            <Stack.Screen name="incident/[id]" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="patrol/dashboard" />
            <Stack.Screen name="patrol/incident/[id]" />
            <Stack.Screen name="patrol/map" />
            <Stack.Screen name="patrol/resolve/[id]" />
            <Stack.Screen name="patrol/history" />
          </Stack>
          <IncomingCallBanner />
        </PatrolAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    backgroundColor: 'rgba(10, 18, 38, 0.97)',
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as any }
      : {}),
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  topSpacer: {
    height: Platform.OS === 'ios' ? 60 : 40,
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  incomingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  incomingBadgeText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  connectedBadge: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  callerNumber: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  timerText: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  pulseCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0F2A1A',
    borderWidth: 3,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    marginTop: 8,
  },
  connectedPulse: {
    borderColor: '#FACC15',
    backgroundColor: '#1A1A0F',
  },
  instructionText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  declineBtn: {
    backgroundColor: '#EF4444',
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 10,
  },
  answerBtn: {
    backgroundColor: '#10B981',
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 10,
  },
  actionBtnLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  endCallBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 10,
    marginTop: 8,
  },
  endCallText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
