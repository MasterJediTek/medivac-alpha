import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: "person.fill" | "bell.fill" | "lock.fill" | "globe" | "arrow.triangle.2.circlepath" | "shield.fill" | "doc.fill" | "info.circle.fill" | "trash.fill";
  type: "navigate" | "toggle" | "action";
  value?: boolean;
  color?: string;
  danger?: boolean;
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account",
      items: [
        { id: "profile", title: "Profile", subtitle: "Jedi User", icon: "person.fill", type: "navigate" },
        { id: "security", title: "Security", subtitle: "Password & authentication", icon: "lock.fill", type: "navigate" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { id: "notifications", title: "Notifications", subtitle: "Push notifications", icon: "bell.fill", type: "toggle", value: notifications },
        { id: "darkMode", title: "Dark Mode", subtitle: "System appearance", icon: "globe", type: "toggle", value: darkMode },
        { id: "biometrics", title: "Biometric Login", subtitle: "Face ID / Touch ID", icon: "shield.fill", type: "toggle", value: biometrics },
      ]
    },
    {
      title: "Data & Sync",
      items: [
        { id: "autoSync", title: "Auto Sync", subtitle: "Sync data automatically", icon: "arrow.triangle.2.circlepath", type: "toggle", value: autoSync },
        { id: "storage", title: "Storage", subtitle: "128 MB used", icon: "folder.fill" as any, type: "navigate" },
        { id: "export", title: "Export Data", subtitle: "Download your data", icon: "doc.fill", type: "navigate" },
      ]
    },
    {
      title: "About",
      items: [
        { id: "about", title: "About MediVac One", subtitle: "Version 1.0.0", icon: "info.circle.fill", type: "navigate" },
        { id: "privacy", title: "Privacy Policy", icon: "doc.fill", type: "navigate" },
        { id: "terms", title: "Terms of Service", icon: "doc.fill", type: "navigate" },
      ]
    },
    {
      title: "Danger Zone",
      items: [
        { id: "clearCache", title: "Clear Cache", subtitle: "Free up storage space", icon: "trash.fill", type: "action", color: colors.warning },
        { id: "logout", title: "Log Out", icon: "person.fill", type: "action", danger: true },
      ]
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    switch (id) {
      case "notifications": setNotifications(value); break;
      case "autoSync": setAutoSync(value); break;
      case "biometrics": setBiometrics(value); break;
      case "darkMode": setDarkMode(value); break;
    }
  };

  const handlePress = (item: SettingItem) => {
    if (item.type === "navigate") {
      console.log("Navigate to:", item.id);
    } else if (item.type === "action") {
      console.log("Action:", item.id);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Settings</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="px-5 mb-6">
          <TouchableOpacity 
            className="bg-surface rounded-2xl p-4 flex-row items-center gap-4"
            activeOpacity={0.7}
          >
            <View 
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 24 }}>JU</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-bold">Jedi User</Text>
              <Text className="text-muted text-sm">jedi@medivac.one</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }} />
                <Text className="text-success text-xs font-medium">Online</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} className="mb-6">
            <Text className="text-muted text-sm font-semibold uppercase tracking-wide px-5 mb-2">
              {section.title}
            </Text>
            <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center p-4 gap-3"
                  style={{
                    borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => item.type !== "toggle" && handlePress(item)}
                  activeOpacity={item.type === "toggle" ? 1 : 0.7}
                >
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ 
                      backgroundColor: (item.danger ? colors.error : item.color || colors.primary) + '15' 
                    }}
                  >
                    <IconSymbol 
                      name={item.icon} 
                      size={22} 
                      color={item.danger ? colors.error : item.color || colors.primary} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text 
                      className="font-medium"
                      style={{ color: item.danger ? colors.error : colors.foreground }}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text className="text-muted text-sm">{item.subtitle}</Text>
                    )}
                  </View>
                  {item.type === "toggle" && (
                    <Switch
                      value={item.value}
                      onValueChange={(value) => handleToggle(item.id, value)}
                      trackColor={{ false: colors.border, true: colors.primary + '50' }}
                      thumbColor={item.value ? colors.primary : colors.muted}
                    />
                  )}
                  {item.type === "navigate" && (
                    <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View className="px-5 items-center mt-4">
          <Text className="text-muted text-sm font-semibold">MediVac One™</Text>
          <Text className="text-muted text-xs mt-1">Version 1.0.0 (Build 100)</Text>
          <Text className="text-muted text-xs mt-1">© 2024 SMPO.INK</Text>
          <Text className="text-muted text-xs">Powered by JediTek.net</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
