/**
 * Theme Switching Screen
 * MediVac WACHS v8.3
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  themeSwitchingService,
  Theme,
  ThemeColors,
} from "@/lib/services/theme-switching-service";

export default function ThemeSwitchingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [useSystemTheme, setUseSystemTheme] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = () => {
    setThemes(themeSwitchingService.getAllThemes());
    setCurrentTheme(themeSwitchingService.getCurrentTheme());
  };

  const handleThemeSelect = async (themeId: string) => {
    await themeSwitchingService.switchTheme(themeId, transitionEnabled);
    setCurrentTheme(themeSwitchingService.getCurrentTheme());
    setPreviewTheme(null);
  };

  const handlePreviewStart = (themeId: string) => {
    themeSwitchingService.startPreview(themeId);
    setPreviewTheme(themeId);
  };

  const handlePreviewEnd = (apply: boolean) => {
    themeSwitchingService.endPreview(apply);
    if (apply) {
      setCurrentTheme(themeSwitchingService.getCurrentTheme());
    }
    setPreviewTheme(null);
  };

  const renderColorSwatch = (colorKey: string, colorValue: string) => (
    <View key={colorKey} style={styles.colorSwatch}>
      <View style={[styles.colorBox, { backgroundColor: colorValue }]} />
      <Text style={[styles.colorLabel, { color: colors.muted }]}>
        {colorKey.replace(/([A-Z])/g, " $1").trim()}
      </Text>
    </View>
  );

  const renderThemeCard = (theme: Theme) => {
    const isActive = currentTheme?.id === theme.id;
    const isPreviewing = previewTheme === theme.id;

    return (
      <TouchableOpacity
        key={theme.id}
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
            borderWidth: isActive ? 2 : 1,
          },
        ]}
        onPress={() => handleThemeSelect(theme.id)}
        onLongPress={() => handlePreviewStart(theme.id)}
      >
        <View style={styles.themeHeader}>
          <Text style={[styles.themeName, { color: colors.foreground }]}>
            {theme.name}
          </Text>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
          {isPreviewing && (
            <View style={[styles.activeBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.activeBadgeText}>Preview</Text>
            </View>
          )}
        </View>

        {/* Color Preview */}
        <View style={styles.colorPreview}>
          <View
            style={[
              styles.previewBg,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.previewSurface,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.previewPrimary,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.previewAccent,
                  { backgroundColor: theme.colors.accent },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Key Colors */}
        <View style={styles.keyColors}>
          {["primary", "success", "warning", "error"].map((key) => (
            <View
              key={key}
              style={[
                styles.keyColorDot,
                { backgroundColor: theme.colors[key as keyof ThemeColors] },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.themeMode, { color: colors.muted }]}>
          {theme.mode.replace("_", " ").toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Theme Switching
          </Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              Use System Theme
            </Text>
            <Switch
              value={useSystemTheme}
              onValueChange={setUseSystemTheme}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              Smooth Transitions
            </Text>
            <Switch
              value={transitionEnabled}
              onValueChange={setTransitionEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        {/* Preview Controls */}
        {previewTheme && (
          <View style={[styles.previewControls, { backgroundColor: colors.warning + "20" }]}>
            <Text style={[styles.previewText, { color: colors.foreground }]}>
              Previewing theme - Long press to preview, tap to apply
            </Text>
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.previewButton, { backgroundColor: colors.error }]}
                onPress={() => handlePreviewEnd(false)}
              >
                <Text style={styles.previewButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, { backgroundColor: colors.success }]}
                onPress={() => handlePreviewEnd(true)}
              >
                <Text style={styles.previewButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Theme Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Available Themes
        </Text>
        <View style={styles.themeGrid}>
          {themes.map(renderThemeCard)}
        </View>

        {/* Current Theme Colors */}
        {currentTheme && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Current Theme Colors
            </Text>
            <View style={[styles.colorsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.colorGrid}>
                {Object.entries(currentTheme.colors)
                  .slice(0, 12)
                  .map(([key, value]) => renderColorSwatch(key, value))}
              </View>
            </View>
          </>
        )}

        {/* Analytics */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Theme Analytics
        </Text>
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          {(() => {
            const analytics = themeSwitchingService.getThemeAnalytics();
            return (
              <>
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                    Total Themes
                  </Text>
                  <Text style={[styles.analyticsValue, { color: colors.foreground }]}>
                    {analytics.totalThemes}
                  </Text>
                </View>
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                    Custom Themes
                  </Text>
                  <Text style={[styles.analyticsValue, { color: colors.foreground }]}>
                    {analytics.customThemes}
                  </Text>
                </View>
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                    Current Theme
                  </Text>
                  <Text style={[styles.analyticsValue, { color: colors.primary }]}>
                    {analytics.currentTheme}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  previewControls: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 12,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 12,
  },
  previewButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  previewButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  themeCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
  },
  themeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  colorPreview: {
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  previewBg: {
    flex: 1,
    padding: 8,
  },
  previewSurface: {
    flex: 1,
    borderRadius: 4,
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  previewPrimary: {
    flex: 1,
    borderRadius: 2,
  },
  previewAccent: {
    width: 20,
    borderRadius: 2,
  },
  keyColors: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  keyColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeMode: {
    fontSize: 10,
  },
  colorsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: "30%",
    alignItems: "center",
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  analyticsLabel: {
    fontSize: 14,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
