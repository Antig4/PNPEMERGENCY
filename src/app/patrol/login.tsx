import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Lock, LogIn, AlertCircle, Sparkles, ArrowLeft, BadgeCheck } from 'lucide-react-native';
import { usePatrolAuth } from '../../context/PatrolAuthContext';

export default function PatrolLoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = usePatrolAuth();

  const [badgeNumber, setBadgeNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/patrol/dashboard');
    }
  }, [isLoading, isAuthenticated]);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!badgeNumber.trim()) {
      setErrorMsg('Badge or Officer ID is required.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(badgeNumber, password);
      router.replace('/patrol/dashboard');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Login failed. Invalid Badge ID or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemoOfficer = () => {
    setBadgeNumber('BCPO-99421');
    setPassword('patrolpass123');
    setErrorMsg(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Top Bar Switcher to Citizen */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/welcome')}>
              <ArrowLeft color="#94A3B8" size={20} />
              <Text style={styles.backBtnText}>Citizen Portal</Text>
            </TouchableOpacity>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>OFFICER PORTAL</Text>
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.shieldIconCircle}>
              <Shield color="#3B82F6" size={40} />
            </View>
            <Text style={styles.appName}>PNP EmergencyLink</Text>
            <Text style={styles.portalTitle}>PATROL OFFICER</Text>
            <Text style={styles.subText}>
              Restricted law enforcement access. Authenticate with authorized patrol badge credentials.
            </Text>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle color="#EF4444" size={18} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Demo Officer Autofill Button */}
          <TouchableOpacity style={styles.demoBox} onPress={autofillDemoOfficer}>
            <Sparkles color="#F59E0B" size={16} />
            <Text style={styles.demoBoxText}>
              Tap to fill demo officer credentials (<Text style={{ fontWeight: '800' }}>Patrol 01 - BCPO-99421</Text>)
            </Text>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BADGE / OFFICER ID *</Text>
              <View style={styles.inputWrapper}>
                <BadgeCheck color="#64748B" size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BCPO-99421 or PAT-01"
                  placeholderTextColor="#64748B"
                  value={badgeNumber}
                  onChangeText={setBadgeNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD *</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#64748B" size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter officer password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnLogin, isSubmitting && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <LogIn color="#FFFFFF" size={20} />
                  <Text style={styles.btnLoginText}>LOGIN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerNotice}>
            <Text style={styles.footerNoticeText}>
              PNP EmergencyLink • Thesis Law Enforcement Prototype
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  roleTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  roleTagText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  appName: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  portalTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  subText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1B0D',
    borderColor: '#78350F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    gap: 8,
  },
  demoBoxText: {
    color: '#FCD34D',
    fontSize: 12,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {},
  label: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  btnLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnLoginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerNotice: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerNoticeText: {
    color: '#475569',
    fontSize: 11,
  },
});
