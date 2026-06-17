import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  appStoreScreenshotsService,
  Screenshot,
  ScreenshotSet,
  StoreType,
  DeviceType,
  DEVICE_FRAMES,
} from "@/lib/services/app-store-screenshots-service";

export default function StoreScreenshotsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotSets, setScreenshotSets] = useState<ScreenshotSet[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreType>("google_play");
  const [analytics, setAnalytics] = useState<{
    totalScreenshots: number;
    screenshotSets: number;
    readySets: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const unsubscribe = appStoreScreenshotsService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const [screenshotData, setsData, analyticsData] = await Promise.all([
        appStoreScreenshotsService.getAllScreenshots(),
        appStoreScreenshotsService.getAllScreenshotSets(),
        appStoreScreenshotsService.getAnalytics(),
      ]);
      setScreenshots(screenshotData);
      setScreenshotSets(setsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load screenshots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForStore = async (store: StoreType) => {
    try {
      await appStoreScreenshotsService.generateStoreScreenshots(store);
      await loadData();
    } catch (error) {
      console.error("Failed to generate screenshots:", error);
    }
  };

  const stores: { key: StoreType; label: string; icon: string }[] = [
    { key: "google_play", label: "Google Play", icon: "🤖" },
    { key: "apple_app_store", label: "App Store", icon: "🍎" },
    { key: "microsoft_store", label: "Microsoft", icon: "🪟" },
  ];

  const deviceFrames = Object.values(DEVICE_FRAMES);

  const renderScreenshot = ({ item }: { item: Screenshot }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, flex: 1 }}>
          {item.name}
        </Text>
        <View
          style={{
            backgroundColor: colors.primary + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.primary }}>{item.category}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>{item.description}</Text>
      <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {item.deviceFrames.length} framed versions
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {item.annotations.length} annotations
        </Text>
      </View>
    </View>
  );

  const renderScreenshotSet = ({ item }: { item: ScreenshotSet }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, flex: 1 }}>
          {item.name}
        </Text>
        <View
          style={{
            backgroundColor:
              item.status === "ready"
                ? colors.success + "20"
                : item.status === "submitted"
                ? colors.primary + "20"
                : colors.warning + "20",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color:
                item.status === "ready"
                  ? colors.success
                  : item.status === "submitted"
                  ? colors.primary
                  : colors.warning,
            }}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
        {item.screenshots.length} screenshots • {item.deviceType.replace(/_/g, " ")} • {item.language}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Loading screenshots...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
              Store Screenshots
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Manage app store promotional images
            </Text>
          </View>
        </View>

        {/* Analytics Cards */}
        {analytics && (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primary + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
                {analytics.totalScreenshots}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Screenshots</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.success + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.success }}>
                {analytics.screenshotSets}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Sets</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.warning + "15",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.warning }}>
                {analytics.readySets}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Ready</Text>
            </View>
          </View>
        )}

        {/* Store Selection */}
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Generate for Store
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {stores.map((store) => (
            <TouchableOpacity
              key={store.key}
              onPress={() => handleGenerateForStore(store.key)}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>{store.icon}</Text>
              <Text style={{ fontSize: 12, color: colors.foreground, textAlign: "center" }}>
                {store.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Device Frames */}
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Available Device Frames
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {deviceFrames.map((frame) => (
            <View
              key={frame.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                marginRight: 12,
                width: 120,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4 }}>
                {frame.platform.toUpperCase()}
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, textAlign: "center" }}
              >
                {frame.name}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
                {frame.width}x{frame.height}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Screenshot Sets */}
        {screenshotSets.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Screenshot Sets
            </Text>
            <FlatList
              data={screenshotSets}
              renderItem={renderScreenshotSet}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={{ marginBottom: 24 }}
            />
          </>
        )}

        {/* Screenshots */}
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          All Screenshots ({screenshots.length})
        </Text>
        <FlatList
          data={screenshots}
          renderItem={renderScreenshot}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
