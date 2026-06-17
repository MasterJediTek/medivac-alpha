import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Bulletin {
  id: string;
  title: string;
  content: string;
  source: string;
  time: string;
  type: "info" | "warning" | "alert";
}

interface Alert {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: "info" | "warning" | "critical";
  read: boolean;
}

type TabType = "chat" | "bulletins" | "alerts";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [searchQuery, setSearchQuery] = useState("");

  const conversations: Conversation[] = [
    { id: "1", name: "Dr. Smith", avatar: "DS", lastMessage: "Patient update: Lab results are ready", time: "2m", unread: 2, online: true },
    { id: "2", name: "Nurse Chen", avatar: "NC", lastMessage: "Room 204 needs attention", time: "15m", unread: 0, online: true },
    { id: "3", name: "Dr. Patel", avatar: "DP", lastMessage: "Surgery scheduled for tomorrow", time: "1h", unread: 1, online: false },
    { id: "4", name: "Admin Team", avatar: "AT", lastMessage: "Monthly report is due", time: "3h", unread: 0, online: false },
    { id: "5", name: "Lab Department", avatar: "LD", lastMessage: "New test results uploaded", time: "5h", unread: 3, online: true },
  ];

  const bulletins: Bulletin[] = [
    { id: "1", title: "System Maintenance", content: "Scheduled maintenance tonight from 2-4 AM", source: "IT Department", time: "1h ago", type: "info" },
    { id: "2", title: "Weather Alert", content: "Severe weather warning for the region", source: "BOM", time: "3h ago", type: "warning" },
    { id: "3", title: "Staff Meeting", content: "All hands meeting tomorrow at 9 AM", source: "Administration", time: "5h ago", type: "info" },
    { id: "4", title: "Emergency Protocol", content: "Updated emergency procedures now in effect", source: "Safety Team", time: "1d ago", type: "alert" },
  ];

  const alerts: Alert[] = [
    { id: "1", title: "Critical Patient Alert", message: "Patient in Room 302 requires immediate attention", time: "5m ago", severity: "critical", read: false },
    { id: "2", title: "Lab Results Ready", message: "Blood work results for John Doe are available", time: "30m ago", severity: "info", read: false },
    { id: "3", title: "Appointment Reminder", message: "Dr. Smith has an appointment in 15 minutes", time: "1h ago", severity: "warning", read: true },
    { id: "4", title: "Medication Alert", message: "Low stock warning for Amoxicillin", time: "2h ago", severity: "warning", read: true },
  ];

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: "chat", label: "Chat", badge: conversations.reduce((sum, c) => sum + c.unread, 0) },
    { key: "bulletins", label: "Bulletins" },
    { key: "alerts", label: "Alerts", badge: alerts.filter(a => !a.read).length },
  ];

  const getBulletinColor = (type: Bulletin["type"]) => {
    switch (type) {
      case "info": return colors.primary;
      case "warning": return colors.warning;
      case "alert": return colors.error;
    }
  };

  const getAlertColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "info": return colors.primary;
      case "warning": return colors.warning;
      case "critical": return colors.error;
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      className="flex-row items-center p-4 gap-3"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="relative">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>
            {item.avatar}
          </Text>
        </View>
        {item.online && (
          <View 
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ backgroundColor: colors.success, borderColor: colors.background }}
          />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground font-semibold">{item.name}</Text>
          <Text className="text-muted text-xs">{item.time}</Text>
        </View>
        <Text className="text-muted text-sm mt-1" numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unread > 0 && (
        <View 
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-xs font-bold">{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderBulletin = ({ item }: { item: Bulletin }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl p-4 mb-3"
      style={{ borderLeftWidth: 4, borderLeftColor: getBulletinColor(item.type) }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-foreground font-semibold flex-1">{item.title}</Text>
        <Text className="text-muted text-xs">{item.time}</Text>
      </View>
      <Text className="text-muted text-sm mb-2">{item.content}</Text>
      <Text className="text-primary text-xs font-medium">{item.source}</Text>
    </TouchableOpacity>
  );

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity 
      className="flex-row items-start p-4 gap-3"
      style={{ 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border,
        backgroundColor: item.read ? 'transparent' : colors.surface,
      }}
      activeOpacity={0.7}
    >
      <View 
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: getAlertColor(item.severity) + '20' }}
      >
        <IconSymbol 
          name={item.severity === "critical" ? "exclamationmark.triangle.fill" : "bell.fill"} 
          size={20} 
          color={getAlertColor(item.severity)} 
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground font-semibold">{item.title}</Text>
          <Text className="text-muted text-xs">{item.time}</Text>
        </View>
        <Text className="text-muted text-sm mt-1">{item.message}</Text>
      </View>
      {!item.read && (
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Messages</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-surface rounded-xl p-1 mb-4">
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-2 rounded-lg flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: activeTab === tab.key ? colors.background : 'transparent',
              }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text 
                style={{ 
                  color: activeTab === tab.key ? colors.foreground : colors.muted,
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  fontSize: 14,
                }}
              >
                {tab.label}
              </Text>
              {tab.badge && tab.badge > 0 && (
                <View 
                  className="px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text className="text-background text-xs font-bold">{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Search (for chat tab) */}
        {activeTab === "chat" && (
          <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border">
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 text-foreground text-base"
              placeholder="Search conversations..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      {/* Content */}
      {activeTab === "chat" && (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {activeTab === "bulletins" && (
        <FlatList
          data={bulletins}
          renderItem={renderBulletin}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        />
      )}

      {activeTab === "alerts" && (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
