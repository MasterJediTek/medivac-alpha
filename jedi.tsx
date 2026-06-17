import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface SystemStatus {
  id: string;
  name: string;
  status: "connected" | "syncing" | "offline" | "error";
  lastSync: string;
  icon: "network" | "globe" | "shield.fill" | "folder.fill";
}

interface SyncItem {
  id: string;
  type: string;
  count: number;
  status: "synced" | "pending" | "error";
}

export default function JediScreen() {
  const colors = useColors();
  const router = useRouter();
  const [autoSync, setAutoSync] = useState(true);
  const [vpnEnabled, setVpnEnabled] = useState(true);

  const jediColor = "#8B5CF6";

  const systems: SystemStatus[] = [
    { id: "1", name: "JEDI Knowledge Base", status: "connected", lastSync: "2 min ago", icon: "network" },
    { id: "2", name: "WONGI Tracker", status: "connected", lastSync: "5 min ago", icon: "globe" },
    { id: "3", name: "VPN Browser", status: vpnEnabled ? "connected" : "offline", lastSync: "Active", icon: "shield.fill" },
    { id: "4", name: "S3 Cloud Storage", status: "syncing", lastSync: "Syncing...", icon: "folder.fill" },
  ];

  const syncItems: SyncItem[] = [
    { id: "1", type: "Patient Records", count: 156, status: "synced" },
    { id: "2", type: "Appointments", count: 48, status: "synced" },
    { id: "3", type: "Lab Results", count: 23, status: "pending" },
    { id: "4", type: "Messages", count: 89, status: "synced" },
    { id: "5", type: "Documents", count: 12, status: "pending" },
  ];

  const getStatusColor = (status: SystemStatus["status"]) => {
    switch (status) {
      case "connected": return colors.success;
      case "syncing": return colors.warning;
      case "offline": return colors.muted;
      case "error": return colors.error;
    }
  };

  const getStatusText = (status: SystemStatus["status"]) => {
    switch (status) {
      case "connected": return "Connected";
      case "syncing": return "Syncing";
      case "offline": return "Offline";
      case "error": return "Error";
    }
  };

  const getSyncStatusColor = (status: SyncItem["status"]) => {
    switch (status) {
      case "synced": return colors.success;
      case "pending": return colors.warning;
      case "error": return colors.error;
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
            <View>
              <Text className="text-foreground text-2xl font-bold">JEDI Hub</Text>
              <Text className="text-muted text-sm">JEDI Systems Integration</Text>
            </View>
          </View>
        </View>

        {/* Connection Status Banner */}
        <View className="px-5 mb-6">
          <View 
            className="rounded-2xl p-5"
            style={{ backgroundColor: jediColor + '15' }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: jediColor + '30' }}
                >
                  <IconSymbol name="network" size={28} color={jediColor} />
                </View>
                <View>
                  <Text className="text-foreground text-lg font-bold">JEDI Network</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }} />
                    <Text className="text-success text-sm font-medium">All Systems Online</Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: jediColor }}
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold">Sync All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl items-center border"
                style={{ borderColor: jediColor }}
                activeOpacity={0.8}
              >
                <Text style={{ color: jediColor }} className="font-semibold">View Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* System Status */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">System Status</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {systems.map((system, index) => (
              <View
                key={system.id}
                className="flex-row items-center p-4 gap-3"
                style={{
                  borderBottomWidth: index < systems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: jediColor + '15' }}
                >
                  <IconSymbol name={system.icon} size={22} color={jediColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{system.name}</Text>
                  <Text className="text-muted text-sm">{system.lastSync}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(system.status) }}
                  />
                  <Text 
                    style={{ color: getStatusColor(system.status), fontSize: 12, fontWeight: '500' }}
                  >
                    {getStatusText(system.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sync Settings */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">Sync Settings</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <IconSymbol name="arrow.triangle.2.circlepath" size={22} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Auto Sync</Text>
                  <Text className="text-muted text-sm">Sync data automatically</Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={autoSync ? colors.primary : colors.muted}
              />
            </View>
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <IconSymbol name="shield.fill" size={22} color={colors.success} />
                <View>
                  <Text className="text-foreground font-medium">VPN Protection</Text>
                  <Text className="text-muted text-sm">Secure network connection</Text>
                </View>
              </View>
              <Switch
                value={vpnEnabled}
                onValueChange={setVpnEnabled}
                trackColor={{ false: colors.border, true: colors.success + '50' }}
                thumbColor={vpnEnabled ? colors.success : colors.muted}
              />
            </View>
          </View>
        </View>

        {/* Sync Status */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">Data Sync Status</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {syncItems.map((item, index) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between p-4"
                style={{
                  borderBottomWidth: index < syncItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View>
                  <Text className="text-foreground font-medium">{item.type}</Text>
                  <Text className="text-muted text-sm">{item.count} items</Text>
                </View>
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getSyncStatusColor(item.status) + '20' }}
                >
                  <Text 
                    style={{ 
                      color: getSyncStatusColor(item.status), 
                      fontSize: 12, 
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* L3 Cache Status */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">L3 Cache</Text>
          <View className="bg-surface rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-medium">Cache Usage</Text>
              <Text className="text-muted text-sm">128 MB / 512 MB</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full"
                style={{ width: '25%', backgroundColor: colors.primary }}
              />
            </View>
            <View className="flex-row justify-between mt-3">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-primary text-sm font-medium">Clear Cache</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-primary text-sm font-medium">View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SMPO.ink Protocol */}
        <View className="px-5">
          <View className="bg-surface rounded-2xl p-4 flex-row items-center gap-3">
            <View 
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.success + '20' }}
            >
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-medium">SMPO.ink Protocol</Text>
              <Text className="text-success text-sm">Compliant • Verified</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary text-sm font-medium">Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
