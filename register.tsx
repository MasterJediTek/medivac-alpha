import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Registration Screen - Create new account with role selection
 */
export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'role' | 'verify'>('credentials');

  const HOSPITAL_ROLES = [
    { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️', description: 'Physician' },
    { id: 'nurse', label: 'Nurse', icon: '👩‍⚕️', description: 'Nursing Staff' },
    { id: 'admin', label: 'Administrator', icon: '👔', description: 'Hospital Admin' },
    { id: 'technician', label: 'Technician', icon: '🔧', description: 'Lab/Radiology' },
    { id: 'pharmacist', label: 'Pharmacist', icon: '💊', description: 'Pharmacy' },
    { id: 'patient', label: 'Patient', icon: '🧑‍🦽', description: 'Patient Account' },
  ];

  const handleNextStep = async () => {
    if (step === 'credentials') {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setError('');
      setStep('role');
    } else if (step === 'role') {
      if (!selectedRole) {
        setError('Please select a role');
        return;
      }
      setError('');
      setStep('verify');
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement registration API call
      // For now, simulate registration
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(tabs)');
      }, 1500);
    } catch (err) {
      setError('Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between py-8 px-6">
          {/* Header */}
          <View className="items-center gap-4 mt-8">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Text className="text-3xl">🏥</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-3xl font-bold text-foreground">Create Account</Text>
              <Text className="text-base text-muted">Join MediVac One</Text>
            </View>
          </View>

          {/* Progress Indicator */}
          <View className="flex-row gap-2 my-6">
            <ProgressStep active={step === 'credentials'} label="1" />
            <View className="flex-1 h-1 bg-border rounded-full" />
            <ProgressStep active={step === 'role'} label="2" />
            <View className="flex-1 h-1 bg-border rounded-full" />
            <ProgressStep active={step === 'verify'} label="3" />
          </View>

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <View className="gap-4 mb-8">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Email Address</Text>
                <TextInput
                  placeholder="you@hospital.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>

              {error && (
                <View className="p-3 rounded-lg bg-error/10 border border-error">
                  <Text className="text-sm text-error">{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* Step 2: Role Selection */}
          {step === 'role' && (
            <View className="gap-3 mb-8">
              <Text className="text-sm font-medium text-foreground mb-2">Select Your Role</Text>
              {HOSPITAL_ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onSelect={() => setSelectedRole(role.id)}
                  colors={colors}
                />
              ))}
            </View>
          )}

          {/* Step 3: Verification */}
          {step === 'verify' && (
            <View className="gap-4 mb-8">
              <View className="p-4 rounded-lg bg-success/10 border border-success">
                <Text className="text-sm text-foreground font-medium mb-2">Verify Email</Text>
                <Text className="text-sm text-muted">
                  We've sent a verification link to {email}. Please check your email and click the link to verify your account.
                </Text>
              </View>

              <View className="p-4 rounded-lg bg-surface border border-border">
                <Text className="text-sm font-medium text-foreground mb-2">Account Summary</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Email:</Text>
                    <Text className="text-sm text-foreground font-medium">{email}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Role:</Text>
                    <Text className="text-sm text-foreground font-medium">
                      {HOSPITAL_ROLES.find(r => r.id === selectedRole)?.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View className="gap-3 mb-8">
            {step !== 'credentials' && (
              <Pressable
                onPress={() => {
                  if (step === 'role') setStep('credentials');
                  else if (step === 'verify') setStep('role');
                }}
                disabled={isLoading}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="py-3 px-6 rounded-xl items-center"
              >
                <Text className="text-base font-semibold text-foreground">Back</Text>
              </Pressable>
            )}

            <Pressable
              onPress={step === 'verify' ? handleRegister : handleNextStep}
              disabled={isLoading}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              className="py-3 px-6 rounded-xl items-center flex-row justify-center gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : null}
              <Text className="text-base font-semibold text-white">
                {isLoading ? 'Processing...' : step === 'verify' ? 'Create Account' : 'Next'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center border-t border-border pt-4">
            <View className="flex-row gap-1">
              <Text className="text-sm text-muted">Already have an account?</Text>
              <Pressable
                onPress={() => router.push('/auth/signin')}
                disabled={isLoading}
              >
                <Text className="text-sm text-primary font-semibold">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Progress Step Indicator
 */
function ProgressStep({ active, label }: { active: boolean; label: string }) {
  return (
    <View
      className={`w-8 h-8 rounded-full items-center justify-center ${
        active ? 'bg-primary' : 'bg-border'
      }`}
    >
      <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-muted'}`}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Role Selection Card
 */
function RoleCard({
  role,
  selected,
  onSelect,
  colors,
}: {
  role: any;
  selected: boolean;
  onSelect: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        {
          backgroundColor: selected ? colors.primary + '20' : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: 2,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      className="flex-row items-center gap-4 p-4 rounded-lg"
    >
      <Text className="text-3xl">{role.icon}</Text>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{role.label}</Text>
        <Text className="text-sm text-muted">{role.description}</Text>
      </View>
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected ? `bg-primary border-primary` : `border-border`
        }`}
      >
        {selected && <Text className="text-white text-sm">✓</Text>}
      </View>
    </Pressable>
  );
}
