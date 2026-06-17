import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { localizedAssetsService } from "@/lib/services/localized-assets-service";

export default function LocalizedAssetsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [coverage, setCoverage] = useState<Awaited<ReturnType<typeof localizedAssetsService.getLocalizationCoverage>>>([]);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof localizedAssetsService.getAnalyticsSummary>> | null>(null);
  const locales = localizedAssetsService.getEnabledLocales();

  useEffect(() => {
    loadData();
    const unsubscribe = localizedAssetsService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    const [cov, stats] = await Promise.all([
      localizedAssetsService.getLocalizationCoverage(),
      localizedAssetsService.getAnalyticsSummary(),
    ]);
    setCoverage(cov);
    setAnalytics(stats);
  };

  const getCoverageColor = (percent: number) => {
    if (percent >= 80) return "#22C55E";
    if (percent >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Localized Assets</Text>
          <Text className="text-muted mt-1">International market coverage</Text>
        </View>

        {/* Analytics Summary */}
        {analytics && (
          <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Localization Summary</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.enabledLocales}</Text>
                <Text className="text-xs text-muted">Locales</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>{analytics.approvedAssets}</Text>
                <Text className="text-xs text-muted">Approved</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{analytics.pendingAssets}</Text>
                <Text className="text-xs text-muted">Pending</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.averageCoverage}%</Text>
                <Text className="text-xs text-muted">Coverage</Text>
              </View>
            </View>
          </View>
        )}

        {/* RTL Languages Notice */}
        <View className="mx-4 mt-4 bg-primary/10 rounded-xl p-3 border border-primary/20">
          <Text className="text-primary text-sm">
            🌍 {analytics?.rtlLocales || 0} RTL language(s) supported (Arabic, Hebrew)
          </Text>
        </View>

        {/* Coverage by Locale */}
        <View className="px-4 mt-4 pb-8">
          <Text className="text-lg font-semibold text-foreground mb-3">Coverage by Locale</Text>
          {coverage.map((loc) => {
            const localeConfig = locales.find(l => l.code === loc.locale);
            return (
              <View key={loc.locale} className="mb-3 bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-foreground font-semibold">{loc.localeName}</Text>
                    <Text className="text-muted text-xs">{localeConfig?.nativeName} • {localeConfig?.region}</Text>
                  </View>
                  <View className="items-end">
                    <Text 
                      className="text-lg font-bold"
                      style={{ color: getCoverageColor(loc.overallCoverage) }}
                    >
                      {loc.overallCoverage}%
                    </Text>
                    {localeConfig?.direction === "rtl" && (
                      <Text className="text-xs text-muted">RTL</Text>
                    )}
                  </View>
                </View>
                
                {/* Progress Bars */}
                <View className="mt-2">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-xs text-muted w-24">Screenshots</Text>
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View 
                        style={{ width: `${loc.screenshotsCoverage}%`, backgroundColor: getCoverageColor(loc.screenshotsCoverage) }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <Text className="text-xs text-muted w-10 text-right">{loc.screenshotsCoverage}%</Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Text className="text-xs text-muted w-24">Description</Text>
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View 
                        style={{ width: `${loc.descriptionCoverage}%`, backgroundColor: getCoverageColor(loc.descriptionCoverage) }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <Text className="text-xs text-muted w-10 text-right">{loc.descriptionCoverage}%</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-muted w-24">Keywords</Text>
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View 
                        style={{ width: `${loc.keywordsCoverage}%`, backgroundColor: getCoverageColor(loc.keywordsCoverage) }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <Text className="text-xs text-muted w-10 text-right">{loc.keywordsCoverage}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
