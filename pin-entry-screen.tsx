/**
 * PIN Entry Screen Component
 * Secure PIN entry interface for staff authentication
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { staffPinAuthService, AuthResult } from '@/lib/services/staff-pin-auth.service';

interface PinEntryScreenProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  requiredPermission?: string;
  title?: string;
}

export function PinEntryScreen({
  visible,
  onSuccess,
  onCancel,
  requiredPermission = 'beacon_calibration',
  title = 'Staff Authentication'
}: PinEntryScreenProps) {
  const colors = useColors();
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'id' | 'pin'>('id');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Reset state when screen becomes visible
      setStaffId('');
      setPin('');
      setStep('id');
      setError(null);
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (key: string) => {
    setError(null);
    
    if (step === 'id') {
      if (key === 'backspace') {
        setStaffId(prev => prev.slice(0, -1));
      } else if (key === 'enter') {
        if (staffId.length >= 3) {
          setStep('pin');
        } else {
          setError('Please enter a valid Staff ID');
          shake();
        }
      } else if (staffId.length < 10) {
        setStaffId(prev => prev + key);
      }
    } else {
      if (key === 'backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (key === 'enter') {
        handleAuthenticate();
      } else if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        
        // Auto-submit when PIN is 4 digits
        if (newPin.length === 4) {
          setTimeout(() => handleAuthenticate(newPin), 200);
        }
      }
    }
  };

  const handleAuthenticate = (pinToUse?: string) => {
    const pinValue = pinToUse || pin;
    if (pinValue.length < 4) {
      setError('PIN must be at least 4 digits');
      shake();
      return;
    }

    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const result: AuthResult = staffPinAuthService.authenticate(staffId, pinValue);
      setIsLoading(false);

      if (result.success) {
        if (requiredPermission && !staffPinAuthService.hasPermission(requiredPermission)) {
          setError('You do not have permission for this action');
          staffPinAuthService.logout();
          shake();
          return;
        }
        onSuccess();
      } else {
        setError(result.error || 'Authentication failed');
        setPin('');
        shake();
      }
    }, 500);
  };

  if (!visible) return null;

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['backspace', '0', 'enter']
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map(key => (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? colors.primary : colors.surface },
                  key === 'enter' && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleKeyPress(key)}
              >
                <Text style={[
                  styles.keyText,
                  { color: key === 'enter' ? '#fff' : colors.foreground }
                ]}>
                  {key === 'backspace' ? '⌫' : key === 'enter' ? '✓' : key}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={[styles.lockIcon, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>

        {/* Step Indicator */}
        <Text style={[styles.stepLabel, { color: colors.muted }]}>
          {step === 'id' ? 'Enter Staff ID' : 'Enter PIN'}
        </Text>

        {/* Input Display */}
        <Animated.View 
          style={[
            styles.inputDisplay,
            { backgroundColor: colors.surface, transform: [{ translateX: shakeAnim }] }
          ]}
        >
          {step === 'id' ? (
            <Text style={[styles.inputText, { color: colors.foreground }]}>
              {staffId || 'STAFF___'}
            </Text>
          ) : (
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    { 
                      backgroundColor: i < pin.length ? colors.primary : colors.border,
                      borderColor: colors.border
                    }
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>⚠️ {error}</Text>
          </View>
        )}

        {/* Back to ID Button (when on PIN step) */}
        {step === 'pin' && (
          <Pressable 
            onPress={() => { setStep('id'); setPin(''); setError(null); }}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← Change Staff ID ({staffId})
            </Text>
          </Pressable>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Authenticating...
            </Text>
          </View>
        )}
      </View>

      {/* Keypad */}
      {renderKeypad()}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.muted }]}>
          🏥 Kalgoorlie Regional Hospital • Staff Access Only
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockEmoji: {
    fontSize: 40,
  },
  stepLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  inputDisplay: {
    width: '100%',
    maxWidth: 280,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inputText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 2,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 14,
  },
  loadingContainer: {
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  keypad: {
    paddingHorizontal: 48,
    paddingBottom: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  key: {
    width: 72,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
  },
});

export default PinEntryScreen;
