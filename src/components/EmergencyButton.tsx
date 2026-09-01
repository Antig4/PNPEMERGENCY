import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Easing, ActivityIndicator } from 'react-native';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';

interface EmergencyButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  emergencyType?: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onPress,
  isLoading = false,
  disabled = false,
  emergencyType = 'Crime / Police Emergency',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) return;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: disabled ? 0.3 : 0.6,
          },
        ]}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          isLoading && styles.buttonLoading,
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>SENDING LOCATION & ALERT...</Text>
            <Text style={styles.loadingSubtext}>Locating Nearest Available Responder</Text>
          </View>
        ) : (
          <View style={styles.innerContent}>
            <View style={styles.iconContainer}>
              <ShieldAlert color="#FFFFFF" size={42} strokeWidth={2.5} />
            </View>
            <Text style={styles.alertPrefix}>EMERGENCY ALERT</Text>
            <Text style={styles.mainTitle}>🚨 CALL & SEND LOCATION</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{emergencyType}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  button: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    elevation: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 4,
    borderColor: '#F87171',
  },
  buttonDisabled: {
    backgroundColor: '#4B5563',
    borderColor: '#6B7280',
    shadowOpacity: 0.1,
  },
  buttonLoading: {
    backgroundColor: '#991B1B',
    borderColor: '#EF4444',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 6,
  },
  alertPrefix: {
    color: '#FECACA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 22,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    color: '#FECACA',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
