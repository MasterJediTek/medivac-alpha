import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { colorChartService, MEDICAL_STATUS_COLORS, JEDI_RANK_COLORS, DATA_PATHWAY_COLORS, PRIORITY_COLORS, DEPARTMENT_COLORS, ALERT_SEVERITY_COLORS } from "@/lib/services/color-chart-service";

type ColorCategory = "medical" | "jedi" | "pathway" | "priority" | "department" | "alert";

export default function ColorChartScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<ColorCategory>("medical");
  const [analytics, setAnalytics] = useState(colorChartService.getAnalytics());

  const categories: { key: ColorCategory; label: string; count: number }[] = [
    { key: "medical", label: "Medical Codes", count: Object.keys(MEDICAL_STATUS_COLORS).length },
    { key: "jedi", label: "JEDI Ranks", count: Object.keys(JEDI_RANK_COLORS).length },
    { key: "pathway", label: "Data Pathways", count: Object.keys(DATA_PATHWAY_COLORS).length },
    { key: "priority", label: "Priority", count: Object.keys(PRIORITY_COLORS).length },
    { key: "department", label: "Departments", count: Object.keys(DEPARTMENT_COLORS).length },
    { key: "alert", label: "Alerts", count: Object.keys(ALERT_SEVERITY_COLORS).length },
  ];

  const renderColorGrid = () => {
    let colorData: Array<{ key: string; hex: string; name: string; description?: string }> = [];

    switch (selectedCategory) {
      case "medical":
        colorData = Object.entries(MEDICAL_STATUS_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: val.description
        }));
        break;
      case "jedi":
        colorData = Object.entries(JEDI_RANK_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: `Level ${val.level}`
        }));
        break;
      case "pathway":
        colorData = Object.entries(DATA_PATHWAY_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: val.description
        }));
        break;
      case "priority":
        colorData = Object.entries(PRIORITY_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: val.description
        }));
        break;
      case "department":
        colorData = Object.entries(DEPARTMENT_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: `Code: ${val.code}`
        }));
        break;
      case "alert":
        colorData = Object.entries(ALERT_SEVERITY_COLORS).map(([key, val]) => ({
          key, hex: val.hex, name: val.name, description: val.icon
        }));
        break;
    }

    return colorData.map((item) => {
      const textColor = colorChartService.getBestTextColor(item.hex);
      return (
        <View key={item.key} className="mb-3">
          <View 
            style={{ backgroundColor: item.hex }}
            className="rounded-xl p-4 shadow-sm"
          >
            <Text style={{ color: textColor }} className="text-lg font-bold">{item.name}</Text>
            <Text style={{ color: textColor, opacity: 0.8 }} className="text-sm mt-1">{item.hex}</Text>
            {item.description && (
              <Text style={{ color: textColor, opacity: 0.7 }} className="text-xs mt-1">{item.description}</Text>
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Standard Color Chart</Text>
          <Text className="text-muted mt-1">MediVac WACHS color coding system</Text>
        </View>

        {/* Analytics Summary */}
        <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Color System Analytics</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">{analytics.totalColors}</Text>
              <Text className="text-xs text-muted">Total Colors</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">{analytics.categories}</Text>
              <Text className="text-xs text-muted">Categories</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>{analytics.accessiblePairs}</Text>
              <Text className="text-xs text-muted">Accessible</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 px-4">
          {categories.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedCategory === cat.key ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text className={selectedCategory === cat.key ? "text-white font-semibold" : "text-foreground"}>
                {cat.label} ({cat.count})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Color Grid */}
        <View className="px-4 mt-4 pb-8">
          {renderColorGrid()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
