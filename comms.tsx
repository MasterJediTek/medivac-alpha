import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TabBar, ControlPanel } from "@/components/ui/control-panel";
import { Dropdown, PRIORITY_OPTIONS, MESSAGE_TYPE_OPTIONS } from "@/components/ui/dropdown";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

// Types
interface Alert {
  id: string;
  title: string;
  message: string;
  type: "critical" | "warning" | "info";
  timestamp: string;
  read: boolean;
  source: string;
}

interface Bulletin {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedDate: string;
  duration: string;
  type: "add" | "alert" | "information" | "warning";
  status: "active" | "inactive";
  priority: "low" | "normal" | "high";
}

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  hasAttachment: boolean;
}

// Mock Data
const MOCK_ALERTS: Alert[] = [
  { id: "1", title: "Critical Patient Alert", message: "Patient in Room ICU-1 requires immediate attention. Vitals dropping.", type: "critical", timestamp: "2 min ago", read: false, source: "ICU Monitor" },
  { id: "2", title: "Lab Results Ready", message: "Urgent lab results for Patient #1234 are now available.", type: "warning", timestamp: "15 min ago", read: false, source: "Pathology" },
  { id: "3", title: "Medication Reminder", message: "Scheduled medication round for Ward A in 30 minutes.", type: "info", timestamp: "25 min ago", read: true, source: "Pharmacy" },
  { id: "4", title: "Equipment Maintenance", message: "Ventilator in OR-2 scheduled for maintenance at 3:00 PM.", type: "info", timestamp: "1 hour ago", read: true, source: "Biomedical" },
  { id: "5", title: "Staff Meeting", message: "Department heads meeting at 4:00 PM in Conference Room A.", type: "info", timestamp: "2 hours ago", read: true, source: "Administration" },
];

const MOCK_BULLETINS: Bulletin[] = [
  { id: "1", title: "New COVID-19 Protocols", content: "Updated infection control procedures effective immediately.", author: "Dr. Sarah Mitchell", publishedDate: "2024-01-24", duration: "30 days", type: "alert", status: "active", priority: "high" },
  { id: "2", title: "Staff Training: New EMR System", content: "Mandatory training sessions for the new electronic medical records system.", author: "IT Department", publishedDate: "2024-01-23", duration: "14 days", type: "information", status: "active", priority: "normal" },
  { id: "3", title: "Holiday Schedule", content: "Updated roster for the upcoming holiday period.", author: "HR Department", publishedDate: "2024-01-22", duration: "7 days", type: "add", status: "active", priority: "low" },
  { id: "4", title: "Parking Lot Closure", content: "West parking lot will be closed for resurfacing Jan 25-27.", author: "Facilities", publishedDate: "2024-01-21", duration: "5 days", type: "warning", status: "active", priority: "normal" },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1", sender: "Dr. James Chen", senderAvatar: "JC", subject: "Patient Consultation Request", preview: "Hi, I need your input on a complex case...", timestamp: "10 min ago", read: false, hasAttachment: true },
  { id: "2", sender: "Nurse Rebecca Taylor", senderAvatar: "RT", subject: "Shift Swap Request", preview: "Would you be available to cover my shift on...", timestamp: "1 hour ago", read: false, hasAttachment: false },
  { id: "3", sender: "Admin Karen White", senderAvatar: "KW", subject: "Quarterly Review Reminder", preview: "This is a reminder that your quarterly review...", timestamp: "3 hours ago", read: true, hasAttachment: true },
  { id: "4", sender: "Dr. Emily Watson", senderAvatar: "EW", subject: "Surgery Schedule Update", preview: "The surgery for Patient #5678 has been rescheduled...", timestamp: "Yesterday", read: true, hasAttachment: false },
  { id: "5", sender: "JEDI System", senderAvatar: "JS", subject: "Sync Complete", preview: "All patient records have been synchronized with...", timestamp: "Yesterday", read: true, hasAttachment: false },
];

type TabType = "alerts" | "bulletins" | "messages";

export default function CommsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("alerts");
  const [showNewBulletin, setShowNewBulletin] = useState(false);
  const [newBulletinPriority, setNewBulletinPriority] = useState("normal");
  const [newBulletinType, setNewBulletinType] = useState("information");

  const tabs = [
    { key: "alerts", label: "Alerts", badge: MOCK_ALERTS.filter(a => !a.read).length },
    { key: "bulletins", label: "Bulletins", badge: MOCK_BULLETINS.filter(b => b.status === "active").length },
    { key: "messages", label: "Messages", badge: MOCK_MESSAGES.filter(m => !m.read).length },
  ];

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical": return colors.error;
      case "warning": return colors.warning;
      case "info": return colors.primary;
    }
  };

  const getAlertIcon = (type: Alert["type"]): "xmark.circle.fill" | "exclamationmark.triangle.fill" | "info.circle.fill" => {
    switch (type) {
      case "critical": return "xmark.circle.fill";
      case "warning": return "exclamationmark.triangle.fill";
      case "info": return "info.circle.fill";
    }
  };

  const getBulletinTypeColor = (type: Bulletin["type"]) => {
    switch (type) {
      case "add": return colors.success;
      case "alert": return colors.error;
      case "information": return colors.primary;
      case "warning": return colors.warning;
    }
  };

  const getPriorityColor = (priority: Bulletin["priority"]) => {
    switch (priority) {
      case "high": return colors.error;
      case "normal": return colors.primary;
      case "low": return colors.success;
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity 
      className="bg-surface rounded-xl p-4 mb-3"
      style={{ 
        borderLeftWidth: 4, 
        borderLeftColor: getAlertColor(item.type),
        opacity: item.read ? 0.7 : 1,
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: getAlertColor(item.type) + '20' }}
        >
          <IconSymbol name={getAlertIcon(item.type)} size={20} color={getAlertColor(item.type)} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-foreground font-semibold flex-1">{item.title}</Text>
            {!item.read && (
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.error }} />
            )}
          </View>
          <Text className="text-muted text-sm" numberOfLines={2}>{item.message}</Text>
          <View className="flex-row items-center gap-3 mt-2">
            <Text className="text-muted text-xs">{item.source}</Text>
            <Text className="text-muted text-xs">•</Text>
            <Text className="text-muted text-xs">{item.timestamp}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBulletin = ({ item }: { item: Bulletin }) => (
    <TouchableOpacity 
      className="bg-surface rounded-xl p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View 
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: getBulletinTypeColor(item.type) + '20' }}
          >
            <Text style={{ color: getBulletinTypeColor(item.type), fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
              {item.type}
            </Text>
          </View>
          <View 
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: getPriorityColor(item.priority) + '20' }}
          >
            <Text style={{ color: getPriorityColor(item.priority), fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
              {item.priority}
            </Text>
          </View>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: item.status === 'active' ? colors.success + '20' : colors.muted + '20' }}
        >
          <Text style={{ color: item.status === 'active' ? colors.success : colors.muted, fontSize: 10, fontWeight: '600' }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text className="text-foreground font-semibold text-base mb-1">{item.title}</Text>
      <Text className="text-muted text-sm mb-2" numberOfLines={2}>{item.content}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs">By {item.author}</Text>
        <Text className="text-muted text-xs">{item.publishedDate} • {item.duration}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      className="bg-surface rounded-xl p-4 mb-3"
      style={{ opacity: item.read ? 0.8 : 1 }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{item.senderAvatar}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-foreground font-semibold flex-1">{item.sender}</Text>
            <Text className="text-muted text-xs">{item.timestamp}</Text>
            {!item.read && (
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
            )}
          </View>
          <Text className="text-foreground text-sm font-medium mb-1">{item.subject}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-muted text-sm flex-1" numberOfLines={1}>{item.preview}</Text>
            {item.hasAttachment && (
              <IconSymbol name="doc.fill" size={14} color={colors.muted} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Communications</Text>
            <Text className="text-muted text-sm">Comms Array • SUI Tools</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
            onPress={() => setShowNewBulletin(true)}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as TabType)}
        />
      </View>

      {/* Content */}
      {activeTab === "alerts" && (
        <FlatList
          data={MOCK_ALERTS}
          renderItem={renderAlert}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted text-sm">{MOCK_ALERTS.filter(a => !a.read).length} unread alerts</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Mark All Read</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {activeTab === "bulletins" && (
        <FlatList
          data={MOCK_BULLETINS}
          renderItem={renderBulletin}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.background, fontSize: 12, fontWeight: '600' }}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>Archive</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowNewBulletin(true)}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>New Bulletin</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {activeTab === "messages" && (
        <FlatList
          data={MOCK_MESSAGES}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border mb-4">
              <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
              <TextInput
                className="flex-1 text-foreground text-base"
                placeholder="Search messages..."
                placeholderTextColor={colors.muted}
                returnKeyType="search"
              />
            </View>
          }
        />
      )}

      {/* New Bulletin Modal */}
      <Modal
        visible={showNewBulletin}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewBulletin(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <TouchableOpacity onPress={() => setShowNewBulletin(false)} activeOpacity={0.7}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">New Bulletin</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Post</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-5">
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Title</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Bulletin title..."
                placeholderTextColor={colors.muted}
              />
            </View>
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Content</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Bulletin content..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>
            <Dropdown
              label="Type"
              options={MESSAGE_TYPE_OPTIONS}
              value={newBulletinType}
              onChange={setNewBulletinType}
            />
            <Dropdown
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={newBulletinPriority}
              onChange={setNewBulletinPriority}
            />
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">Duration (days)</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="7"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
