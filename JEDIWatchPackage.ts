/**
 * JEDI Watch App Installation Package
 * Configuration and manifest for smartwatch deployment
 */

// ============================================
// PACKAGE MANIFEST
// ============================================

export interface WatchAppManifest {
  name: string;
  version: string;
  buildNumber: number;
  bundleId: string;
  displayName: string;
  description: string;
  author: string;
  minOSVersion: Record<string, string>;
  permissions: string[];
  capabilities: string[];
  complications: ComplicationDefinition[];
  notifications: NotificationCategory[];
  assets: AssetBundle;
}

export interface ComplicationDefinition {
  id: string;
  name: string;
  supportedFamilies: string[];
  dataTypes: string[];
  refreshInterval: number;
}

export interface NotificationCategory {
  id: string;
  name: string;
  actions: { id: string; title: string; destructive?: boolean }[];
}

export interface AssetBundle {
  icons: IconSet;
  colors: ColorPalette;
  fonts: FontBundle;
}

export interface IconSet {
  appIcon: string;
  complicationIcon: string;
  notificationIcon: string;
  launchScreen: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  disco: DiscoColors;
}

export interface DiscoColors {
  neonPink: string;
  neonCyan: string;
  neonGreen: string;
  neonPurple: string;
  neonOrange: string;
  neonYellow: string;
  neonRed: string;
  midnightPurple: string;
  darkDisco: string;
}

export interface FontBundle {
  regular: string;
  medium: string;
  bold: string;
  light: string;
}

// ============================================
// JEDI WATCH APP MANIFEST
// ============================================

export const JEDI_WATCH_MANIFEST: WatchAppManifest = {
  name: 'jedi-watch',
  version: '2.9.0',
  buildNumber: 290,
  bundleId: 'com.jeditek.medivac.watch',
  displayName: 'JEDI Watch',
  description: 'MediVac One companion app for smartwatches. Real-time patient vitals, medication reminders, task management, and emergency alerts on your wrist.',
  author: 'JediTek Medical Systems',
  
  minOSVersion: {
    watchOS: '10.0',
    wearOS: '4.0',
    tizenOS: '5.5',
  },
  
  permissions: [
    'NOTIFICATIONS',
    'HAPTICS',
    'HEALTH_DATA_READ',
    'HEALTH_DATA_WRITE',
    'MICROPHONE',
    'BLUETOOTH',
    'NETWORK',
    'BACKGROUND_REFRESH',
    'ALWAYS_ON_DISPLAY',
    'COMPLICATIONS',
    'EMERGENCY_SOS',
  ],
  
  capabilities: [
    'patient_vitals_monitoring',
    'medication_reminders',
    'task_management',
    'emergency_alerts',
    'voice_notes',
    'barcode_scanning',
    'shift_tracking',
    'team_communication',
    'offline_mode',
    'biometric_auth',
    'haptic_feedback',
    'complications',
    'always_on_display',
  ],
  
  complications: [
    {
      id: 'patient_count',
      name: 'Patient Count',
      supportedFamilies: ['circularSmall', 'graphicCircular', 'modularSmall'],
      dataTypes: ['gauge', 'text'],
      refreshInterval: 60,
    },
    {
      id: 'tasks_pending',
      name: 'Pending Tasks',
      supportedFamilies: ['circularSmall', 'graphicCircular', 'modularSmall', 'utilitarianSmall'],
      dataTypes: ['gauge', 'text'],
      refreshInterval: 30,
    },
    {
      id: 'next_medication',
      name: 'Next Medication',
      supportedFamilies: ['modularLarge', 'graphicRectangular', 'utilitarianLarge'],
      dataTypes: ['text', 'timer'],
      refreshInterval: 60,
    },
    {
      id: 'shift_timer',
      name: 'Shift Timer',
      supportedFamilies: ['circularSmall', 'graphicCircular', 'modularSmall', 'graphicCorner'],
      dataTypes: ['timer', 'gauge'],
      refreshInterval: 60,
    },
    {
      id: 'alert_count',
      name: 'Active Alerts',
      supportedFamilies: ['circularSmall', 'graphicCircular', 'modularSmall'],
      dataTypes: ['gauge', 'text'],
      refreshInterval: 10,
    },
  ],
  
  notifications: [
    {
      id: 'medication_reminder',
      name: 'Medication Reminder',
      actions: [
        { id: 'administer', title: 'Administer' },
        { id: 'hold', title: 'Hold' },
        { id: 'snooze', title: 'Snooze 15m' },
      ],
    },
    {
      id: 'task_alert',
      name: 'Task Alert',
      actions: [
        { id: 'complete', title: 'Complete' },
        { id: 'snooze', title: 'Snooze' },
        { id: 'delegate', title: 'Delegate' },
      ],
    },
    {
      id: 'vital_alert',
      name: 'Vital Sign Alert',
      actions: [
        { id: 'acknowledge', title: 'Acknowledge' },
        { id: 'view_patient', title: 'View Patient' },
      ],
    },
    {
      id: 'emergency_alert',
      name: 'Emergency Alert',
      actions: [
        { id: 'respond', title: 'Respond' },
        { id: 'acknowledge', title: 'Acknowledge' },
      ],
    },
    {
      id: 'message',
      name: 'Message',
      actions: [
        { id: 'reply', title: 'Reply' },
        { id: 'call', title: 'Call Back' },
      ],
    },
  ],
  
  assets: {
    icons: {
      appIcon: 'assets/watch/icon-app.png',
      complicationIcon: 'assets/watch/icon-complication.png',
      notificationIcon: 'assets/watch/icon-notification.png',
      launchScreen: 'assets/watch/launch-screen.png',
    },
    colors: {
      primary: '#FF1493',
      secondary: '#00FFFF',
      accent: '#39FF14',
      background: '#0D0D0D',
      surface: '#1A1A2E',
      text: '#FFFFFF',
      textSecondary: '#888888',
      success: '#39FF14',
      warning: '#FFFF00',
      error: '#FF0000',
      disco: {
        neonPink: '#FF1493',
        neonCyan: '#00FFFF',
        neonGreen: '#39FF14',
        neonPurple: '#BF00FF',
        neonOrange: '#FF6600',
        neonYellow: '#FFFF00',
        neonRed: '#FF0000',
        midnightPurple: '#1A1A2E',
        darkDisco: '#0D0D1A',
      },
    },
    fonts: {
      regular: 'SF Pro Text',
      medium: 'SF Pro Text Medium',
      bold: 'SF Pro Text Bold',
      light: 'SF Pro Text Light',
    },
  },
};

// ============================================
// INSTALLATION PACKAGE
// ============================================

export interface InstallationPackage {
  manifest: WatchAppManifest;
  platforms: PlatformPackage[];
  installationGuide: InstallationGuide;
  releaseNotes: string;
  checksums: Record<string, string>;
}

export interface PlatformPackage {
  platform: 'apple_watch' | 'wear_os' | 'galaxy_watch';
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  minVersion: string;
  supportedDevices: string[];
}

export interface InstallationGuide {
  steps: InstallationStep[];
  troubleshooting: TroubleshootingItem[];
  requirements: string[];
}

export interface InstallationStep {
  order: number;
  title: string;
  description: string;
  image?: string;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
}

// ============================================
// GENERATE INSTALLATION PACKAGE
// ============================================

export const generateInstallationPackage = (): InstallationPackage => {
  return {
    manifest: JEDI_WATCH_MANIFEST,
    
    platforms: [
      {
        platform: 'apple_watch',
        fileName: 'jedi-watch-v2.9.0-watchos.ipa',
        fileSize: 12500000,
        downloadUrl: 'https://jeditek.com.au/downloads/watch/jedi-watch-v2.9.0-watchos.ipa',
        minVersion: 'watchOS 10.0',
        supportedDevices: [
          'Apple Watch Ultra 2',
          'Apple Watch Ultra',
          'Apple Watch Series 9',
          'Apple Watch Series 8',
          'Apple Watch Series 7',
          'Apple Watch SE (2nd gen)',
        ],
      },
      {
        platform: 'wear_os',
        fileName: 'jedi-watch-v2.9.0-wearos.apk',
        fileSize: 15800000,
        downloadUrl: 'https://jeditek.com.au/downloads/watch/jedi-watch-v2.9.0-wearos.apk',
        minVersion: 'Wear OS 4.0',
        supportedDevices: [
          'Google Pixel Watch 2',
          'Google Pixel Watch',
          'Samsung Galaxy Watch 6',
          'Samsung Galaxy Watch 5',
          'Mobvoi TicWatch Pro 5',
        ],
      },
      {
        platform: 'galaxy_watch',
        fileName: 'jedi-watch-v2.9.0-tizen.wgt',
        fileSize: 11200000,
        downloadUrl: 'https://jeditek.com.au/downloads/watch/jedi-watch-v2.9.0-tizen.wgt',
        minVersion: 'Tizen 5.5',
        supportedDevices: [
          'Samsung Galaxy Watch 4',
          'Samsung Galaxy Watch 4 Classic',
          'Samsung Galaxy Watch 3',
        ],
      },
    ],
    
    installationGuide: {
      requirements: [
        'MediVac One mobile app v2.9.0 or later installed on paired phone',
        'Active internet connection during installation',
        'Bluetooth enabled on both devices',
        'Sufficient battery (>50%) on watch',
        'Valid MediVac One staff credentials',
      ],
      
      steps: [
        {
          order: 1,
          title: 'Open MediVac One App',
          description: 'Launch the MediVac One app on your paired smartphone and navigate to Settings > Watch App.',
        },
        {
          order: 2,
          title: 'Select Your Watch',
          description: 'Tap "Add Watch" and select your smartwatch from the list of available devices.',
        },
        {
          order: 3,
          title: 'Confirm Pairing',
          description: 'Accept the pairing request on your watch when prompted. Enter the verification code if required.',
        },
        {
          order: 4,
          title: 'Install JEDI Watch',
          description: 'Tap "Install JEDI Watch" to begin the installation. This may take 2-5 minutes depending on your connection.',
        },
        {
          order: 5,
          title: 'Grant Permissions',
          description: 'On your watch, accept all requested permissions for notifications, health data, and haptics.',
        },
        {
          order: 6,
          title: 'Configure Complications',
          description: 'Customize your watch face by adding JEDI Watch complications for quick access to patient data.',
        },
        {
          order: 7,
          title: 'Login',
          description: 'Open JEDI Watch on your watch and login with your MediVac One credentials or use biometric authentication.',
        },
        {
          order: 8,
          title: 'Sync Data',
          description: 'Wait for initial data sync to complete. Your patient assignments and tasks will appear automatically.',
        },
      ],
      
      troubleshooting: [
        {
          issue: 'Watch not appearing in device list',
          solution: 'Ensure Bluetooth is enabled on both devices. Restart both devices and try again.',
        },
        {
          issue: 'Installation fails or times out',
          solution: 'Check internet connection and ensure watch battery is above 50%. Try installing over WiFi.',
        },
        {
          issue: 'Notifications not appearing on watch',
          solution: 'Check notification permissions in both the phone app and watch settings. Ensure Do Not Disturb is off.',
        },
        {
          issue: 'Complications not updating',
          solution: 'Force sync from the watch app settings. Check that background refresh is enabled.',
        },
        {
          issue: 'Unable to login on watch',
          solution: 'Ensure you are logged into MediVac One on your phone first. Try using QR code login option.',
        },
        {
          issue: 'High battery drain',
          solution: 'Reduce complication refresh rate in settings. Disable Always-On Display if not needed.',
        },
      ],
    },
    
    releaseNotes: `
# JEDI Watch v2.9.0 Release Notes

## New Features
- 🕺 **Disco Theme**: Vibrant neon colors and animated effects
- ❤️ **Real-time Vitals**: Live patient vital signs with alert indicators
- 💊 **Medication Reminders**: Actionable notifications with one-tap administration
- ✓ **Task Management**: View and complete tasks from your wrist
- 🚨 **Emergency Alerts**: Code Blue, SOS, and other emergency triggers
- 🎤 **Voice Notes**: Record clinical notes hands-free
- 📊 **Complications**: 5 customizable watch face complications
- 🔒 **Biometric Auth**: Face ID / Touch ID / Fingerprint support
- 📴 **Offline Mode**: Continue working without connection

## Improvements
- Faster sync with 60% reduced data usage
- Improved battery life (up to 18 hours active use)
- Enhanced haptic feedback patterns
- Better low-light visibility

## Bug Fixes
- Fixed notification delivery delays
- Resolved complication refresh issues
- Fixed crash on rapid screen transitions

## Supported Platforms
- watchOS 10.0+ (Apple Watch Series 7 and later)
- Wear OS 4.0+ (Pixel Watch, Galaxy Watch 5/6)
- Tizen 5.5+ (Galaxy Watch 3/4)
    `,
    
    checksums: {
      'jedi-watch-v2.9.0-watchos.ipa': 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      'jedi-watch-v2.9.0-wearos.apk': 'sha256:b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
      'jedi-watch-v2.9.0-tizen.wgt': 'sha256:c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
    },
  };
};

// ============================================
// EXPORT
// ============================================

export const watchPackage = {
  manifest: JEDI_WATCH_MANIFEST,
  generatePackage: generateInstallationPackage,
};

export default watchPackage;
