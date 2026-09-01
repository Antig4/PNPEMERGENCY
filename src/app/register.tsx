import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, User, Phone, Mail, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { validateFullName, validateMobileNumber, validateEmail, validatePassword, validateConfirmPassword } from '../utils/validation';

import { handleSafeBack } from '../utils/navigation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleRegister = async () => {
    setGeneralError(null);
    const newErrors: Record<string, string> = {};

    const nameErr = validateFullName(fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const phoneErr = validateMobileNumber(mobileNumber);
    if (phoneErr) newErrors.mobileNumber = phoneErr;

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register({
        fullName,
        mobileNumber,
        email,
        password,
        confirmPassword,
      });
      router.replace('/home');
    } catch (e: any) {
      setGeneralError(e?.message || 'Registration failed. Please check details and try again.');
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
        <ScrollView contentContainerStyle={styles.container}>
          {/* Top Bar */}
          <TouchableOpacity style={styles.backBtn} onPress={() => handleSafeBack(router, '/login')}>
            <ArrowLeft color="#94A3B8" size={24} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Shield color="#3B82F6" size={32} />
            </View>
            <Text style={styles.title}>Citizen Registration</Text>
            <Text style={styles.subtitle}>
              Register your account to send immediate emergency location alerts to PNP responders.
            </Text>
          </View>

          {generalError && (
            <View style={styles.generalErrorBox}>
              <AlertCircle color="#EF4444" size={18} />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME *</Text>
              <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
                <User color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Juan dela Cruz"
                  placeholderTextColor="#64748B"
                  value={fullName}
                  onChangeText={(t) => { setFullName(t); setErrors(prev => ({ ...prev, fullName: '' })); }}
                  autoCapitalize="words"
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE NUMBER *</Text>
              <View style={[styles.inputWrapper, errors.mobileNumber && styles.inputError]}>
                <Phone color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0917 123 4567"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={(t) => { setMobileNumber(t); setErrors(prev => ({ ...prev, mobileNumber: '' })); }}
                />
              </View>
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS *</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Mail color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="citizen@example.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors(prev => ({ ...prev, email: '' })); }}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD *</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Lock color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors(prev => ({ ...prev, password: '' })); }}
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD *</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Lock color="#64748B" size={18} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                />
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle color="#FFFFFF" size={20} />
                  <Text style={styles.btnSubmitText}>CREATE ACCOUNT</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkLogin}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.linkLoginText}>
                {'Already have an account? '}
                <Text style={{ color: '#60A5FA', fontWeight: '700' }}>Login</Text>
              </Text>
            </TouchableOpacity>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  generalErrorBox: {
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
  generalErrorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  form: {
    gap: 14,
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
    height: 50,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  linkLogin: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  linkLoginText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
