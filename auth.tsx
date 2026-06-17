import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Platform, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import {
  signInWithMicrosoft,
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
  getStoredUser,
  AuthUser,
} from "@/lib/auth-providers";

type AuthProvider = 'microsoft' | 'google' | 'apple';

export default function AuthScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkExistingAuth();
    // Check Apple availability
    checkAppleAvailability();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const user = await getStoredUser();
      if (user) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const checkAppleAvailability = async () => {
    const available = await isAppleAuthAvailable();
    setAppleAvailable(available);
  };

  const handleSignIn = async (provider: AuthProvider) => {
    setIsLoading(true);
    setLoadingProvider(provider);
    setError(null);

    try {
      let user: AuthUser | null = null;

      switch (provider) {
        case 'microsoft':
          user = await signInWithMicrosoft();
          break;
        case 'google':
          user = await signInWithGoogle();
          break;
        case 'apple':
          user = await signInWithApple();
          break;
      }

      if (user) {
        router.replace("/(tabs)");
      } else {
        setError("Sign in was cancelled");
      }
    } catch (err: any) {
      console.error(`${provider} sign in error:`, err);
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const AuthButton = ({
    provider,
    label,
    icon,
    backgroundColor,
    textColor,
    borderColor,
  }: {
    provider: AuthProvider;
    label: string;
    icon: React.ReactNode;
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
  }) => (
    <TouchableOpacity
      className="flex-row items-center justify-center py-4 px-6 rounded-xl mb-4"
      style={{
        backgroundColor,
        borderWidth: borderColor ? 1 : 0,
        borderColor,
        opacity: isLoading && loadingProvider !== provider ? 0.5 : 1,
      }}
      onPress={() => handleSignIn(provider)}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {loadingProvider === provider ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            className="text-base font-semibold ml-3"
            style={{ color: textColor }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View className="items-center mb-12">
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="cross.fill" size={48} color="#FFFFFF" />
          </View>
          <Text className="text-foreground text-3xl font-bold text-center">
            MediVac One
          </Text>
          <Text className="text-muted text-base text-center mt-2">
            Virtual Hospital Platform
          </Text>
        </View>

        {/* Welcome Message */}
        <View className="mb-8">
          <Text className="text-foreground text-xl font-semibold text-center mb-2">
            Welcome Back
          </Text>
          <Text className="text-muted text-center">
            Sign in with your organization account to continue
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View
            className="bg-error/10 rounded-xl p-4 mb-6"
            style={{ backgroundColor: colors.error + '15' }}
          >
            <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Auth Buttons */}
        <View className="mb-8">
          {/* Microsoft - Primary for Enterprise */}
          <AuthButton
            provider="microsoft"
            label="Continue with Microsoft"
            icon={
              <View className="w-6 h-6 items-center justify-center">
                <View className="flex-row flex-wrap w-5 h-5">
                  <View className="w-2 h-2 bg-[#F25022] mr-0.5 mb-0.5" />
                  <View className="w-2 h-2 bg-[#7FBA00]" />
                  <View className="w-2 h-2 bg-[#00A4EF] mr-0.5" />
                  <View className="w-2 h-2 bg-[#FFB900]" />
                </View>
              </View>
            }
            backgroundColor="#2F2F2F"
            textColor="#FFFFFF"
          />

          {/* Google */}
          <AuthButton
            provider="google"
            label="Continue with Google"
            icon={
              <View className="w-6 h-6 items-center justify-center">
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>G</Text>
              </View>
            }
            backgroundColor="#FFFFFF"
            textColor="#1F1F1F"
            borderColor={colors.border}
          />

          {/* Apple - Only on iOS */}
          {(appleAvailable || Platform.OS === 'web') && (
            <AuthButton
              provider="apple"
              label="Continue with Apple"
              icon={
                <View className="w-6 h-6 items-center justify-center">
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}></Text>
                </View>
              }
              backgroundColor="#000000"
              textColor="#FFFFFF"
            />
          )}
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
          <Text className="text-muted text-sm mx-4">Enterprise SSO</Text>
          <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
        </View>

        {/* Enterprise Info */}
        <View className="bg-surface rounded-2xl p-4 mb-8">
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <IconSymbol name="shield.fill" size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Azure AD Integration</Text>
              <Text className="text-muted text-sm">Single Sign-On enabled</Text>
            </View>
          </View>
          <Text className="text-muted text-sm">
            Your organization uses Microsoft Entra ID (Azure AD) for secure authentication. 
            Sign in with your work account to access role-based features.
          </Text>
        </View>

        {/* Features */}
        <View className="mb-8">
          <Text className="text-foreground font-semibold mb-4 text-center">
            Integrated Features
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3">
            {[
              { icon: "calendar" as const, label: "Outlook Calendar" },
              { icon: "envelope.fill" as const, label: "Email Sync" },
              { icon: "person.2.fill" as const, label: "Teams Presence" },
              { icon: "folder.fill" as const, label: "OneDrive Files" },
            ].map((feature, index) => (
              <View
                key={index}
                className="flex-row items-center bg-surface rounded-full px-3 py-2"
              >
                <IconSymbol name={feature.icon} size={14} color={colors.primary} />
                <Text className="text-muted text-xs ml-2">{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* JEDI Integration Note */}
        <View className="items-center">
          <View className="flex-row items-center gap-2 mb-2">
            <IconSymbol name="network" size={16} color="#8B5CF6" />
            <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '600' }}>
              JEDI Systems Integration
            </Text>
          </View>
          <Text className="text-muted text-xs text-center">
            Powered by SMPO.ink Protocols • JediTek.net
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
