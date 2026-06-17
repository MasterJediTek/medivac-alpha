import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  registerForPushNotifications,
} from "@/lib/notifications";

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    critical: true,
    warning: true,
    info: true,
    message: true,
    task: true,
    appointment: true,
    sound: true,
    vibration: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await saveNotificationPreferences({ [key]: value });
  };

  const handleRegisterPush = async () => {
    const token = await registerForPushNotifications();
    setPushToken(token);
  };

  const SettingRow = ({
    icon,
    iconColor,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: any;
    iconColor: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center py-4 border-b border-border">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: iconColor + '20' }}
      >
        <IconSymbol name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-medium">{title}</Text>
        {subtitle && <Text className="text-muted text-sm">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground text-2xl font-bold">Notifications</Text>
          <Text className="text-muted text-sm">Manage alert preferences</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <IconSymbol name="bell.fill" size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="text-foreground font-semibold text-lg">Push Notifications</Text>
                <Text className="text-muted text-sm">
                  {preferences.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreference('enabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {!pushToken && (
            <TouchableOpacity
              className="mt-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleRegisterPush}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">Enable Push Notifications</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Categories */}
        <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
          Notification Types
        </Text>
        <View className="bg-surface rounded-2xl px-4 mb-6">
          <SettingRow
            icon="xmark.circle.fill"
            iconColor={colors.error}
            title="Critical Alerts"
            subtitle="Emergency patient alerts"
            value={preferences.critical}
            onValueChange={(value) => updatePreference('critical', value)}
          />
          <SettingRow
            icon="exclamationmark.triangle.fill"
            iconColor={colors.warning}
            title="Warnings"
            subtitle="Important notifications"
            value={preferences.warning}
            onValueChange={(value) => updatePreference('warning', value)}
          />
          <SettingRow
            icon="info.circle.fill"
            iconColor={colors.primary}
            title="Information"
            subtitle="General updates"
            value={preferences.info}
            onValueChange={(value) => updatePreference('info', value)}
          />
          <SettingRow
            icon="message.fill"
            iconColor={colors.success}
            title="Messages"
            subtitle="Chat and direct messages"
            value={preferences.message}
            onValueChange={(value) => updatePreference('message', value)}
          />
          <SettingRow
            icon="checklist"
            iconColor="#8B5CF6"
            title="Tasks"
            subtitle="Task assignments and updates"
            value={preferences.task}
            onValueChange={(value) => updatePreference('task', value)}
          />
          <SettingRow
            icon="calendar"
            iconColor="#06B6D4"
            title="Appointments"
            subtitle="Schedule reminders"
            value={preferences.appointment}
            onValueChange={(value) => updatePreference('appointment', value)}
          />
        </View>

        {/* Sound & Vibration */}
        <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
          Alerts
        </Text>
        <View className="bg-surface rounded-2xl px-4 mb-6">
          <SettingRow
            icon="bell.fill"
            iconColor={colors.foreground}
            title="Sound"
            subtitle="Play notification sounds"
            value={preferences.sound}
            onValueChange={(value) => updatePreference('sound', value)}
          />
          <SettingRow
            icon="bolt.fill"
            iconColor={colors.foreground}
            title="Vibration"
            subtitle="Vibrate on notification"
            value={preferences.vibration}
            onValueChange={(value) => updatePreference('vibration', value)}
          />
        </View>

        {/* Quiet Hours */}
        <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
          Quiet Hours
        </Text>
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted + '20' }}
              >
                <IconSymbol name="clock.fill" size={20} color={colors.muted} />
              </View>
              <View>
                <Text className="text-foreground font-medium">Enable Quiet Hours</Text>
                <Text className="text-muted text-sm">Silence non-critical alerts</Text>
              </View>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={(value) => updatePreference('quietHoursEnabled', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          {preferences.quietHoursEnabled && (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-muted text-sm mb-2">Start Time</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={preferences.quietHoursStart}
                  onChangeText={(value) => updatePreference('quietHoursStart', value)}
                  placeholder="22:00"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted text-sm mb-2">End Time</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                  value={preferences.quietHoursEnd}
                  onChangeText={(value) => updatePreference('quietHoursEnd', value)}
                  placeholder="07:00"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          )}
          
          <View className="mt-4 p-3 rounded-xl" style={{ backgroundColor: colors.warning + '15' }}>
            <Text style={{ color: colors.warning, fontSize: 12 }}>
              Note: Critical alerts will always be delivered regardless of quiet hours.
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="items-center mb-8">
          <Text className="text-muted text-xs text-center">
            Notification settings are synced with your JEDI profile
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
