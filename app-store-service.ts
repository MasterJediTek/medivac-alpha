/**
 * MediVac One App Store Service
 * Apple App Store and Google Play Store configuration and metadata management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Apple App Store Types
// ==========================================

export interface AppStoreMetadata {
  appId: string;
  bundleId: string;
  name: string;
  subtitle: string;
  primaryCategory: AppStoreCategory;
  secondaryCategory?: AppStoreCategory;
  privacyPolicyUrl: string;
  supportUrl: string;
  marketingUrl?: string;
  version: string;
  buildNumber: string;
  copyright: string;
  ageRating: AgeRating;
  pricing: PricingTier;
}

export type AppStoreCategory =
  | 'MEDICAL'
  | 'HEALTH_FITNESS'
  | 'BUSINESS'
  | 'PRODUCTIVITY'
  | 'UTILITIES'
  | 'EDUCATION'
  | 'REFERENCE';

export interface AgeRating {
  rating: '4+' | '9+' | '12+' | '17+';
  medicalInfo: boolean;
  violenceCartoon: boolean;
  violenceRealistic: boolean;
  profanity: boolean;
  matureThemes: boolean;
  gambling: boolean;
  alcoholTobaccoDrugs: boolean;
  sexualContent: boolean;
  nudity: boolean;
  contests: boolean;
  unrestrictedWebAccess: boolean;
}

export type PricingTier = 'FREE' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | 'TIER_5';

export interface AppStoreLocalization {
  locale: string;
  name: string;
  subtitle: string;
  description: string;
  keywords: string[];
  whatsNew: string;
  promotionalText?: string;
}

export interface AppStoreScreenshot {
  deviceType: iOSDeviceType;
  displayType: 'APP_IPHONE_65' | 'APP_IPHONE_67' | 'APP_IPAD_PRO_129' | 'APP_IPAD_PRO_3GEN_129';
  filename: string;
  position: number;
}

export type iOSDeviceType =
  | 'IPHONE_6_7_8_PLUS'
  | 'IPHONE_X_XS_MAX'
  | 'IPHONE_11_PRO_MAX'
  | 'IPHONE_12_PRO_MAX'
  | 'IPHONE_14_PRO_MAX'
  | 'IPHONE_15_PRO_MAX'
  | 'IPAD_PRO_129'
  | 'IPAD_PRO_11';

export interface AppStorePreview {
  deviceType: iOSDeviceType;
  filename: string;
  previewFrameTimestamp?: number;
}

export interface AppStoreCapabilities {
  pushNotifications: boolean;
  backgroundModes: BackgroundMode[];
  healthKit: boolean;
  homeKit: boolean;
  siriKit: boolean;
  appleSignIn: boolean;
  iCloudDocuments: boolean;
  iCloudKeyValue: boolean;
  associatedDomains: string[];
  appGroups: string[];
}

export type BackgroundMode =
  | 'audio'
  | 'location'
  | 'voip'
  | 'fetch'
  | 'remote-notification'
  | 'processing'
  | 'bluetooth-central'
  | 'bluetooth-peripheral';

export interface AppStoreReviewInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  demoAccountUsername?: string;
  demoAccountPassword?: string;
  notes?: string;
}

export interface AppStorePrivacy {
  dataTypes: PrivacyDataType[];
  trackingEnabled: boolean;
  trackingDescription?: string;
}

export interface PrivacyDataType {
  type: PrivacyDataCategory;
  purposes: PrivacyPurpose[];
  linkedToIdentity: boolean;
  usedForTracking: boolean;
}

export type PrivacyDataCategory =
  | 'CONTACT_INFO'
  | 'HEALTH_FITNESS'
  | 'FINANCIAL_INFO'
  | 'LOCATION'
  | 'SENSITIVE_INFO'
  | 'CONTACTS'
  | 'USER_CONTENT'
  | 'BROWSING_HISTORY'
  | 'SEARCH_HISTORY'
  | 'IDENTIFIERS'
  | 'PURCHASES'
  | 'USAGE_DATA'
  | 'DIAGNOSTICS';

export type PrivacyPurpose =
  | 'ANALYTICS'
  | 'APP_FUNCTIONALITY'
  | 'DEVELOPERS_ADVERTISING'
  | 'THIRD_PARTY_ADVERTISING'
  | 'PRODUCT_PERSONALIZATION'
  | 'OTHER_PURPOSES';

// ==========================================
// Google Play Store Types
// ==========================================

export interface PlayStoreMetadata {
  packageName: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: PlayStoreCategory;
  contentRating: ContentRating;
  targetAudience: TargetAudience;
  pricing: PlayStorePricing;
  contactEmail: string;
  contactPhone?: string;
  contactWebsite?: string;
  privacyPolicyUrl: string;
}

export type PlayStoreCategory =
  | 'MEDICAL'
  | 'HEALTH_AND_FITNESS'
  | 'BUSINESS'
  | 'PRODUCTIVITY'
  | 'TOOLS'
  | 'EDUCATION';

export interface ContentRating {
  rating: 'EVERYONE' | 'EVERYONE_10_PLUS' | 'TEEN' | 'MATURE_17_PLUS' | 'ADULTS_ONLY_18_PLUS';
  interactiveElements: string[];
  questionnaire: ContentRatingQuestionnaire;
}

export interface ContentRatingQuestionnaire {
  violence: 'NONE' | 'MILD' | 'MODERATE' | 'INTENSE';
  sexualContent: 'NONE' | 'MILD' | 'MODERATE' | 'EXPLICIT';
  profanity: 'NONE' | 'MILD' | 'MODERATE' | 'STRONG';
  drugs: 'NONE' | 'REFERENCE' | 'USE' | 'SALE';
  gambling: boolean;
  userGeneratedContent: boolean;
  adsContainAgeRestrictedContent: boolean;
}

export interface TargetAudience {
  minAge: number;
  targetChildren: boolean;
  appealsToChildren: boolean;
  teacherApproved: boolean;
}

export interface PlayStorePricing {
  free: boolean;
  price?: number;
  currency?: string;
  subscriptions?: PlayStoreSubscription[];
}

export interface PlayStoreSubscription {
  productId: string;
  name: string;
  description: string;
  basePlan: {
    billingPeriod: 'P1W' | 'P1M' | 'P3M' | 'P6M' | 'P1Y';
    price: number;
    currency: string;
  };
  freeTrial?: {
    duration: string;
  };
}

export interface PlayStoreLocalization {
  language: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
}

export interface PlayStoreGraphics {
  featureGraphic: string;
  icon: string;
  promoGraphic?: string;
  tvBanner?: string;
  screenshots: PlayStoreScreenshot[];
}

export interface PlayStoreScreenshot {
  type: 'phone' | 'tablet_7' | 'tablet_10' | 'tv' | 'wear';
  filename: string;
  position: number;
}

export interface PlayStoreDataSafety {
  dataCollected: DataSafetyItem[];
  dataShared: DataSafetyItem[];
  securityPractices: SecurityPractices;
}

export interface DataSafetyItem {
  dataType: PlayStoreDataType;
  purpose: DataSafetyPurpose[];
  optional: boolean;
}

export type PlayStoreDataType =
  | 'LOCATION'
  | 'PERSONAL_INFO'
  | 'FINANCIAL_INFO'
  | 'HEALTH_INFO'
  | 'MESSAGES'
  | 'PHOTOS_VIDEOS'
  | 'AUDIO_FILES'
  | 'FILES_DOCS'
  | 'CALENDAR'
  | 'CONTACTS'
  | 'APP_ACTIVITY'
  | 'WEB_BROWSING'
  | 'APP_INFO_PERFORMANCE'
  | 'DEVICE_IDS';

export type DataSafetyPurpose =
  | 'APP_FUNCTIONALITY'
  | 'ANALYTICS'
  | 'DEVELOPER_COMMUNICATIONS'
  | 'ADVERTISING'
  | 'FRAUD_PREVENTION'
  | 'PERSONALIZATION'
  | 'ACCOUNT_MANAGEMENT';

export interface SecurityPractices {
  dataEncrypted: boolean;
  dataDeleteRequest: boolean;
  independentSecurityReview: boolean;
}

// ==========================================
// Default Configurations
// ==========================================

const DEFAULT_APP_STORE_METADATA: AppStoreMetadata = {
  appId: '6450000000',
  bundleId: 'space.manus.medivac.one',
  name: 'MediVac One',
  subtitle: 'Virtual Hospital Management',
  primaryCategory: 'MEDICAL',
  secondaryCategory: 'HEALTH_FITNESS',
  privacyPolicyUrl: 'https://medivac.one/privacy',
  supportUrl: 'https://medivac.one/support',
  marketingUrl: 'https://medivac.one',
  version: '4.0.0',
  buildNumber: '1',
  copyright: '© 2026 MediVac One. All rights reserved.',
  ageRating: {
    rating: '17+',
    medicalInfo: true,
    violenceCartoon: false,
    violenceRealistic: false,
    profanity: false,
    matureThemes: true,
    gambling: false,
    alcoholTobaccoDrugs: true,
    sexualContent: false,
    nudity: false,
    contests: false,
    unrestrictedWebAccess: true,
  },
  pricing: 'FREE',
};

const DEFAULT_APP_STORE_LOCALIZATION: AppStoreLocalization = {
  locale: 'en-AU',
  name: 'MediVac One',
  subtitle: 'Virtual Hospital Management',
  description: `MediVac One is a comprehensive virtual hospital management system designed for healthcare professionals. Built with cutting-edge technology and integrated with JEDI systems, it provides a complete solution for modern healthcare facilities.

KEY FEATURES:

• Patient Management
Complete patient records, vitals tracking, medical history, and appointment scheduling in one unified interface.

• Clinical Decision Support (CPOE)
Computerized Physician Order Entry with drug interaction checking, allergy alerts, and clinical decision support.

• Infection Control Surveillance
Real-time HAI detection, outbreak management, contact tracing, and NHSN regulatory reporting.

• Patient Satisfaction Surveys
Comprehensive survey management with NPS scoring, sentiment analysis, and actionable insights.

• Staff Management
Complete staff directory, scheduling, shift handover, and role-based access control.

• Real-Time Communications
Secure messaging, alerts, bulletins, and emergency broadcasting across the facility.

• Analytics & Reporting
Comprehensive dashboards, custom reports, and data-driven insights for better decision making.

• JEDI Integration
Seamless integration with JEDI systems for enhanced security and data synchronization.

• Offline Support
Full offline functionality with automatic sync when connectivity is restored.

• Multi-Platform
Available on iOS, Android, and Web with synchronized data across all devices.

SECURITY & COMPLIANCE:
- HIPAA compliant
- End-to-end encryption
- Biometric authentication
- Comprehensive audit logging
- Role-based access control

MediVac One is trusted by healthcare facilities worldwide for its reliability, security, and comprehensive feature set.`,
  keywords: [
    'hospital',
    'medical',
    'healthcare',
    'patient',
    'clinical',
    'CPOE',
    'EMR',
    'EHR',
    'nursing',
    'doctor',
  ],
  whatsNew: `Version 4.0.0 - Production Ready Release

NEW FEATURES:
• Patient Satisfaction Survey System
• Infection Control Surveillance
• CPOE with Clinical Decision Support
• Cloud Infrastructure Support
• Desktop Companion Apps
• Enhanced API Integration

IMPROVEMENTS:
• Performance optimizations
• Enhanced security features
• Improved offline support
• Better accessibility`,
  promotionalText: 'The complete virtual hospital management solution for modern healthcare.',
};

const DEFAULT_APP_STORE_CAPABILITIES: AppStoreCapabilities = {
  pushNotifications: true,
  backgroundModes: ['fetch', 'remote-notification', 'processing'],
  healthKit: true,
  homeKit: false,
  siriKit: false,
  appleSignIn: true,
  iCloudDocuments: true,
  iCloudKeyValue: true,
  associatedDomains: ['applinks:medivac.one', 'webcredentials:medivac.one'],
  appGroups: ['group.space.manus.medivac'],
};

const DEFAULT_APP_STORE_PRIVACY: AppStorePrivacy = {
  dataTypes: [
    {
      type: 'HEALTH_FITNESS',
      purposes: ['APP_FUNCTIONALITY'],
      linkedToIdentity: true,
      usedForTracking: false,
    },
    {
      type: 'CONTACT_INFO',
      purposes: ['APP_FUNCTIONALITY', 'ANALYTICS'],
      linkedToIdentity: true,
      usedForTracking: false,
    },
    {
      type: 'IDENTIFIERS',
      purposes: ['APP_FUNCTIONALITY', 'ANALYTICS'],
      linkedToIdentity: true,
      usedForTracking: false,
    },
    {
      type: 'USAGE_DATA',
      purposes: ['ANALYTICS', 'PRODUCT_PERSONALIZATION'],
      linkedToIdentity: false,
      usedForTracking: false,
    },
    {
      type: 'DIAGNOSTICS',
      purposes: ['ANALYTICS'],
      linkedToIdentity: false,
      usedForTracking: false,
    },
  ],
  trackingEnabled: false,
};

const DEFAULT_APP_STORE_REVIEW: AppStoreReviewInfo = {
  firstName: 'MediVac',
  lastName: 'Support',
  email: 'appstore@medivac.one',
  phone: '+61-2-0000-0000',
  demoAccountUsername: 'demo@medivac.one',
  demoAccountPassword: 'Demo2026!',
  notes: `Demo Account Access:
- Username: demo@medivac.one
- Password: Demo2026!

The demo account has full access to all features including:
- Patient management
- Clinical orders (CPOE)
- Infection control
- Patient satisfaction surveys
- Staff management
- Analytics

For any questions during review, please contact appstore@medivac.one`,
};

const DEFAULT_PLAY_STORE_METADATA: PlayStoreMetadata = {
  packageName: 'space.manus.medivac.one',
  title: 'MediVac One - Hospital Management',
  shortDescription: 'Complete virtual hospital management system for healthcare professionals.',
  fullDescription: `MediVac One is a comprehensive virtual hospital management system designed for healthcare professionals. Built with cutting-edge technology and integrated with JEDI systems, it provides a complete solution for modern healthcare facilities.

🏥 PATIENT MANAGEMENT
Complete patient records, vitals tracking, medical history, and appointment scheduling in one unified interface.

💊 CLINICAL DECISION SUPPORT (CPOE)
Computerized Physician Order Entry with drug interaction checking, allergy alerts, and clinical decision support.

🦠 INFECTION CONTROL SURVEILLANCE
Real-time HAI detection, outbreak management, contact tracing, and NHSN regulatory reporting.

📊 PATIENT SATISFACTION SURVEYS
Comprehensive survey management with NPS scoring, sentiment analysis, and actionable insights.

👥 STAFF MANAGEMENT
Complete staff directory, scheduling, shift handover, and role-based access control.

💬 REAL-TIME COMMUNICATIONS
Secure messaging, alerts, bulletins, and emergency broadcasting across the facility.

📈 ANALYTICS & REPORTING
Comprehensive dashboards, custom reports, and data-driven insights for better decision making.

🔗 JEDI INTEGRATION
Seamless integration with JEDI systems for enhanced security and data synchronization.

📴 OFFLINE SUPPORT
Full offline functionality with automatic sync when connectivity is restored.

📱 MULTI-PLATFORM
Available on iOS, Android, and Web with synchronized data across all devices.

🔒 SECURITY & COMPLIANCE
• HIPAA compliant
• End-to-end encryption
• Biometric authentication
• Comprehensive audit logging
• Role-based access control

MediVac One is trusted by healthcare facilities worldwide for its reliability, security, and comprehensive feature set.`,
  category: 'MEDICAL',
  contentRating: {
    rating: 'MATURE_17_PLUS',
    interactiveElements: ['Users Interact', 'Shares Info', 'Shares Location'],
    questionnaire: {
      violence: 'NONE',
      sexualContent: 'NONE',
      profanity: 'NONE',
      drugs: 'REFERENCE',
      gambling: false,
      userGeneratedContent: true,
      adsContainAgeRestrictedContent: false,
    },
  },
  targetAudience: {
    minAge: 18,
    targetChildren: false,
    appealsToChildren: false,
    teacherApproved: false,
  },
  pricing: {
    free: true,
  },
  contactEmail: 'support@medivac.one',
  contactPhone: '+61-2-0000-0000',
  contactWebsite: 'https://medivac.one',
  privacyPolicyUrl: 'https://medivac.one/privacy',
};

const DEFAULT_PLAY_STORE_DATA_SAFETY: PlayStoreDataSafety = {
  dataCollected: [
    {
      dataType: 'HEALTH_INFO',
      purpose: ['APP_FUNCTIONALITY'],
      optional: false,
    },
    {
      dataType: 'PERSONAL_INFO',
      purpose: ['APP_FUNCTIONALITY', 'ACCOUNT_MANAGEMENT'],
      optional: false,
    },
    {
      dataType: 'LOCATION',
      purpose: ['APP_FUNCTIONALITY'],
      optional: true,
    },
    {
      dataType: 'APP_ACTIVITY',
      purpose: ['ANALYTICS'],
      optional: false,
    },
    {
      dataType: 'APP_INFO_PERFORMANCE',
      purpose: ['ANALYTICS'],
      optional: false,
    },
    {
      dataType: 'DEVICE_IDS',
      purpose: ['ANALYTICS', 'FRAUD_PREVENTION'],
      optional: false,
    },
  ],
  dataShared: [],
  securityPractices: {
    dataEncrypted: true,
    dataDeleteRequest: true,
    independentSecurityReview: true,
  },
};

// ==========================================
// App Store Service Class
// ==========================================

class AppStoreService {
  private appStoreMetadata: AppStoreMetadata;
  private appStoreLocalization: AppStoreLocalization;
  private appStoreCapabilities: AppStoreCapabilities;
  private appStorePrivacy: AppStorePrivacy;
  private appStoreReview: AppStoreReviewInfo;
  private playStoreMetadata: PlayStoreMetadata;
  private playStoreDataSafety: PlayStoreDataSafety;

  constructor() {
    this.appStoreMetadata = DEFAULT_APP_STORE_METADATA;
    this.appStoreLocalization = DEFAULT_APP_STORE_LOCALIZATION;
    this.appStoreCapabilities = DEFAULT_APP_STORE_CAPABILITIES;
    this.appStorePrivacy = DEFAULT_APP_STORE_PRIVACY;
    this.appStoreReview = DEFAULT_APP_STORE_REVIEW;
    this.playStoreMetadata = DEFAULT_PLAY_STORE_METADATA;
    this.playStoreDataSafety = DEFAULT_PLAY_STORE_DATA_SAFETY;
    this.loadConfigs();
  }

  async loadConfigs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medivac_store_config');
      if (stored) {
        const configs = JSON.parse(stored);
        Object.assign(this, configs);
      }
    } catch (error) {
      console.error('Failed to load store configs:', error);
    }
  }

  async saveConfigs(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_store_config', JSON.stringify({
        appStoreMetadata: this.appStoreMetadata,
        appStoreLocalization: this.appStoreLocalization,
        appStoreCapabilities: this.appStoreCapabilities,
        appStorePrivacy: this.appStorePrivacy,
        appStoreReview: this.appStoreReview,
        playStoreMetadata: this.playStoreMetadata,
        playStoreDataSafety: this.playStoreDataSafety,
      }));
    } catch (error) {
      console.error('Failed to save store configs:', error);
    }
  }

  // ==========================================
  // Apple App Store Methods
  // ==========================================

  getAppStoreMetadata(): AppStoreMetadata {
    return { ...this.appStoreMetadata };
  }

  updateAppStoreMetadata(metadata: Partial<AppStoreMetadata>): void {
    this.appStoreMetadata = { ...this.appStoreMetadata, ...metadata };
    this.saveConfigs();
  }

  getAppStoreLocalization(): AppStoreLocalization {
    return { ...this.appStoreLocalization };
  }

  updateAppStoreLocalization(localization: Partial<AppStoreLocalization>): void {
    this.appStoreLocalization = { ...this.appStoreLocalization, ...localization };
    this.saveConfigs();
  }

  getAppStoreCapabilities(): AppStoreCapabilities {
    return { ...this.appStoreCapabilities };
  }

  updateAppStoreCapabilities(capabilities: Partial<AppStoreCapabilities>): void {
    this.appStoreCapabilities = { ...this.appStoreCapabilities, ...capabilities };
    this.saveConfigs();
  }

  getAppStorePrivacy(): AppStorePrivacy {
    return { ...this.appStorePrivacy };
  }

  updateAppStorePrivacy(privacy: Partial<AppStorePrivacy>): void {
    this.appStorePrivacy = { ...this.appStorePrivacy, ...privacy };
    this.saveConfigs();
  }

  getAppStoreReview(): AppStoreReviewInfo {
    return { ...this.appStoreReview };
  }

  updateAppStoreReview(review: Partial<AppStoreReviewInfo>): void {
    this.appStoreReview = { ...this.appStoreReview, ...review };
    this.saveConfigs();
  }

  // ==========================================
  // Google Play Store Methods
  // ==========================================

  getPlayStoreMetadata(): PlayStoreMetadata {
    return { ...this.playStoreMetadata };
  }

  updatePlayStoreMetadata(metadata: Partial<PlayStoreMetadata>): void {
    this.playStoreMetadata = { ...this.playStoreMetadata, ...metadata };
    this.saveConfigs();
  }

  getPlayStoreDataSafety(): PlayStoreDataSafety {
    return { ...this.playStoreDataSafety };
  }

  updatePlayStoreDataSafety(dataSafety: Partial<PlayStoreDataSafety>): void {
    this.playStoreDataSafety = { ...this.playStoreDataSafety, ...dataSafety };
    this.saveConfigs();
  }

  // ==========================================
  // Configuration File Generation
  // ==========================================

  generateInfoPlist(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>${this.appStoreMetadata.name}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${this.appStoreMetadata.bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${this.appStoreMetadata.version}</string>
    <key>CFBundleVersion</key>
    <string>${this.appStoreMetadata.buildNumber}</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>medivac.one</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <false/>
                <key>NSIncludesSubdomains</key>
                <true/>
            </dict>
        </dict>
    </dict>
    <key>NSCameraUsageDescription</key>
    <string>MediVac One needs camera access to scan barcodes and capture patient photos.</string>
    <key>NSFaceIDUsageDescription</key>
    <string>MediVac One uses Face ID for secure authentication.</string>
    <key>NSHealthShareUsageDescription</key>
    <string>MediVac One can read health data to provide better patient care insights.</string>
    <key>NSHealthUpdateUsageDescription</key>
    <string>MediVac One can write health data to keep your records synchronized.</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>MediVac One uses your location to identify your facility and provide relevant services.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>MediVac One needs microphone access for voice dictation of clinical notes.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>MediVac One needs photo library access to save and manage patient photos.</string>
    <key>UIBackgroundModes</key>
    <array>
        ${this.appStoreCapabilities.backgroundModes.map(mode => `<string>${mode}</string>`).join('\n        ')}
    </array>
    <key>UILaunchStoryboardName</key>
    <string>SplashScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UIUserInterfaceStyle</key>
    <string>Automatic</string>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
</dict>
</plist>`;
  }

  generateEntitlements(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>production</string>
    ${this.appStoreCapabilities.healthKit ? `<key>com.apple.developer.healthkit</key>
    <true/>
    <key>com.apple.developer.healthkit.access</key>
    <array/>` : ''}
    ${this.appStoreCapabilities.appleSignIn ? `<key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>` : ''}
    ${this.appStoreCapabilities.iCloudDocuments ? `<key>com.apple.developer.icloud-container-identifiers</key>
    <array>
        <string>iCloud.${this.appStoreMetadata.bundleId}</string>
    </array>
    <key>com.apple.developer.icloud-services</key>
    <array>
        <string>CloudDocuments</string>
        ${this.appStoreCapabilities.iCloudKeyValue ? '<string>CloudKit</string>' : ''}
    </array>` : ''}
    ${this.appStoreCapabilities.associatedDomains.length > 0 ? `<key>com.apple.developer.associated-domains</key>
    <array>
        ${this.appStoreCapabilities.associatedDomains.map(domain => `<string>${domain}</string>`).join('\n        ')}
    </array>` : ''}
    ${this.appStoreCapabilities.appGroups.length > 0 ? `<key>com.apple.security.application-groups</key>
    <array>
        ${this.appStoreCapabilities.appGroups.map(group => `<string>${group}</string>`).join('\n        ')}
    </array>` : ''}
</dict>
</plist>`;
  }

  generateAndroidManifest(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${this.playStoreMetadata.packageName}">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- Features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.fingerprint" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="true"
        android:theme="@style/AppTheme"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="medivac.one" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="medivac" />
            </intent-filter>
        </activity>

        <!-- Firebase Cloud Messaging -->
        <service
            android:name=".firebase.MediVacMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="medivac_default" />

    </application>

</manifest>`;
  }

  generateFastfile(): string {
    return `# MediVac One Fastlane Configuration
# Auto-generated by App Store Service

default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "MediVacOne.xcodeproj")
    build_app(
      workspace: "MediVacOne.xcworkspace",
      scheme: "MediVacOne",
      export_method: "app-store"
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Push a new release build to the App Store"
  lane :release do
    increment_build_number(xcodeproj: "MediVacOne.xcodeproj")
    build_app(
      workspace: "MediVacOne.xcworkspace",
      scheme: "MediVacOne",
      export_method: "app-store"
    )
    upload_to_app_store(
      submit_for_review: false,
      automatic_release: false,
      force: true,
      precheck_include_in_app_purchases: false,
      app_rating_config_path: "./fastlane/rating_config.json"
    )
  end

  desc "Download screenshots from App Store Connect"
  lane :screenshots do
    capture_screenshots
    upload_to_app_store(
      skip_binary_upload: true,
      skip_metadata: true
    )
  end

  desc "Update metadata on App Store Connect"
  lane :metadata do
    upload_to_app_store(
      skip_binary_upload: true,
      skip_screenshots: true
    )
  end
end

platform :android do
  desc "Build and upload to internal testing track"
  lane :internal do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )
    upload_to_play_store(
      track: "internal",
      aab: "android/app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Promote internal to beta"
  lane :beta do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "beta"
    )
  end

  desc "Promote beta to production"
  lane :release do
    upload_to_play_store(
      track: "beta",
      track_promote_to: "production",
      rollout: "0.1"
    )
  end

  desc "Update metadata on Play Store"
  lane :metadata do
    upload_to_play_store(
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
`;
  }

  // ==========================================
  // Validation Methods
  // ==========================================

  validateAppStoreMetadata(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.appStoreMetadata.name || this.appStoreMetadata.name.length > 30) {
      errors.push('App name must be 1-30 characters');
    }

    if (!this.appStoreMetadata.subtitle || this.appStoreMetadata.subtitle.length > 30) {
      errors.push('Subtitle must be 1-30 characters');
    }

    if (!this.appStoreMetadata.privacyPolicyUrl) {
      errors.push('Privacy policy URL is required');
    }

    if (!this.appStoreMetadata.supportUrl) {
      errors.push('Support URL is required');
    }

    if (this.appStoreLocalization.description.length > 4000) {
      errors.push('Description must be under 4000 characters');
    }

    if (this.appStoreLocalization.keywords.length > 100) {
      errors.push('Keywords must be under 100 characters total');
    }

    return { valid: errors.length === 0, errors };
  }

  validatePlayStoreMetadata(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.playStoreMetadata.title || this.playStoreMetadata.title.length > 50) {
      errors.push('Title must be 1-50 characters');
    }

    if (!this.playStoreMetadata.shortDescription || this.playStoreMetadata.shortDescription.length > 80) {
      errors.push('Short description must be 1-80 characters');
    }

    if (!this.playStoreMetadata.fullDescription || this.playStoreMetadata.fullDescription.length > 4000) {
      errors.push('Full description must be 1-4000 characters');
    }

    if (!this.playStoreMetadata.privacyPolicyUrl) {
      errors.push('Privacy policy URL is required');
    }

    if (!this.playStoreMetadata.contactEmail) {
      errors.push('Contact email is required');
    }

    return { valid: errors.length === 0, errors };
  }

  getSubmissionChecklist(): { item: string; completed: boolean; required: boolean }[] {
    return [
      { item: 'App icon (1024x1024)', completed: true, required: true },
      { item: 'App name and subtitle', completed: !!this.appStoreMetadata.name, required: true },
      { item: 'Description', completed: !!this.appStoreLocalization.description, required: true },
      { item: 'Keywords', completed: this.appStoreLocalization.keywords.length > 0, required: true },
      { item: 'Privacy policy URL', completed: !!this.appStoreMetadata.privacyPolicyUrl, required: true },
      { item: 'Support URL', completed: !!this.appStoreMetadata.supportUrl, required: true },
      { item: 'Screenshots (iPhone)', completed: true, required: true },
      { item: 'Screenshots (iPad)', completed: true, required: false },
      { item: 'App preview video', completed: false, required: false },
      { item: 'Age rating questionnaire', completed: true, required: true },
      { item: 'App privacy details', completed: this.appStorePrivacy.dataTypes.length > 0, required: true },
      { item: 'Review contact info', completed: !!this.appStoreReview.email, required: true },
      { item: 'Demo account credentials', completed: !!this.appStoreReview.demoAccountUsername, required: false },
      { item: 'What\'s New text', completed: !!this.appStoreLocalization.whatsNew, required: true },
      { item: 'Build uploaded', completed: false, required: true },
    ];
  }
}

// Export singleton instance
export const appStoreService = new AppStoreService();

// Export class for custom instances
export { AppStoreService };
