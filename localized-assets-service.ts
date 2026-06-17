/**
 * MediVac WACHS Localized Store Assets Service
 * Generate and manage localized screenshots and promotional materials for international markets
 */

// ============================================================================
// TYPES
// ============================================================================
export type LocaleCode = "en-US" | "en-AU" | "en-GB" | "es-ES" | "es-MX" | "fr-FR" | "de-DE" | "it-IT" | "pt-BR" | "ja-JP" | "ko-KR" | "zh-CN" | "zh-TW" | "ar-SA" | "hi-IN" | "ru-RU";
export type AssetType = "screenshot" | "feature_graphic" | "promotional_banner" | "app_icon" | "video_preview";
export type StoreType = "google_play" | "apple_app_store" | "microsoft_store";

export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  region: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
  enabled: boolean;
}

export interface LocalizedAsset {
  id: string;
  locale: LocaleCode;
  type: AssetType;
  store: StoreType;
  originalAssetId: string;
  localizedUrl: string;
  thumbnailUrl: string;
  textOverlays: LocalizedTextOverlay[];
  status: "pending" | "in_progress" | "completed" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
}

export interface LocalizedTextOverlay {
  id: string;
  originalText: string;
  localizedText: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  maxWidth: number;
}

export interface LocalizedDescription {
  id: string;
  locale: LocaleCode;
  store: StoreType;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  whatsNew: string;
  status: "draft" | "review" | "approved" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalizationCoverage {
  locale: LocaleCode;
  localeName: string;
  screenshotsCoverage: number;
  descriptionCoverage: number;
  keywordsCoverage: number;
  overallCoverage: number;
  lastUpdated: Date | null;
}

export interface ComplianceBadge {
  id: string;
  locale: LocaleCode;
  type: "age_rating" | "privacy" | "data_safety" | "accessibility" | "certification";
  badgeUrl: string;
  required: boolean;
  status: "missing" | "present" | "expired";
}

// ============================================================================
// SUPPORTED LOCALES
// ============================================================================
export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "en-US", name: "English (US)", nativeName: "English", direction: "ltr", region: "North America", dateFormat: "MM/DD/YYYY", numberFormat: "1,234.56", currency: "USD", enabled: true },
  { code: "en-AU", name: "English (Australia)", nativeName: "English", direction: "ltr", region: "Oceania", dateFormat: "DD/MM/YYYY", numberFormat: "1,234.56", currency: "AUD", enabled: true },
  { code: "en-GB", name: "English (UK)", nativeName: "English", direction: "ltr", region: "Europe", dateFormat: "DD/MM/YYYY", numberFormat: "1,234.56", currency: "GBP", enabled: true },
  { code: "es-ES", name: "Spanish (Spain)", nativeName: "Español", direction: "ltr", region: "Europe", dateFormat: "DD/MM/YYYY", numberFormat: "1.234,56", currency: "EUR", enabled: true },
  { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español", direction: "ltr", region: "North America", dateFormat: "DD/MM/YYYY", numberFormat: "1,234.56", currency: "MXN", enabled: true },
  { code: "fr-FR", name: "French", nativeName: "Français", direction: "ltr", region: "Europe", dateFormat: "DD/MM/YYYY", numberFormat: "1 234,56", currency: "EUR", enabled: true },
  { code: "de-DE", name: "German", nativeName: "Deutsch", direction: "ltr", region: "Europe", dateFormat: "DD.MM.YYYY", numberFormat: "1.234,56", currency: "EUR", enabled: true },
  { code: "it-IT", name: "Italian", nativeName: "Italiano", direction: "ltr", region: "Europe", dateFormat: "DD/MM/YYYY", numberFormat: "1.234,56", currency: "EUR", enabled: true },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português", direction: "ltr", region: "South America", dateFormat: "DD/MM/YYYY", numberFormat: "1.234,56", currency: "BRL", enabled: true },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", direction: "ltr", region: "Asia", dateFormat: "YYYY/MM/DD", numberFormat: "1,234", currency: "JPY", enabled: true },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", direction: "ltr", region: "Asia", dateFormat: "YYYY.MM.DD", numberFormat: "1,234", currency: "KRW", enabled: true },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", direction: "ltr", region: "Asia", dateFormat: "YYYY-MM-DD", numberFormat: "1,234.56", currency: "CNY", enabled: true },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", direction: "ltr", region: "Asia", dateFormat: "YYYY/MM/DD", numberFormat: "1,234.56", currency: "TWD", enabled: true },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", direction: "rtl", region: "Middle East", dateFormat: "DD/MM/YYYY", numberFormat: "١٬٢٣٤٫٥٦", currency: "SAR", enabled: true },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", direction: "ltr", region: "Asia", dateFormat: "DD/MM/YYYY", numberFormat: "1,234.56", currency: "INR", enabled: true },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", direction: "ltr", region: "Europe", dateFormat: "DD.MM.YYYY", numberFormat: "1 234,56", currency: "RUB", enabled: true },
];

// ============================================================================
// SAMPLE TRANSLATIONS
// ============================================================================
const SAMPLE_TRANSLATIONS: Record<string, Record<LocaleCode, string>> = {
  "Virtual Hospital Dashboard": {
    "en-US": "Virtual Hospital Dashboard",
    "en-AU": "Virtual Hospital Dashboard",
    "en-GB": "Virtual Hospital Dashboard",
    "es-ES": "Panel del Hospital Virtual",
    "es-MX": "Panel del Hospital Virtual",
    "fr-FR": "Tableau de Bord Hôpital Virtuel",
    "de-DE": "Virtuelles Krankenhaus-Dashboard",
    "it-IT": "Dashboard Ospedale Virtuale",
    "pt-BR": "Painel do Hospital Virtual",
    "ja-JP": "仮想病院ダッシュボード",
    "ko-KR": "가상 병원 대시보드",
    "zh-CN": "虚拟医院仪表板",
    "zh-TW": "虛擬醫院儀表板",
    "ar-SA": "لوحة معلومات المستشفى الافتراضي",
    "hi-IN": "वर्चुअल अस्पताल डैशबोर्ड",
    "ru-RU": "Панель виртуальной больницы",
  },
  "JEDI Systems Connected": {
    "en-US": "JEDI Systems Connected",
    "en-AU": "JEDI Systems Connected",
    "en-GB": "JEDI Systems Connected",
    "es-ES": "Sistemas JEDI Conectados",
    "es-MX": "Sistemas JEDI Conectados",
    "fr-FR": "Systèmes JEDI Connectés",
    "de-DE": "JEDI-Systeme Verbunden",
    "it-IT": "Sistemi JEDI Connessi",
    "pt-BR": "Sistemas JEDI Conectados",
    "ja-JP": "JEDIシステム接続済み",
    "ko-KR": "JEDI 시스템 연결됨",
    "zh-CN": "JEDI系统已连接",
    "zh-TW": "JEDI系統已連接",
    "ar-SA": "أنظمة JEDI متصلة",
    "hi-IN": "JEDI सिस्टम कनेक्टेड",
    "ru-RU": "Системы JEDI подключены",
  },
  "Patient Management": {
    "en-US": "Patient Management",
    "en-AU": "Patient Management",
    "en-GB": "Patient Management",
    "es-ES": "Gestión de Pacientes",
    "es-MX": "Gestión de Pacientes",
    "fr-FR": "Gestion des Patients",
    "de-DE": "Patientenverwaltung",
    "it-IT": "Gestione Pazienti",
    "pt-BR": "Gestão de Pacientes",
    "ja-JP": "患者管理",
    "ko-KR": "환자 관리",
    "zh-CN": "患者管理",
    "zh-TW": "患者管理",
    "ar-SA": "إدارة المرضى",
    "hi-IN": "रोगी प्रबंधन",
    "ru-RU": "Управление пациентами",
  },
};

// ============================================================================
// LOCALIZED ASSETS SERVICE
// ============================================================================
class LocalizedAssetsService {
  private assets: LocalizedAsset[] = [];
  private descriptions: LocalizedDescription[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample localized assets
    const sampleAssets: LocalizedAsset[] = [
      {
        id: "asset_en_us_1",
        locale: "en-US",
        type: "screenshot",
        store: "google_play",
        originalAssetId: "orig_screenshot_1",
        localizedUrl: "https://example.com/screenshots/en-US/dashboard.png",
        thumbnailUrl: "https://example.com/screenshots/en-US/thumb_dashboard.png",
        textOverlays: [
          { id: "overlay_1", originalText: "Virtual Hospital Dashboard", localizedText: "Virtual Hospital Dashboard", position: { x: 50, y: 100 }, fontSize: 24, fontFamily: "SF Pro", color: "#FFFFFF", maxWidth: 300 },
        ],
        status: "approved",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        approvedBy: "Admin",
        approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "asset_ja_jp_1",
        locale: "ja-JP",
        type: "screenshot",
        store: "apple_app_store",
        originalAssetId: "orig_screenshot_1",
        localizedUrl: "https://example.com/screenshots/ja-JP/dashboard.png",
        thumbnailUrl: "https://example.com/screenshots/ja-JP/thumb_dashboard.png",
        textOverlays: [
          { id: "overlay_1", originalText: "Virtual Hospital Dashboard", localizedText: "仮想病院ダッシュボード", position: { x: 50, y: 100 }, fontSize: 22, fontFamily: "Hiragino Sans", color: "#FFFFFF", maxWidth: 300 },
        ],
        status: "completed",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        approvedBy: null,
        approvedAt: null,
      },
      {
        id: "asset_ar_sa_1",
        locale: "ar-SA",
        type: "screenshot",
        store: "google_play",
        originalAssetId: "orig_screenshot_1",
        localizedUrl: "https://example.com/screenshots/ar-SA/dashboard.png",
        thumbnailUrl: "https://example.com/screenshots/ar-SA/thumb_dashboard.png",
        textOverlays: [
          { id: "overlay_1", originalText: "Virtual Hospital Dashboard", localizedText: "لوحة معلومات المستشفى الافتراضي", position: { x: 250, y: 100 }, fontSize: 20, fontFamily: "SF Arabic", color: "#FFFFFF", maxWidth: 300 },
        ],
        status: "in_progress",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        approvedBy: null,
        approvedAt: null,
      },
    ];

    // Sample descriptions
    const sampleDescriptions: LocalizedDescription[] = [
      {
        id: "desc_en_us",
        locale: "en-US",
        store: "google_play",
        shortDescription: "MediVac WACHS - Virtual Hospital Management with JEDI Integration",
        fullDescription: "Transform your healthcare practice with MediVac WACHS, the comprehensive virtual hospital management system. Features include patient management, JEDI system integration, real-time analytics, and more.",
        keywords: ["hospital", "medical", "healthcare", "JEDI", "patient management", "virtual hospital"],
        whatsNew: "Version 8.2: Added color coding system, A/B testing for screenshots, and localization support.",
        status: "published",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: "desc_ja_jp",
        locale: "ja-JP",
        store: "apple_app_store",
        shortDescription: "MediVac WACHS - JEDI統合による仮想病院管理",
        fullDescription: "MediVac WACHSで医療業務を変革しましょう。患者管理、JEDIシステム統合、リアルタイム分析など、包括的な仮想病院管理システムです。",
        keywords: ["病院", "医療", "ヘルスケア", "JEDI", "患者管理", "仮想病院"],
        whatsNew: "バージョン8.2: カラーコーディングシステム、スクリーンショットA/Bテスト、ローカライゼーションサポートを追加。",
        status: "approved",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    this.assets = sampleAssets;
    this.descriptions = sampleDescriptions;
  }

  // Get all supported locales
  getSupportedLocales(): LocaleConfig[] {
    return SUPPORTED_LOCALES;
  }

  // Get enabled locales
  getEnabledLocales(): LocaleConfig[] {
    return SUPPORTED_LOCALES.filter(l => l.enabled);
  }

  // Get locale config
  getLocaleConfig(code: LocaleCode): LocaleConfig | null {
    return SUPPORTED_LOCALES.find(l => l.code === code) || null;
  }

  // Translate text
  translateText(text: string, targetLocale: LocaleCode): string {
    const translations = SAMPLE_TRANSLATIONS[text];
    if (translations && translations[targetLocale]) {
      return translations[targetLocale];
    }
    return text; // Return original if no translation found
  }

  // Create localized asset
  async createLocalizedAsset(asset: Omit<LocalizedAsset, "id" | "createdAt" | "updatedAt" | "approvedBy" | "approvedAt">): Promise<LocalizedAsset> {
    const newAsset: LocalizedAsset = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    };
    this.assets.push(newAsset);
    this.notify();
    return newAsset;
  }

  // Get all assets
  async getAllAssets(): Promise<LocalizedAsset[]> {
    return this.assets;
  }

  // Get assets by locale
  async getAssetsByLocale(locale: LocaleCode): Promise<LocalizedAsset[]> {
    return this.assets.filter(a => a.locale === locale);
  }

  // Get assets by store
  async getAssetsByStore(store: StoreType): Promise<LocalizedAsset[]> {
    return this.assets.filter(a => a.store === store);
  }

  // Update asset status
  async updateAssetStatus(assetId: string, status: LocalizedAsset["status"], approvedBy?: string): Promise<LocalizedAsset | null> {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return null;

    asset.status = status;
    asset.updatedAt = new Date();
    
    if (status === "approved" && approvedBy) {
      asset.approvedBy = approvedBy;
      asset.approvedAt = new Date();
    }

    this.notify();
    return asset;
  }

  // Create localized description
  async createDescription(desc: Omit<LocalizedDescription, "id" | "createdAt" | "updatedAt">): Promise<LocalizedDescription> {
    const newDesc: LocalizedDescription = {
      ...desc,
      id: `desc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.descriptions.push(newDesc);
    this.notify();
    return newDesc;
  }

  // Get all descriptions
  async getAllDescriptions(): Promise<LocalizedDescription[]> {
    return this.descriptions;
  }

  // Get description by locale
  async getDescriptionByLocale(locale: LocaleCode, store: StoreType): Promise<LocalizedDescription | null> {
    return this.descriptions.find(d => d.locale === locale && d.store === store) || null;
  }

  // Get localization coverage
  async getLocalizationCoverage(): Promise<LocalizationCoverage[]> {
    const enabledLocales = this.getEnabledLocales();
    const totalScreenshots = 5; // Expected screenshots per locale
    const totalDescriptionFields = 4; // short, full, whatsNew, keywords
    const totalKeywords = 6; // Expected keywords

    return enabledLocales.map(locale => {
      const localeAssets = this.assets.filter(a => a.locale === locale.code && a.status === "approved");
      const localeDesc = this.descriptions.find(d => d.locale === locale.code);

      const screenshotsCoverage = (localeAssets.length / totalScreenshots) * 100;
      
      let descriptionCoverage = 0;
      let keywordsCoverage = 0;
      
      if (localeDesc) {
        let filledFields = 0;
        if (localeDesc.shortDescription) filledFields++;
        if (localeDesc.fullDescription) filledFields++;
        if (localeDesc.whatsNew) filledFields++;
        if (localeDesc.keywords.length > 0) filledFields++;
        descriptionCoverage = (filledFields / totalDescriptionFields) * 100;
        keywordsCoverage = Math.min(100, (localeDesc.keywords.length / totalKeywords) * 100);
      }

      const overallCoverage = (screenshotsCoverage + descriptionCoverage + keywordsCoverage) / 3;

      const lastAsset = localeAssets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const lastUpdated = lastAsset?.updatedAt || localeDesc?.updatedAt || null;

      return {
        locale: locale.code,
        localeName: locale.name,
        screenshotsCoverage: Math.round(screenshotsCoverage),
        descriptionCoverage: Math.round(descriptionCoverage),
        keywordsCoverage: Math.round(keywordsCoverage),
        overallCoverage: Math.round(overallCoverage),
        lastUpdated,
      };
    });
  }

  // Get compliance badges
  async getComplianceBadges(locale: LocaleCode): Promise<ComplianceBadge[]> {
    // Sample compliance badges
    return [
      { id: "badge_age", locale, type: "age_rating", badgeUrl: "https://example.com/badges/age_4.png", required: true, status: "present" },
      { id: "badge_privacy", locale, type: "privacy", badgeUrl: "https://example.com/badges/privacy.png", required: true, status: "present" },
      { id: "badge_data", locale, type: "data_safety", badgeUrl: "https://example.com/badges/data_safety.png", required: true, status: "present" },
      { id: "badge_access", locale, type: "accessibility", badgeUrl: "https://example.com/badges/accessibility.png", required: false, status: "present" },
    ];
  }

  // Get RTL locales
  getRTLLocales(): LocaleConfig[] {
    return SUPPORTED_LOCALES.filter(l => l.direction === "rtl");
  }

  // Check if locale is RTL
  isRTL(locale: LocaleCode): boolean {
    const config = this.getLocaleConfig(locale);
    return config?.direction === "rtl" || false;
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<{
    totalLocales: number;
    enabledLocales: number;
    totalAssets: number;
    approvedAssets: number;
    pendingAssets: number;
    averageCoverage: number;
    rtlLocales: number;
  }> {
    const coverage = await this.getLocalizationCoverage();
    const avgCoverage = coverage.length > 0
      ? coverage.reduce((sum, c) => sum + c.overallCoverage, 0) / coverage.length
      : 0;

    return {
      totalLocales: SUPPORTED_LOCALES.length,
      enabledLocales: SUPPORTED_LOCALES.filter(l => l.enabled).length,
      totalAssets: this.assets.length,
      approvedAssets: this.assets.filter(a => a.status === "approved").length,
      pendingAssets: this.assets.filter(a => a.status === "pending" || a.status === "in_progress").length,
      averageCoverage: Math.round(avgCoverage),
      rtlLocales: this.getRTLLocales().length,
    };
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const localizedAssetsService = new LocalizedAssetsService();
