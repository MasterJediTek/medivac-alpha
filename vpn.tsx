import { ScrollView, Text, View, TouchableOpacity, TextInput, Switch, Linking } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: "network" | "globe" | "doc.fill" | "folder.fill";
  color: string;
}

interface BrowsingHistory {
  id: string;
  title: string;
  url: string;
  time: string;
}

interface ConnectionNode {
  id: string;
  name: string;
  location: string;
  latency: number;
  status: "connected" | "available" | "busy";
}

export default function VPNScreen() {
  const colors = useColors();
  const router = useRouter();
  const [vpnEnabled, setVpnEnabled] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [selectedNode, setSelectedNode] = useState("au-perth");

  const jediColor = "#8B5CF6";

  const quickLinks: QuickLink[] = [
    { id: "1", title: "JEDI Knowledge Base", url: "https://smpo-ink.manus.space", icon: "network", color: jediColor },
    { id: "2", title: "WONGI Tracker", url: "https://jeditek.net", icon: "globe", color: colors.primary },
    { id: "3", title: "MediVac Portal", url: "https://wongi.com.au", icon: "doc.fill", color: colors.success },
    { id: "4", title: "JediTek Main", url: "https://jeditek.com.au", icon: "folder.fill", color: colors.warning },
    { id: "5", title: "Evidence Portal", url: "https://smpo-evidance-port.manus.space", icon: "doc.fill", color: colors.error },
    { id: "6", title: "JEDI Systems", url: "https://jeditek.org", icon: "network", color: jediColor },
  ];

  const history: BrowsingHistory[] = [
    { id: "1", title: "SMPO.ink Knowledge Base", url: "smpo-ink.manus.space", time: "2 min ago" },
    { id: "2", title: "Patient Records Portal", url: "wongi.com.au/records", time: "15 min ago" },
    { id: "3", title: "JEDI Documentation", url: "jeditek.org/docs", time: "1 hour ago" },
    { id: "4", title: "Evidence Portal", url: "smpo-evidance-port.manus.space", time: "2 hours ago" },
  ];

  const nodes: ConnectionNode[] = [
    { id: "au-perth", name: "Perth", location: "Australia", latency: 12, status: "connected" },
    { id: "au-sydney", name: "Sydney", location: "Australia", latency: 45, status: "available" },
    { id: "sg", name: "Singapore", location: "Asia", latency: 85, status: "available" },
    { id: "us-west", name: "Los Angeles", location: "USA", latency: 180, status: "busy" },
  ];

  const getNodeStatusColor = (status: ConnectionNode["status"]) => {
    switch (status) {
      case "connected": return colors.success;
      case "available": return colors.primary;
      case "busy": return colors.warning;
    }
  };

  const handleNavigate = (url: string) => {
    Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
  };

  const handleSearch = () => {
    if (urlInput.trim()) {
      const url = urlInput.includes(".") ? urlInput : `https://www.google.com/search?q=${encodeURIComponent(urlInput)}`;
      handleNavigate(url);
      setUrlInput("");
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
            <View className="flex-1">
              <Text className="text-foreground text-2xl font-bold">VPN Browser</Text>
              <Text className="text-muted text-sm">Secure Network Access</Text>
            </View>
          </View>
        </View>

        {/* VPN Status Card */}
        <View className="px-5 mb-6">
          <View 
            className="rounded-2xl p-5"
            style={{ backgroundColor: vpnEnabled ? colors.success + '15' : colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View 
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: vpnEnabled ? colors.success + '30' : colors.muted + '30' }}
                >
                  <IconSymbol name="shield.fill" size={28} color={vpnEnabled ? colors.success : colors.muted} />
                </View>
                <View>
                  <Text className="text-foreground text-lg font-bold">
                    {vpnEnabled ? "VPN Connected" : "VPN Disconnected"}
                  </Text>
                  <Text className="text-muted text-sm">
                    {vpnEnabled ? "Your connection is secure" : "Tap to connect"}
                  </Text>
                </View>
              </View>
              <Switch
                value={vpnEnabled}
                onValueChange={setVpnEnabled}
                trackColor={{ false: colors.border, true: colors.success + '50' }}
                thumbColor={vpnEnabled ? colors.success : colors.muted}
              />
            </View>
            
            {vpnEnabled && (
              <View className="flex-row gap-3">
                <View className="flex-1 bg-background rounded-xl p-3">
                  <Text className="text-muted text-xs">Server</Text>
                  <Text className="text-foreground font-semibold">Perth, AU</Text>
                </View>
                <View className="flex-1 bg-background rounded-xl p-3">
                  <Text className="text-muted text-xs">Latency</Text>
                  <Text className="text-foreground font-semibold">12 ms</Text>
                </View>
                <View className="flex-1 bg-background rounded-xl p-3">
                  <Text className="text-muted text-xs">Protocol</Text>
                  <Text className="text-foreground font-semibold">SMPO.ink</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* URL Bar */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-border">
            <IconSymbol name="shield.fill" size={18} color={vpnEnabled ? colors.success : colors.muted} />
            <TextInput
              className="flex-1 text-foreground text-base"
              placeholder="Enter URL or search..."
              placeholderTextColor={colors.muted}
              value={urlInput}
              onChangeText={setUrlInput}
              onSubmitEditing={handleSearch}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">Quick Links</Text>
          <View className="flex-row flex-wrap gap-3">
            {quickLinks.map(link => (
              <TouchableOpacity
                key={link.id}
                className="bg-surface rounded-2xl p-4 items-center"
                style={{ width: '30%', minWidth: 100 }}
                onPress={() => handleNavigate(link.url)}
                activeOpacity={0.7}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: link.color + '20' }}
                >
                  <IconSymbol name={link.icon} size={24} color={link.color} />
                </View>
                <Text className="text-foreground text-xs font-medium text-center" numberOfLines={2}>
                  {link.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Server Selection */}
        <View className="px-5 mb-6">
          <Text className="text-foreground text-lg font-semibold mb-3">Server Location</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {nodes.map((node, index) => (
              <TouchableOpacity
                key={node.id}
                className="flex-row items-center p-4 gap-3"
                style={{
                  borderBottomWidth: index < nodes.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: selectedNode === node.id ? colors.primary + '10' : 'transparent',
                }}
                onPress={() => setSelectedNode(node.id)}
                activeOpacity={0.7}
              >
                <View 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getNodeStatusColor(node.status) }}
                />
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{node.name}</Text>
                  <Text className="text-muted text-sm">{node.location}</Text>
                </View>
                <Text className="text-muted text-sm">{node.latency} ms</Text>
                {selectedNode === node.id && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent History */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground text-lg font-semibold">Recent History</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary text-sm font-medium">Clear All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {history.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center p-4 gap-3"
                style={{
                  borderBottomWidth: index < history.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
                onPress={() => handleNavigate(item.url)}
                activeOpacity={0.7}
              >
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <IconSymbol name="globe" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-muted text-sm" numberOfLines={1}>{item.url}</Text>
                </View>
                <Text className="text-muted text-xs">{item.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Info */}
        <View className="px-5">
          <View className="bg-surface rounded-2xl p-4">
            <View className="flex-row items-center gap-3 mb-3">
              <IconSymbol name="lock.fill" size={20} color={colors.success} />
              <Text className="text-foreground font-semibold">Security Features</Text>
            </View>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text className="text-muted text-sm">256-bit AES Encryption</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text className="text-muted text-sm">SMPO.ink Protocol Compliant</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text className="text-muted text-sm">No Activity Logging</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text className="text-muted text-sm">DNS Leak Protection</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
