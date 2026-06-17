import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Sign In Screen - OAuth and email/password authentication
 */
export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement OAuth/email authentication
      // For now, simulate login
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(tabs)');
      }, 1500);
    } catch (err) {
      setError('Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'microsoft' | 'google' | 'apple') => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement OAuth flow for each provider
      console.log(`Signing in with ${provider}`);
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(tabs)');
      }, 1500);
    } catch (err) {
      setError(`${provider} sign in failed. Please try again.`);
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
              <Text className="text-3xl font-bold text-foreground">Welcome Back</Text>
              <Text className="text-base text-muted">Sign in to MediVac One</Text>
            </View>
          </View>

          {/* OAuth Options */}
          <View className="gap-4 my-8">
            <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
              Sign in with
            </Text>

            <OAuthButton
              provider="microsoft"
              icon="🔵"
              label="Microsoft Account"
              onPress={() => handleOAuthSignIn('microsoft')}
              isLoading={isLoading}
              colors={colors}
            />

            <OAuthButton
              provider="google"
              icon="🔴"
              label="Google Account"
              onPress={() => handleOAuthSignIn('google')}
              isLoading={isLoading}
              colors={colors}
            />

            <OAuthButton
              provider="apple"
              icon="🍎"
              label="Apple ID"
              onPress={() => handleOAuthSignIn('apple')}
              isLoading={isLoading}
              colors={colors}
            />
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-3 my-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-sm text-muted">or</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Email/Password Form */}
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

            {error && (
              <View className="p-3 rounded-lg bg-error/10 border border-error">
                <Text className="text-sm text-error">{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleEmailSignIn}
              disabled={isLoading}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              className="py-4 px-6 rounded-xl items-center flex-row justify-center gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : null}
              <Text className="text-lg font-semibold text-white">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Footer Links */}
          <View className="gap-3 items-center border-t border-border pt-4">
            <Pressable
              onPress={() => router.push('/auth/forgot-password')}
              disabled={isLoading}
            >
              <Text className="text-sm text-primary font-medium">Forgot Password?</Text>
            </Pressable>

            <View className="flex-row gap-1">
              <Text className="text-sm text-muted">Don't have an account?</Text>
              <Pressable
                onPress={() => router.push('/auth/register')}
                disabled={isLoading}
              >
                <Text className="text-sm text-primary font-semibold">Create one</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * OAuth Button Component
 */
function OAuthButton({
  provider,
  icon,
  label,
  onPress,
  isLoading,
  colors,
}: {
  provider: string;
  icon: string;
  label: string;
  onPress: () => void;
  isLoading: boolean;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      className="flex-row items-center gap-3 py-3 px-4 rounded-lg"
    >
      <Text className="text-2xl">{icon}</Text>
      <Text className="flex-1 text-base font-medium text-foreground">{label}</Text>
      <Text className="text-lg">→</Text>
    </Pressable>
  );
}
