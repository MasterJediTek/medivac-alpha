/**
 * Real-Time Color Theme Switching Service
 * MediVac WACHS v8.3
 * 
 * Provides live theme switching with preview, multiple theme options,
 * smooth transitions, and system theme detection.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Theme Types
export type ThemeMode = "light" | "dark" | "high_contrast" | "jedi" | "medical" | "custom";

export interface ThemeColors {
  // Base colors
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Medical status colors
  codeBlue: string;
  codeRed: string;
  codeYellow: string;
  codeGreen: string;
  codePink: string;
  codeOrange: string;
  
  // JEDI colors
  jediGold: string;
  jediBlue: string;
  sithRed: string;
  forceGreen: string;
  
  // Data pathway colors
  pathwayL1: string;
  pathwayL2: string;
  pathwayL3: string;
  pathwayWebSocket: string;
  pathwayAPI: string;
  pathwayJEDI: string;
  pathwayOffline: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  isSystem: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeTransition {
  duration: number; // milliseconds
  easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  properties: string[];
}

export interface ThemePreview {
  themeId: string;
  previewColors: Partial<ThemeColors>;
  isActive: boolean;
  startedAt: Date;
}

export interface ThemePreference {
  userId: string;
  selectedThemeId: string;
  useSystemTheme: boolean;
  customizations: Partial<ThemeColors>;
  transitionEnabled: boolean;
  transitionDuration: number;
}

// Built-in Themes
export const LIGHT_THEME: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  foreground: "#11181C",
  muted: "#687076",
  border: "#E5E7EB",
  primary: "#0A7EA4",
  primaryForeground: "#FFFFFF",
  secondary: "#6366F1",
  secondaryForeground: "#FFFFFF",
  accent: "#F59E0B",
  accentForeground: "#000000",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  codeBlue: "#1E40AF",
  codeRed: "#DC2626",
  codeYellow: "#CA8A04",
  codeGreen: "#16A34A",
  codePink: "#DB2777",
  codeOrange: "#EA580C",
  jediGold: "#FFD700",
  jediBlue: "#4169E1",
  sithRed: "#8B0000",
  forceGreen: "#00FF00",
  pathwayL1: "#22C55E",
  pathwayL2: "#3B82F6",
  pathwayL3: "#8B5CF6",
  pathwayWebSocket: "#F97316",
  pathwayAPI: "#06B6D4",
  pathwayJEDI: "#FFD700",
  pathwayOffline: "#6B7280",
};

export const DARK_THEME: ThemeColors = {
  background: "#151718",
  surface: "#1E2022",
  foreground: "#ECEDEE",
  muted: "#9BA1A6",
  border: "#334155",
  primary: "#0A7EA4",
  primaryForeground: "#FFFFFF",
  secondary: "#818CF8",
  secondaryForeground: "#FFFFFF",
  accent: "#FBBF24",
  accentForeground: "#000000",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",
  codeBlue: "#3B82F6",
  codeRed: "#EF4444",
  codeYellow: "#EAB308",
  codeGreen: "#22C55E",
  codePink: "#EC4899",
  codeOrange: "#F97316",
  jediGold: "#FFD700",
  jediBlue: "#6495ED",
  sithRed: "#FF4444",
  forceGreen: "#00FF7F",
  pathwayL1: "#4ADE80",
  pathwayL2: "#60A5FA",
  pathwayL3: "#A78BFA",
  pathwayWebSocket: "#FB923C",
  pathwayAPI: "#22D3EE",
  pathwayJEDI: "#FFD700",
  pathwayOffline: "#9CA3AF",
};

export const HIGH_CONTRAST_THEME: ThemeColors = {
  background: "#000000",
  surface: "#1A1A1A",
  foreground: "#FFFFFF",
  muted: "#CCCCCC",
  border: "#FFFFFF",
  primary: "#00FFFF",
  primaryForeground: "#000000",
  secondary: "#FF00FF",
  secondaryForeground: "#000000",
  accent: "#FFFF00",
  accentForeground: "#000000",
  success: "#00FF00",
  warning: "#FFFF00",
  error: "#FF0000",
  info: "#00FFFF",
  codeBlue: "#0000FF",
  codeRed: "#FF0000",
  codeYellow: "#FFFF00",
  codeGreen: "#00FF00",
  codePink: "#FF00FF",
  codeOrange: "#FF8000",
  jediGold: "#FFD700",
  jediBlue: "#0000FF",
  sithRed: "#FF0000",
  forceGreen: "#00FF00",
  pathwayL1: "#00FF00",
  pathwayL2: "#0000FF",
  pathwayL3: "#FF00FF",
  pathwayWebSocket: "#FF8000",
  pathwayAPI: "#00FFFF",
  pathwayJEDI: "#FFD700",
  pathwayOffline: "#808080",
};

export const JEDI_THEME: ThemeColors = {
  background: "#0A0A0F",
  surface: "#14141F",
  foreground: "#FFD700",
  muted: "#B8860B",
  border: "#4169E1",
  primary: "#FFD700",
  primaryForeground: "#000000",
  secondary: "#4169E1",
  secondaryForeground: "#FFFFFF",
  accent: "#00CED1",
  accentForeground: "#000000",
  success: "#32CD32",
  warning: "#FFD700",
  error: "#DC143C",
  info: "#4169E1",
  codeBlue: "#4169E1",
  codeRed: "#DC143C",
  codeYellow: "#FFD700",
  codeGreen: "#32CD32",
  codePink: "#FF69B4",
  codeOrange: "#FF8C00",
  jediGold: "#FFD700",
  jediBlue: "#4169E1",
  sithRed: "#8B0000",
  forceGreen: "#00FF7F",
  pathwayL1: "#32CD32",
  pathwayL2: "#4169E1",
  pathwayL3: "#9370DB",
  pathwayWebSocket: "#FF8C00",
  pathwayAPI: "#00CED1",
  pathwayJEDI: "#FFD700",
  pathwayOffline: "#708090",
};

export const MEDICAL_THEME: ThemeColors = {
  background: "#F0F8FF",
  surface: "#FFFFFF",
  foreground: "#1E3A5F",
  muted: "#5A7A9A",
  border: "#B0C4DE",
  primary: "#0066CC",
  primaryForeground: "#FFFFFF",
  secondary: "#00A86B",
  secondaryForeground: "#FFFFFF",
  accent: "#FF6B6B",
  accentForeground: "#FFFFFF",
  success: "#00A86B",
  warning: "#FFB347",
  error: "#FF6B6B",
  info: "#0066CC",
  codeBlue: "#0066CC",
  codeRed: "#FF0000",
  codeYellow: "#FFD700",
  codeGreen: "#00A86B",
  codePink: "#FF69B4",
  codeOrange: "#FF8C00",
  jediGold: "#FFD700",
  jediBlue: "#4169E1",
  sithRed: "#8B0000",
  forceGreen: "#00FF7F",
  pathwayL1: "#00A86B",
  pathwayL2: "#0066CC",
  pathwayL3: "#9370DB",
  pathwayWebSocket: "#FF8C00",
  pathwayAPI: "#00CED1",
  pathwayJEDI: "#FFD700",
  pathwayOffline: "#A0A0A0",
};

// Theme Switching Service
class ThemeSwitchingService {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private activePreview: ThemePreview | null = null;
  private preferences: Map<string, ThemePreference> = new Map();
  private listeners: Set<(theme: Theme) => void> = new Set();
  private transitionConfig: ThemeTransition = {
    duration: 300,
    easing: "ease-in-out",
    properties: ["background-color", "color", "border-color", "fill", "stroke"],
  };

  constructor() {
    this.initializeBuiltInThemes();
  }

  private initializeBuiltInThemes(): void {
    const builtInThemes: Theme[] = [
      {
        id: "light",
        name: "Light",
        mode: "light",
        colors: LIGHT_THEME,
        isSystem: true,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "dark",
        name: "Dark",
        mode: "dark",
        colors: DARK_THEME,
        isSystem: true,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "high_contrast",
        name: "High Contrast",
        mode: "high_contrast",
        colors: HIGH_CONTRAST_THEME,
        isSystem: true,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "jedi",
        name: "JEDI",
        mode: "jedi",
        colors: JEDI_THEME,
        isSystem: true,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "medical",
        name: "Medical",
        mode: "medical",
        colors: MEDICAL_THEME,
        isSystem: true,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    builtInThemes.forEach((theme) => {
      this.themes.set(theme.id, theme);
    });

    this.currentTheme = this.themes.get("light") || null;
  }

  // Get all available themes
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  // Get theme by ID
  getTheme(themeId: string): Theme | null {
    return this.themes.get(themeId) || null;
  }

  // Get current active theme
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  // Switch to a different theme
  async switchTheme(themeId: string, animate: boolean = true): Promise<Theme | null> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.error(`Theme not found: ${themeId}`);
      return null;
    }

    if (animate) {
      await this.animateTransition(this.currentTheme, theme);
    }

    this.currentTheme = theme;
    this.notifyListeners(theme);
    await this.persistThemeSelection(themeId);

    return theme;
  }

  // Preview a theme without committing
  startPreview(themeId: string): ThemePreview | null {
    const theme = this.themes.get(themeId);
    if (!theme) return null;

    this.activePreview = {
      themeId,
      previewColors: theme.colors,
      isActive: true,
      startedAt: new Date(),
    };

    return this.activePreview;
  }

  // End preview and optionally apply
  endPreview(apply: boolean = false): void {
    if (!this.activePreview) return;

    if (apply) {
      this.switchTheme(this.activePreview.themeId);
    }

    this.activePreview = null;
  }

  // Get active preview
  getActivePreview(): ThemePreview | null {
    return this.activePreview;
  }

  // Create custom theme
  createCustomTheme(
    name: string,
    baseThemeId: string,
    customizations: Partial<ThemeColors>
  ): Theme {
    const baseTheme = this.themes.get(baseThemeId);
    if (!baseTheme) {
      throw new Error(`Base theme not found: ${baseThemeId}`);
    }

    const customTheme: Theme = {
      id: `custom_${Date.now()}`,
      name,
      mode: "custom",
      colors: { ...baseTheme.colors, ...customizations },
      isSystem: false,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.themes.set(customTheme.id, customTheme);
    return customTheme;
  }

  // Update custom theme
  updateCustomTheme(
    themeId: string,
    updates: Partial<ThemeColors>
  ): Theme | null {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.isCustom) {
      return null;
    }

    theme.colors = { ...theme.colors, ...updates };
    theme.updatedAt = new Date();
    this.themes.set(themeId, theme);

    if (this.currentTheme?.id === themeId) {
      this.notifyListeners(theme);
    }

    return theme;
  }

  // Delete custom theme
  deleteCustomTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.isCustom) {
      return false;
    }

    this.themes.delete(themeId);

    if (this.currentTheme?.id === themeId) {
      this.switchTheme("light");
    }

    return true;
  }

  // Detect system theme preference
  detectSystemTheme(): ThemeMode {
    // In React Native, we'd use Appearance API
    // For now, return a default
    return "light";
  }

  // Apply system theme
  async applySystemTheme(): Promise<Theme | null> {
    const systemMode = this.detectSystemTheme();
    return this.switchTheme(systemMode);
  }

  // Set transition configuration
  setTransitionConfig(config: Partial<ThemeTransition>): void {
    this.transitionConfig = { ...this.transitionConfig, ...config };
  }

  // Get transition configuration
  getTransitionConfig(): ThemeTransition {
    return { ...this.transitionConfig };
  }

  // Animate theme transition
  private async animateTransition(
    fromTheme: Theme | null,
    toTheme: Theme
  ): Promise<void> {
    // In a real implementation, this would use Animated API
    // For now, simulate the transition delay
    return new Promise((resolve) => {
      setTimeout(resolve, this.transitionConfig.duration);
    });
  }

  // Subscribe to theme changes
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach((listener) => listener(theme));
  }

  // Persist theme selection
  private async persistThemeSelection(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem("@medivac_theme", themeId);
    } catch (error) {
      console.error("Failed to persist theme selection:", error);
    }
  }

  // Load persisted theme
  async loadPersistedTheme(): Promise<Theme | null> {
    try {
      const themeId = await AsyncStorage.getItem("@medivac_theme");
      if (themeId) {
        return this.switchTheme(themeId, false);
      }
    } catch (error) {
      console.error("Failed to load persisted theme:", error);
    }
    return this.currentTheme;
  }

  // Save user preferences
  async savePreferences(
    userId: string,
    preferences: Partial<ThemePreference>
  ): Promise<ThemePreference> {
    const existing = this.preferences.get(userId) || {
      userId,
      selectedThemeId: "light",
      useSystemTheme: false,
      customizations: {},
      transitionEnabled: true,
      transitionDuration: 300,
    };

    const updated = { ...existing, ...preferences };
    this.preferences.set(userId, updated);

    try {
      await AsyncStorage.setItem(
        `@medivac_theme_prefs_${userId}`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }

    return updated;
  }

  // Load user preferences
  async loadPreferences(userId: string): Promise<ThemePreference | null> {
    try {
      const data = await AsyncStorage.getItem(`@medivac_theme_prefs_${userId}`);
      if (data) {
        const prefs = JSON.parse(data) as ThemePreference;
        this.preferences.set(userId, prefs);
        return prefs;
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
    return null;
  }

  // Get color by key from current theme
  getColor(key: keyof ThemeColors): string {
    if (this.activePreview) {
      return (
        this.activePreview.previewColors[key] ||
        this.currentTheme?.colors[key] ||
        LIGHT_THEME[key]
      );
    }
    return this.currentTheme?.colors[key] || LIGHT_THEME[key];
  }

  // Get all colors from current theme
  getColors(): ThemeColors {
    if (this.activePreview && this.currentTheme) {
      return { ...this.currentTheme.colors, ...this.activePreview.previewColors };
    }
    return this.currentTheme?.colors || LIGHT_THEME;
  }

  // Generate CSS variables for web
  generateCSSVariables(theme?: Theme): Record<string, string> {
    const colors = theme?.colors || this.currentTheme?.colors || LIGHT_THEME;
    const variables: Record<string, string> = {};

    Object.entries(colors).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      variables[`--color-${cssKey}`] = value;
    });

    return variables;
  }

  // Export theme as JSON
  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    if (!theme) return null;
    return JSON.stringify(theme, null, 2);
  }

  // Import theme from JSON
  importTheme(json: string): Theme | null {
    try {
      const theme = JSON.parse(json) as Theme;
      theme.id = `imported_${Date.now()}`;
      theme.isSystem = false;
      theme.isCustom = true;
      theme.createdAt = new Date();
      theme.updatedAt = new Date();
      this.themes.set(theme.id, theme);
      return theme;
    } catch (error) {
      console.error("Failed to import theme:", error);
      return null;
    }
  }

  // Get theme analytics
  getThemeAnalytics(): {
    totalThemes: number;
    customThemes: number;
    systemThemes: number;
    currentTheme: string;
    previewActive: boolean;
  } {
    const themes = Array.from(this.themes.values());
    return {
      totalThemes: themes.length,
      customThemes: themes.filter((t) => t.isCustom).length,
      systemThemes: themes.filter((t) => t.isSystem).length,
      currentTheme: this.currentTheme?.name || "None",
      previewActive: this.activePreview !== null,
    };
  }
}

// Export singleton instance
export const themeSwitchingService = new ThemeSwitchingService();
