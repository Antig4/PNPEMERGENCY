import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ArrowRight,
  UserCheck,
  BadgeCheck,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { usePatrolAuth } from '../context/PatrolAuthContext';

/**
 * PNP EmergencyLink — Unified Login Screen
 *
 * One screen. One login form.
 * The server returns the user role → app routes accordingly:
 *   CITIZEN       → /home
 *   PATROL_OFFICER → /patrol/dashboard
 *   ADMIN         → rejected (no mobile admin access)
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login: citizenLogin } = useAuth();
  const { initFromSession } = usePatrolAuth();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your email address or badge number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      // citizenLogin calls authService.login which returns user with role.
      // authService.login also saves patrol_auth_user to SecureStore if patrol officer.
      const user = await citizenLogin({ email: identifier.trim(), password });

      if (user.role === 'PATROL_OFFICER') {
        // Load patrol officer state into PatrolAuthContext from the already-saved session
        // (authService already persisted patrol_auth_token + patrol_auth_user)
        await initFromSession();
        router.replace('/patrol/dashboard');
      } else if (user.role === 'CITIZEN') {
        router.replace('/home');
      } else {
        setError('Admin accounts cannot log in through the mobile application.');
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Shield color="#3B82F6" size={42} strokeWidth={2.2} />
            </View>
            <Text style={styles.appName}>PNP EmergencyLink</Text>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
              Enter your credentials. The app will automatically open the correct dashboard based on your role.
            </Text>
          </View>

          {/* Role hint badges */}
          <View style={styles.roleBadgeRow}>
            <View style={styles.roleBadge}>
              <UserCheck color="#10B981" size={14} />
              <Text style={styles.roleBadgeText}>CITIZEN</Text>
            </View>
            <Text style={styles.roleBadgeSep}>+</Text>
            <View style={[styles.roleBadge, styles.roleBadgePatrol]}>
              <BadgeCheck color="#F59E0B" size={14} />
              <Text style={[styles.roleBadgeText, styles.roleBadgeTextPatrol]}>PATROL OFFICER</Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle color="#EF4444" size={18} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email or Badge */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL OR BADGE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="citizen@example.com  or  BCPO-99421"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); setError(null); }}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.inputHint}>
                Citizens: use email address · Patrol Officers: use badge number
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <LogIn color="#FFFFFF" size={20} />
                  <Text style={styles.btnSubmitText}>SIGN IN</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerLinkText}>
              {'New citizen? '}
              <Text style={{ color: '#60A5FA', fontWeight: '700' }}>Create an account</Text>
            </Text>
          </TouchableOpacity>

          {/* Info footer */}
          <View style={styles.footer}>
            <Shield color="#334155" size={12} />
            <Text style={styles.footerText}>
              PNP EmergencyLink · Butuan City Police Office · Thesis Prototype
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
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  appName: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#052e16',
    borderColor: '#166534',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgePatrol: {
    backgroundColor: '#2D1B0D',
    borderColor: '#78350F',
  },
  roleBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleBadgeTextPatrol: {
    color: '#FCD34D',
  },
  roleBadgeSep: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
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
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  inputHint: {
    color: '#475569',
    fontSize: 11,
    marginTop: 5,
    marginLeft: 2,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 54,
    borderRadius: 14,
    marginTop: 6,
    gap: 8,
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  registerLinkText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    color: '#334155',
    fontSize: 10,
  },
});
