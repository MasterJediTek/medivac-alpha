/**
 * App Store Screenshots Service
 * Manages screenshot generation, device frames, and export for all app stores
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Screenshot types
export type DeviceType = "iphone_15_pro_max" | "iphone_15" | "iphone_se" | "ipad_pro" | "pixel_8_pro" | "pixel_8" | "galaxy_s24" | "surface_pro";
export type ScreenshotCategory = "dashboard" | "patients" | "schedule" | "tasks" | "jedi" | "settings" | "onboarding" | "features";
export type StoreType = "google_play" | "apple_app_store" | "microsoft_store";

export interface DeviceFrame {
  id: string;
  name: string;
  type: DeviceType;
  platform: "ios" | "android" | "windows";
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  frameUrl: string;
  cornerRadius: number;
}

export interface Screenshot {
  id: string;
  name: string;
  category: ScreenshotCategory;
  description: string;
  sourceUrl: string;
  deviceFrames: ScreenshotWithFrame[];
  annotations: ScreenshotAnnotation[];
  createdAt: string;
  updatedAt: string;
}

export interface ScreenshotWithFrame {
  id: string;
  screenshotId: string;
  deviceType: DeviceType;
  framedUrl: string;
  width: number;
  height: number;
  store: StoreType;
}

export interface ScreenshotAnnotation {
  id: string;
  type: "text" | "arrow" | "highlight" | "badge";
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  fontSize?: number;
}

export interface ScreenshotSet {
  id: string;
  name: string;
  store: StoreType;
  screenshots: Screenshot[];
  deviceType: DeviceType;
  language: string;
  status: "draft" | "ready" | "submitted";
  createdAt: string;
}

export interface StoreRequirements {
  store: StoreType;
  minScreenshots: number;
  maxScreenshots: number;
  requiredSizes: { width: number; height: number; name: string }[];
  aspectRatio: string;
  fileFormat: string[];
  maxFileSize: number;
}

// Device frames configuration
export const DEVICE_FRAMES: Record<DeviceType, DeviceFrame> = {
  iphone_15_pro_max: {
    id: "iphone_15_pro_max",
    name: "iPhone 15 Pro Max",
    type: "iphone_15_pro_max",
    platform: "ios",
    width: 1290,
    height: 2796,
    screenWidth: 1179,
    screenHeight: 2556,
    frameUrl: "https://files.manuscdn.com/frames/iphone_15_pro_max.png",
    cornerRadius: 55,
  },
  iphone_15: {
    id: "iphone_15",
    name: "iPhone 15",
    type: "iphone_15",
    platform: "ios",
    width: 1179,
    height: 2556,
    screenWidth: 1080,
    screenHeight: 2340,
    frameUrl: "https://files.manuscdn.com/frames/iphone_15.png",
    cornerRadius: 50,
  },
  iphone_se: {
    id: "iphone_se",
    name: "iPhone SE",
    type: "iphone_se",
    platform: "ios",
    width: 750,
    height: 1334,
    screenWidth: 640,
    screenHeight: 1136,
    frameUrl: "https://files.manuscdn.com/frames/iphone_se.png",
    cornerRadius: 0,
  },
  ipad_pro: {
    id: "ipad_pro",
    name: "iPad Pro 12.9\"",
    type: "ipad_pro",
    platform: "ios",
    width: 2048,
    height: 2732,
    screenWidth: 2048,
    screenHeight: 2732,
    frameUrl: "https://files.manuscdn.com/frames/ipad_pro.png",
    cornerRadius: 18,
  },
  pixel_8_pro: {
    id: "pixel_8_pro",
    name: "Google Pixel 8 Pro",
    type: "pixel_8_pro",
    platform: "android",
    width: 1344,
    height: 2992,
    screenWidth: 1260,
    screenHeight: 2800,
    frameUrl: "https://files.manuscdn.com/frames/pixel_8_pro.png",
    cornerRadius: 48,
  },
  pixel_8: {
    id: "pixel_8",
    name: "Google Pixel 8",
    type: "pixel_8",
    platform: "android",
    width: 1080,
    height: 2400,
    screenWidth: 1008,
    screenHeight: 2244,
    frameUrl: "https://files.manuscdn.com/frames/pixel_8.png",
    cornerRadius: 44,
  },
  galaxy_s24: {
    id: "galaxy_s24",
    name: "Samsung Galaxy S24",
    type: "galaxy_s24",
    platform: "android",
    width: 1080,
    height: 2340,
    screenWidth: 1008,
    screenHeight: 2184,
    frameUrl: "https://files.manuscdn.com/frames/galaxy_s24.png",
    cornerRadius: 40,
  },
  surface_pro: {
    id: "surface_pro",
    name: "Microsoft Surface Pro",
    type: "surface_pro",
    platform: "windows",
    width: 2880,
    height: 1920,
    screenWidth: 2736,
    screenHeight: 1824,
    frameUrl: "https://files.manuscdn.com/frames/surface_pro.png",
    cornerRadius: 8,
  },
};

// Store requirements
export const STORE_REQUIREMENTS: Record<StoreType, StoreRequirements> = {
  google_play: {
    store: "google_play",
    minScreenshots: 2,
    maxScreenshots: 8,
    requiredSizes: [
      { width: 1080, height: 1920, name: "Phone" },
      { width: 1200, height: 1920, name: "7-inch Tablet" },
      { width: 1600, height: 2560, name: "10-inch Tablet" },
    ],
    aspectRatio: "9:16",
    fileFormat: ["png", "jpg"],
    maxFileSize: 8 * 1024 * 1024, // 8MB
  },
  apple_app_store: {
    store: "apple_app_store",
    minScreenshots: 1,
    maxScreenshots: 10,
    requiredSizes: [
      { width: 1290, height: 2796, name: "iPhone 6.7\"" },
      { width: 1179, height: 2556, name: "iPhone 6.1\"" },
      { width: 2048, height: 2732, name: "iPad Pro 12.9\"" },
    ],
    aspectRatio: "9:19.5",
    fileFormat: ["png", "jpg"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  microsoft_store: {
    store: "microsoft_store",
    minScreenshots: 1,
    maxScreenshots: 10,
    requiredSizes: [
      { width: 1920, height: 1080, name: "Desktop" },
      { width: 1366, height: 768, name: "Laptop" },
      { width: 768, height: 1024, name: "Tablet" },
    ],
    aspectRatio: "16:9",
    fileFormat: ["png"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};

// Default screenshots for MediVac WACHS
const DEFAULT_SCREENSHOTS: Omit<Screenshot, "id" | "deviceFrames" | "createdAt" | "updatedAt">[] = [
  {
    name: "Dashboard Overview",
    category: "dashboard",
    description: "Main dashboard showing patient count, appointments, alerts, and JEDI connection status",
    sourceUrl: "",
    annotations: [
      { id: "ann1", type: "badge", content: "47 Patients", x: 50, y: 130, color: "#4285F4", fontSize: 14 },
      { id: "ann2", type: "text", content: "Real-time JEDI Sync", x: 180, y: 240, color: "#34A853", fontSize: 12 },
    ],
  },
  {
    name: "Patient Management",
    category: "patients",
    description: "Patient list with search, filters, and quick access to patient details",
    sourceUrl: "",
    annotations: [
      { id: "ann3", type: "highlight", content: "Search & Filter", x: 20, y: 80, width: 340, height: 50, color: "#FBBC04" },
    ],
  },
  {
    name: "Schedule View",
    category: "schedule",
    description: "Daily and weekly schedule with appointment management",
    sourceUrl: "",
    annotations: [],
  },
  {
    name: "Task Management",
    category: "tasks",
    description: "Kanban-style task board for clinical workflow management",
    sourceUrl: "",
    annotations: [],
  },
  {
    name: "JEDI Integration Hub",
    category: "jedi",
    description: "JEDI systems connection status and module access",
    sourceUrl: "",
    annotations: [
      { id: "ann4", type: "badge", content: "Connected", x: 300, y: 50, color: "#34A853", fontSize: 12 },
    ],
  },
  {
    name: "Settings & Configuration",
    category: "settings",
    description: "App settings, notifications, and user preferences",
    sourceUrl: "",
    annotations: [],
  },
];

interface ScreenshotServiceState {
  screenshots: Screenshot[];
  screenshotSets: ScreenshotSet[];
  initialized: boolean;
}

class AppStoreScreenshotsService {
  private state: ScreenshotServiceState = {
    screenshots: [],
    screenshotSets: [],
    initialized: false,
  };

  private listeners: Set<() => void> = new Set();

  async initialize(): Promise<void> {
    if (this.state.initialized) return;

    try {
      const saved = await AsyncStorage.getItem("@medivac_screenshots_state");
      if (saved) {
        this.state = { ...JSON.parse(saved), initialized: true };
      } else {
        // Initialize with default screenshots
        this.state.screenshots = DEFAULT_SCREENSHOTS.map((s, index) => ({
          ...s,
          id: `screenshot_${index + 1}`,
          deviceFrames: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        this.state.initialized = true;
        await this.saveState();
      }
    } catch (error) {
      console.error("Failed to initialize screenshots service:", error);
      this.state.initialized = true;
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem("@medivac_screenshots_state", JSON.stringify(this.state));
    } catch (error) {
      console.error("Failed to save screenshots state:", error);
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Screenshot management
  async getAllScreenshots(): Promise<Screenshot[]> {
    await this.initialize();
    return [...this.state.screenshots];
  }

  async getScreenshot(id: string): Promise<Screenshot | undefined> {
    await this.initialize();
    return this.state.screenshots.find((s) => s.id === id);
  }

  async getScreenshotsByCategory(category: ScreenshotCategory): Promise<Screenshot[]> {
    await this.initialize();
    return this.state.screenshots.filter((s) => s.category === category);
  }

  async createScreenshot(data: Omit<Screenshot, "id" | "deviceFrames" | "createdAt" | "updatedAt">): Promise<Screenshot> {
    await this.initialize();

    const screenshot: Screenshot = {
      ...data,
      id: `screenshot_${Date.now()}`,
      deviceFrames: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.screenshots.push(screenshot);
    await this.saveState();
    this.emit();

    return screenshot;
  }

  async updateScreenshot(id: string, updates: Partial<Screenshot>): Promise<Screenshot | undefined> {
    await this.initialize();

    const index = this.state.screenshots.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    this.state.screenshots[index] = {
      ...this.state.screenshots[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveState();
    this.emit();

    return this.state.screenshots[index];
  }

  async deleteScreenshot(id: string): Promise<boolean> {
    await this.initialize();

    const index = this.state.screenshots.findIndex((s) => s.id === id);
    if (index === -1) return false;

    this.state.screenshots.splice(index, 1);
    await this.saveState();
    this.emit();

    return true;
  }

  // Device frame operations
  getDeviceFrame(type: DeviceType): DeviceFrame {
    return DEVICE_FRAMES[type];
  }

  getAllDeviceFrames(): DeviceFrame[] {
    return Object.values(DEVICE_FRAMES);
  }

  getDeviceFramesByPlatform(platform: "ios" | "android" | "windows"): DeviceFrame[] {
    return Object.values(DEVICE_FRAMES).filter((f) => f.platform === platform);
  }

  // Generate framed screenshot (simulated)
  async generateFramedScreenshot(
    screenshotId: string,
    deviceType: DeviceType,
    store: StoreType
  ): Promise<ScreenshotWithFrame> {
    await this.initialize();

    const screenshot = this.state.screenshots.find((s) => s.id === screenshotId);
    if (!screenshot) {
      throw new Error(`Screenshot ${screenshotId} not found`);
    }

    const frame = DEVICE_FRAMES[deviceType];
    const framedScreenshot: ScreenshotWithFrame = {
      id: `framed_${screenshotId}_${deviceType}_${Date.now()}`,
      screenshotId,
      deviceType,
      framedUrl: `https://files.manuscdn.com/screenshots/${screenshotId}_${deviceType}.png`,
      width: frame.width,
      height: frame.height,
      store,
    };

    // Add to screenshot's device frames
    const index = this.state.screenshots.findIndex((s) => s.id === screenshotId);
    if (index !== -1) {
      this.state.screenshots[index].deviceFrames.push(framedScreenshot);
      this.state.screenshots[index].updatedAt = new Date().toISOString();
      await this.saveState();
      this.emit();
    }

    return framedScreenshot;
  }

  // Screenshot sets for stores
  async createScreenshotSet(data: Omit<ScreenshotSet, "id" | "createdAt">): Promise<ScreenshotSet> {
    await this.initialize();

    const set: ScreenshotSet = {
      ...data,
      id: `set_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.state.screenshotSets.push(set);
    await this.saveState();
    this.emit();

    return set;
  }

  async getAllScreenshotSets(): Promise<ScreenshotSet[]> {
    await this.initialize();
    return [...this.state.screenshotSets];
  }

  async getScreenshotSetsByStore(store: StoreType): Promise<ScreenshotSet[]> {
    await this.initialize();
    return this.state.screenshotSets.filter((s) => s.store === store);
  }

  async updateScreenshotSetStatus(id: string, status: ScreenshotSet["status"]): Promise<ScreenshotSet | undefined> {
    await this.initialize();

    const index = this.state.screenshotSets.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    this.state.screenshotSets[index].status = status;
    await this.saveState();
    this.emit();

    return this.state.screenshotSets[index];
  }

  // Store requirements
  getStoreRequirements(store: StoreType): StoreRequirements {
    return STORE_REQUIREMENTS[store];
  }

  getAllStoreRequirements(): StoreRequirements[] {
    return Object.values(STORE_REQUIREMENTS);
  }

  // Validation
  validateScreenshotSet(set: ScreenshotSet): { valid: boolean; errors: string[] } {
    const requirements = STORE_REQUIREMENTS[set.store];
    const errors: string[] = [];

    if (set.screenshots.length < requirements.minScreenshots) {
      errors.push(`Minimum ${requirements.minScreenshots} screenshots required, got ${set.screenshots.length}`);
    }

    if (set.screenshots.length > requirements.maxScreenshots) {
      errors.push(`Maximum ${requirements.maxScreenshots} screenshots allowed, got ${set.screenshots.length}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Annotation management
  async addAnnotation(screenshotId: string, annotation: Omit<ScreenshotAnnotation, "id">): Promise<ScreenshotAnnotation> {
    await this.initialize();

    const newAnnotation: ScreenshotAnnotation = {
      ...annotation,
      id: `ann_${Date.now()}`,
    };

    const index = this.state.screenshots.findIndex((s) => s.id === screenshotId);
    if (index !== -1) {
      this.state.screenshots[index].annotations.push(newAnnotation);
      this.state.screenshots[index].updatedAt = new Date().toISOString();
      await this.saveState();
      this.emit();
    }

    return newAnnotation;
  }

  async removeAnnotation(screenshotId: string, annotationId: string): Promise<boolean> {
    await this.initialize();

    const screenshotIndex = this.state.screenshots.findIndex((s) => s.id === screenshotId);
    if (screenshotIndex === -1) return false;

    const annotationIndex = this.state.screenshots[screenshotIndex].annotations.findIndex(
      (a) => a.id === annotationId
    );
    if (annotationIndex === -1) return false;

    this.state.screenshots[screenshotIndex].annotations.splice(annotationIndex, 1);
    this.state.screenshots[screenshotIndex].updatedAt = new Date().toISOString();
    await this.saveState();
    this.emit();

    return true;
  }

  // Export functionality
  async exportScreenshotSet(setId: string, format: "zip" | "individual"): Promise<string[]> {
    await this.initialize();

    const set = this.state.screenshotSets.find((s) => s.id === setId);
    if (!set) {
      throw new Error(`Screenshot set ${setId} not found`);
    }

    // Simulate export - return URLs
    const exportUrls: string[] = [];
    for (const screenshot of set.screenshots) {
      for (const frame of screenshot.deviceFrames) {
        if (frame.store === set.store) {
          exportUrls.push(frame.framedUrl);
        }
      }
    }

    return exportUrls;
  }

  // Analytics
  async getAnalytics(): Promise<{
    totalScreenshots: number;
    screenshotsByCategory: Record<ScreenshotCategory, number>;
    screenshotSets: number;
    setsByStore: Record<StoreType, number>;
    readySets: number;
  }> {
    await this.initialize();

    const screenshotsByCategory: Record<ScreenshotCategory, number> = {
      dashboard: 0,
      patients: 0,
      schedule: 0,
      tasks: 0,
      jedi: 0,
      settings: 0,
      onboarding: 0,
      features: 0,
    };

    for (const screenshot of this.state.screenshots) {
      screenshotsByCategory[screenshot.category]++;
    }

    const setsByStore: Record<StoreType, number> = {
      google_play: 0,
      apple_app_store: 0,
      microsoft_store: 0,
    };

    let readySets = 0;
    for (const set of this.state.screenshotSets) {
      setsByStore[set.store]++;
      if (set.status === "ready") readySets++;
    }

    return {
      totalScreenshots: this.state.screenshots.length,
      screenshotsByCategory,
      screenshotSets: this.state.screenshotSets.length,
      setsByStore,
      readySets,
    };
  }

  // Generate all screenshots for a store
  async generateStoreScreenshots(store: StoreType): Promise<ScreenshotSet> {
    await this.initialize();

    const deviceType: DeviceType = store === "google_play" 
      ? "pixel_8_pro" 
      : store === "apple_app_store" 
        ? "iphone_15_pro_max" 
        : "surface_pro";

    // Generate framed versions for all screenshots
    for (const screenshot of this.state.screenshots) {
      await this.generateFramedScreenshot(screenshot.id, deviceType, store);
    }

    // Create screenshot set
    const set = await this.createScreenshotSet({
      name: `MediVac WACHS - ${store.replace("_", " ").toUpperCase()}`,
      store,
      screenshots: this.state.screenshots,
      deviceType,
      language: "en-AU",
      status: "ready",
    });

    return set;
  }
}

export const appStoreScreenshotsService = new AppStoreScreenshotsService();
