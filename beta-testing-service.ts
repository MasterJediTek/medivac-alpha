/**
 * MediVac One Beta Testing Management Service
 * TestFlight, Google Play Internal Testing, and crash reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform Types
export type BetaPlatform = 'testflight' | 'google_play' | 'firebase_app_distribution';

// TestFlight Configuration
export interface TestFlightConfig {
  id: string;
  appId: string;
  bundleId: string;
  teamId: string;
  apiKeyId: string;
  issuerId: string;
  status: 'active' | 'inactive' | 'pending_review';
  lastBuildNumber: number;
  lastBuildVersion: string;
  lastUploadedAt?: string;
  externalTestingEnabled: boolean;
  betaAppReviewRequired: boolean;
}

// Google Play Internal Testing Configuration
export interface GooglePlayConfig {
  id: string;
  packageName: string;
  serviceAccountEmail: string;
  track: 'internal' | 'alpha' | 'beta' | 'production';
  status: 'active' | 'inactive' | 'draft';
  lastVersionCode: number;
  lastVersionName: string;
  lastUploadedAt?: string;
  rolloutPercentage: number;
  inAppUpdatePriority: number;
}

// Firebase App Distribution Configuration
export interface FirebaseDistributionConfig {
  id: string;
  projectId: string;
  appId: string;
  platform: 'ios' | 'android';
  status: 'active' | 'inactive';
  lastReleaseId?: string;
  lastUploadedAt?: string;
}

// Beta Tester
export interface BetaTester {
  id: string;
  email: string;
  name?: string;
  platforms: BetaPlatform[];
  groups: string[];
  status: 'invited' | 'accepted' | 'active' | 'inactive' | 'removed';
  invitedAt: string;
  acceptedAt?: string;
  lastActiveAt?: string;
  deviceCount: number;
  feedbackCount: number;
  crashCount: number;
}

// Tester Group
export interface TesterGroup {
  id: string;
  name: string;
  description: string;
  platform: BetaPlatform;
  testerCount: number;
  isPublic: boolean;
  feedbackEnabled: boolean;
  createdAt: string;
}

// Beta Build
export interface BetaBuild {
  id: string;
  platform: BetaPlatform;
  version: string;
  buildNumber: number;
  status: 'uploading' | 'processing' | 'ready' | 'testing' | 'expired' | 'rejected';
  uploadedAt: string;
  expiresAt?: string;
  releaseNotes: string;
  minOsVersion: string;
  size: number;
  downloadCount: number;
  installCount: number;
  crashCount: number;
  feedbackCount: number;
  groups: string[];
}

// Crash Report
export interface CrashReport {
  id: string;
  platform: 'ios' | 'android' | 'web';
  buildVersion: string;
  buildNumber: number;
  crashType: 'exception' | 'signal' | 'anr' | 'oom';
  title: string;
  stackTrace: string;
  deviceModel: string;
  osVersion: string;
  appState: 'foreground' | 'background';
  occurredAt: string;
  userId?: string;
  affectedUsers: number;
  occurrences: number;
  status: 'new' | 'investigating' | 'fixed' | 'wont_fix' | 'duplicate';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: string;
  resolvedAt?: string;
  resolvedInVersion?: string;
  notes?: string;
}

// Feedback Report
export interface FeedbackReport {
  id: string;
  platform: BetaPlatform;
  buildVersion: string;
  buildNumber: number;
  type: 'bug' | 'feature_request' | 'improvement' | 'question' | 'other';
  title: string;
  description: string;
  screenshot?: string;
  deviceModel: string;
  osVersion: string;
  submittedBy: string;
  submittedAt: string;
  status: 'new' | 'reviewing' | 'accepted' | 'rejected' | 'implemented';
  priority: 'critical' | 'high' | 'medium' | 'low';
  response?: string;
  respondedAt?: string;
}

// Beta Analytics
export interface BetaAnalytics {
  totalTesters: number;
  activeTesters: number;
  totalInstalls: number;
  totalCrashes: number;
  crashFreeRate: number;
  averageSessionDuration: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  feedbackSubmissions: number;
  platformBreakdown: {
    ios: { testers: number; installs: number; crashes: number };
    android: { testers: number; installs: number; crashes: number };
  };
  buildAdoption: { version: string; percentage: number }[];
  topCrashes: { id: string; title: string; occurrences: number }[];
}

const STORAGE_KEYS = {
  TESTFLIGHT: 'beta_testflight_config',
  GOOGLE_PLAY: 'beta_google_play_config',
  FIREBASE: 'beta_firebase_config',
  TESTERS: 'beta_testers',
  GROUPS: 'beta_groups',
  BUILDS: 'beta_builds',
  CRASHES: 'beta_crashes',
  FEEDBACK: 'beta_feedback',
};

class BetaTestingService {
  private testFlightConfig: TestFlightConfig | null = null;
  private googlePlayConfig: GooglePlayConfig | null = null;
  private firebaseConfigs: FirebaseDistributionConfig[] = [];
  private testers: BetaTester[] = [];
  private groups: TesterGroup[] = [];
  private builds: BetaBuild[] = [];
  private crashes: CrashReport[] = [];
  private feedback: FeedbackReport[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [tfData, gpData, fbData, testersData, groupsData, buildsData, crashesData, feedbackData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TESTFLIGHT),
        AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_PLAY),
        AsyncStorage.getItem(STORAGE_KEYS.FIREBASE),
        AsyncStorage.getItem(STORAGE_KEYS.TESTERS),
        AsyncStorage.getItem(STORAGE_KEYS.GROUPS),
        AsyncStorage.getItem(STORAGE_KEYS.BUILDS),
        AsyncStorage.getItem(STORAGE_KEYS.CRASHES),
        AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK),
      ]);

      this.testFlightConfig = tfData ? JSON.parse(tfData) : this.getDefaultTestFlightConfig();
      this.googlePlayConfig = gpData ? JSON.parse(gpData) : this.getDefaultGooglePlayConfig();
      this.firebaseConfigs = fbData ? JSON.parse(fbData) : [];
      this.testers = testersData ? JSON.parse(testersData) : this.getDefaultTesters();
      this.groups = groupsData ? JSON.parse(groupsData) : this.getDefaultGroups();
      this.builds = buildsData ? JSON.parse(buildsData) : this.getDefaultBuilds();
      this.crashes = crashesData ? JSON.parse(crashesData) : this.getDefaultCrashes();
      this.feedback = feedbackData ? JSON.parse(feedbackData) : [];

      this.initialized = true;
    } catch (error) {
      console.error('[Beta Testing] Failed to initialize:', error);
      this.testFlightConfig = this.getDefaultTestFlightConfig();
      this.googlePlayConfig = this.getDefaultGooglePlayConfig();
      this.testers = this.getDefaultTesters();
      this.groups = this.getDefaultGroups();
      this.builds = this.getDefaultBuilds();
      this.crashes = this.getDefaultCrashes();
      this.initialized = true;
    }
  }

  private getDefaultTestFlightConfig(): TestFlightConfig {
    return {
      id: 'tf_default',
      appId: '1234567890',
      bundleId: 'au.com.medivac.one',
      teamId: 'XXXXXXXXXX',
      apiKeyId: 'YYYYYYYYYY',
      issuerId: 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
      status: 'active',
      lastBuildNumber: 64,
      lastBuildVersion: '6.4.0',
      lastUploadedAt: new Date(Date.now() - 86400000).toISOString(),
      externalTestingEnabled: true,
      betaAppReviewRequired: true,
    };
  }

  private getDefaultGooglePlayConfig(): GooglePlayConfig {
    return {
      id: 'gp_default',
      packageName: 'au.com.medivac.one',
      serviceAccountEmail: 'medivac-ci@medivac-one.iam.gserviceaccount.com',
      track: 'internal',
      status: 'active',
      lastVersionCode: 64,
      lastVersionName: '6.4.0',
      lastUploadedAt: new Date(Date.now() - 86400000).toISOString(),
      rolloutPercentage: 100,
      inAppUpdatePriority: 3,
    };
  }

  private getDefaultTesters(): BetaTester[] {
    return [
      {
        id: 'tester_1',
        email: 'dr.smith@wachs.health.wa.gov.au',
        name: 'Dr. Sarah Smith',
        platforms: ['testflight', 'google_play'],
        groups: ['clinical_staff', 'early_access'],
        status: 'active',
        invitedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        acceptedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
        lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
        deviceCount: 2,
        feedbackCount: 12,
        crashCount: 1,
      },
      {
        id: 'tester_2',
        email: 'nurse.jones@wachs.health.wa.gov.au',
        name: 'Nurse Michael Jones',
        platforms: ['testflight'],
        groups: ['clinical_staff'],
        status: 'active',
        invitedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        acceptedAt: new Date(Date.now() - 24 * 86400000).toISOString(),
        lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
        deviceCount: 1,
        feedbackCount: 8,
        crashCount: 0,
      },
      {
        id: 'tester_3',
        email: 'admin@medivac.one',
        name: 'System Admin',
        platforms: ['testflight', 'google_play'],
        groups: ['internal', 'early_access'],
        status: 'active',
        invitedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        acceptedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastActiveAt: new Date().toISOString(),
        deviceCount: 4,
        feedbackCount: 45,
        crashCount: 3,
      },
    ];
  }

  private getDefaultGroups(): TesterGroup[] {
    return [
      {
        id: 'grp_internal',
        name: 'Internal Team',
        description: 'MediVac One development and QA team',
        platform: 'testflight',
        testerCount: 15,
        isPublic: false,
        feedbackEnabled: true,
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
      {
        id: 'grp_clinical',
        name: 'Clinical Staff',
        description: 'Doctors, nurses, and clinical staff testers',
        platform: 'testflight',
        testerCount: 50,
        isPublic: false,
        feedbackEnabled: true,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: 'grp_early_access',
        name: 'Early Access',
        description: 'Early access testers for new features',
        platform: 'testflight',
        testerCount: 25,
        isPublic: false,
        feedbackEnabled: true,
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
      {
        id: 'grp_android_internal',
        name: 'Android Internal',
        description: 'Internal Android testing group',
        platform: 'google_play',
        testerCount: 20,
        isPublic: false,
        feedbackEnabled: true,
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
    ];
  }

  private getDefaultBuilds(): BetaBuild[] {
    return [
      {
        id: 'build_ios_64',
        platform: 'testflight',
        version: '6.4.0',
        buildNumber: 64,
        status: 'testing',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 89 * 86400000).toISOString(),
        releaseNotes: 'MediVac One v6.4 - Tricorder System with Avatar/Pet Integration\n\n- New Tricorder Shop with 5 types and 3 rarity levels\n- Avatar System with 6 species and equipment slots\n- Pet System with 8 companion species\n- Tricorder Control Panel for medical scanning\n- Gifting system for avatars and pets',
        minOsVersion: '15.0',
        size: 125000000,
        downloadCount: 45,
        installCount: 42,
        crashCount: 2,
        feedbackCount: 8,
        groups: ['grp_internal', 'grp_clinical', 'grp_early_access'],
      },
      {
        id: 'build_android_64',
        platform: 'google_play',
        version: '6.4.0',
        buildNumber: 64,
        status: 'testing',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        releaseNotes: 'MediVac One v6.4 - Tricorder System with Avatar/Pet Integration',
        minOsVersion: '8.0',
        size: 85000000,
        downloadCount: 28,
        installCount: 26,
        crashCount: 1,
        feedbackCount: 5,
        groups: ['grp_android_internal'],
      },
      {
        id: 'build_ios_63',
        platform: 'testflight',
        version: '6.3.0',
        buildNumber: 63,
        status: 'expired',
        uploadedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        releaseNotes: 'MediVac One v6.3 - Color-coded UI systems and security enhancements',
        minOsVersion: '15.0',
        size: 120000000,
        downloadCount: 78,
        installCount: 75,
        crashCount: 5,
        feedbackCount: 22,
        groups: ['grp_internal', 'grp_clinical'],
      },
    ];
  }

  private getDefaultCrashes(): CrashReport[] {
    return [
      {
        id: 'crash_1',
        platform: 'ios',
        buildVersion: '6.4.0',
        buildNumber: 64,
        crashType: 'exception',
        title: 'NSInvalidArgumentException in TricorderControlPanel',
        stackTrace: 'NSInvalidArgumentException: -[NSNull objectForKey:]: unrecognized selector sent to instance\n  at TricorderControlPanel.performScan()\n  at ScanButton.onPress()\n  at TouchableOpacity.handlePress()',
        deviceModel: 'iPhone 14 Pro',
        osVersion: '17.2',
        appState: 'foreground',
        occurredAt: new Date(Date.now() - 3600000).toISOString(),
        affectedUsers: 2,
        occurrences: 3,
        status: 'investigating',
        priority: 'high',
        assignedTo: 'dev_team',
      },
      {
        id: 'crash_2',
        platform: 'android',
        buildVersion: '6.4.0',
        buildNumber: 64,
        crashType: 'exception',
        title: 'NullPointerException in AvatarService',
        stackTrace: 'java.lang.NullPointerException: Attempt to invoke virtual method on null object reference\n  at AvatarService.getEquippedItems()\n  at AvatarScreen.render()\n  at ReactNativeHost.createReactInstanceManager()',
        deviceModel: 'Samsung Galaxy S23',
        osVersion: '14',
        appState: 'foreground',
        occurredAt: new Date(Date.now() - 7200000).toISOString(),
        affectedUsers: 1,
        occurrences: 1,
        status: 'new',
        priority: 'medium',
      },
      {
        id: 'crash_3',
        platform: 'ios',
        buildVersion: '6.3.0',
        buildNumber: 63,
        crashType: 'signal',
        title: 'SIGSEGV in ColorCodeService',
        stackTrace: 'SIGSEGV: Segmentation fault\n  at ColorCodeService.getColorForSeverity()\n  at AlertDashboard.renderAlert()\n  at FlatList.renderItem()',
        deviceModel: 'iPhone 13',
        osVersion: '16.5',
        appState: 'foreground',
        occurredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        affectedUsers: 5,
        occurrences: 8,
        status: 'fixed',
        priority: 'critical',
        resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        resolvedInVersion: '6.4.0',
        notes: 'Fixed null check in getColorForSeverity method',
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TESTFLIGHT, JSON.stringify(this.testFlightConfig)),
        AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_PLAY, JSON.stringify(this.googlePlayConfig)),
        AsyncStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(this.firebaseConfigs)),
        AsyncStorage.setItem(STORAGE_KEYS.TESTERS, JSON.stringify(this.testers)),
        AsyncStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(this.groups)),
        AsyncStorage.setItem(STORAGE_KEYS.BUILDS, JSON.stringify(this.builds)),
        AsyncStorage.setItem(STORAGE_KEYS.CRASHES, JSON.stringify(this.crashes)),
        AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(this.feedback)),
      ]);
    } catch (error) {
      console.error('[Beta Testing] Failed to save:', error);
    }
  }

  // TestFlight Configuration
  async getTestFlightConfig(): Promise<TestFlightConfig | null> {
    await this.initialize();
    return this.testFlightConfig ? { ...this.testFlightConfig } : null;
  }

  async updateTestFlightConfig(updates: Partial<TestFlightConfig>): Promise<TestFlightConfig | null> {
    await this.initialize();
    if (!this.testFlightConfig) return null;
    this.testFlightConfig = { ...this.testFlightConfig, ...updates };
    await this.save();
    return this.testFlightConfig;
  }

  async validateTestFlightConfig(): Promise<{ valid: boolean; error?: string }> {
    await this.initialize();
    if (!this.testFlightConfig) {
      return { valid: false, error: 'TestFlight not configured' };
    }

    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const valid = Math.random() > 0.1;

    this.testFlightConfig.status = valid ? 'active' : 'inactive';
    await this.save();

    return { valid, error: valid ? undefined : 'Invalid App Store Connect credentials' };
  }

  // Google Play Configuration
  async getGooglePlayConfig(): Promise<GooglePlayConfig | null> {
    await this.initialize();
    return this.googlePlayConfig ? { ...this.googlePlayConfig } : null;
  }

  async updateGooglePlayConfig(updates: Partial<GooglePlayConfig>): Promise<GooglePlayConfig | null> {
    await this.initialize();
    if (!this.googlePlayConfig) return null;
    this.googlePlayConfig = { ...this.googlePlayConfig, ...updates };
    await this.save();
    return this.googlePlayConfig;
  }

  async validateGooglePlayConfig(): Promise<{ valid: boolean; error?: string }> {
    await this.initialize();
    if (!this.googlePlayConfig) {
      return { valid: false, error: 'Google Play not configured' };
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    const valid = Math.random() > 0.1;

    this.googlePlayConfig.status = valid ? 'active' : 'inactive';
    await this.save();

    return { valid, error: valid ? undefined : 'Invalid service account credentials' };
  }

  // Testers Management
  async getTesters(): Promise<BetaTester[]> {
    await this.initialize();
    return [...this.testers];
  }

  async inviteTester(email: string, name?: string, platforms?: BetaPlatform[], groups?: string[]): Promise<BetaTester> {
    await this.initialize();
    const newTester: BetaTester = {
      id: `tester_${Date.now()}`,
      email,
      name,
      platforms: platforms || ['testflight'],
      groups: groups || [],
      status: 'invited',
      invitedAt: new Date().toISOString(),
      deviceCount: 0,
      feedbackCount: 0,
      crashCount: 0,
    };
    this.testers.push(newTester);
    await this.save();
    return newTester;
  }

  async removeTester(testerId: string): Promise<boolean> {
    await this.initialize();
    const index = this.testers.findIndex(t => t.id === testerId);
    if (index === -1) return false;

    this.testers[index].status = 'removed';
    await this.save();
    return true;
  }

  async updateTesterGroups(testerId: string, groups: string[]): Promise<BetaTester | null> {
    await this.initialize();
    const tester = this.testers.find(t => t.id === testerId);
    if (!tester) return null;

    tester.groups = groups;
    await this.save();
    return tester;
  }

  // Groups Management
  async getGroups(): Promise<TesterGroup[]> {
    await this.initialize();
    return [...this.groups];
  }

  async createGroup(group: Omit<TesterGroup, 'id' | 'testerCount' | 'createdAt'>): Promise<TesterGroup> {
    await this.initialize();
    const newGroup: TesterGroup = {
      ...group,
      id: `grp_${Date.now()}`,
      testerCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.groups.push(newGroup);
    await this.save();
    return newGroup;
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    await this.initialize();
    const index = this.groups.findIndex(g => g.id === groupId);
    if (index === -1) return false;

    this.groups.splice(index, 1);
    await this.save();
    return true;
  }

  // Builds Management
  async getBuilds(): Promise<BetaBuild[]> {
    await this.initialize();
    return [...this.builds];
  }

  async uploadBuild(build: Omit<BetaBuild, 'id' | 'status' | 'uploadedAt' | 'downloadCount' | 'installCount' | 'crashCount' | 'feedbackCount'>): Promise<BetaBuild> {
    await this.initialize();

    const newBuild: BetaBuild = {
      ...build,
      id: `build_${build.platform}_${build.buildNumber}`,
      status: 'uploading',
      uploadedAt: new Date().toISOString(),
      downloadCount: 0,
      installCount: 0,
      crashCount: 0,
      feedbackCount: 0,
    };

    this.builds.push(newBuild);
    await this.save();

    // Simulate upload and processing
    setTimeout(async () => {
      newBuild.status = 'processing';
      await this.save();

      setTimeout(async () => {
        newBuild.status = 'ready';
        if (build.platform === 'testflight') {
          newBuild.expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
        }
        await this.save();
      }, 5000);
    }, 3000);

    return newBuild;
  }

  async distributeBuild(buildId: string, groups: string[]): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    const build = this.builds.find(b => b.id === buildId);
    if (!build) {
      return { success: false, error: 'Build not found' };
    }

    if (build.status !== 'ready') {
      return { success: false, error: 'Build is not ready for distribution' };
    }

    build.groups = groups;
    build.status = 'testing';
    await this.save();

    return { success: true };
  }

  // Crash Reports
  async getCrashReports(): Promise<CrashReport[]> {
    await this.initialize();
    return [...this.crashes];
  }

  async reportCrash(crash: Omit<CrashReport, 'id' | 'status' | 'affectedUsers' | 'occurrences'>): Promise<CrashReport> {
    await this.initialize();

    // Check for duplicate
    const existing = this.crashes.find(c => 
      c.title === crash.title && 
      c.buildVersion === crash.buildVersion &&
      c.status !== 'fixed'
    );

    if (existing) {
      existing.occurrences++;
      existing.affectedUsers++;
      await this.save();
      return existing;
    }

    const newCrash: CrashReport = {
      ...crash,
      id: `crash_${Date.now()}`,
      status: 'new',
      affectedUsers: 1,
      occurrences: 1,
    };

    this.crashes.push(newCrash);
    await this.save();
    return newCrash;
  }

  async updateCrashStatus(crashId: string, status: CrashReport['status'], notes?: string): Promise<CrashReport | null> {
    await this.initialize();
    const crash = this.crashes.find(c => c.id === crashId);
    if (!crash) return null;

    crash.status = status;
    if (notes) crash.notes = notes;
    if (status === 'fixed') {
      crash.resolvedAt = new Date().toISOString();
    }

    await this.save();
    return crash;
  }

  async assignCrash(crashId: string, assignee: string): Promise<CrashReport | null> {
    await this.initialize();
    const crash = this.crashes.find(c => c.id === crashId);
    if (!crash) return null;

    crash.assignedTo = assignee;
    crash.status = 'investigating';
    await this.save();
    return crash;
  }

  // Feedback
  async getFeedback(): Promise<FeedbackReport[]> {
    await this.initialize();
    return [...this.feedback];
  }

  async submitFeedback(report: Omit<FeedbackReport, 'id' | 'status' | 'submittedAt'>): Promise<FeedbackReport> {
    await this.initialize();
    const newFeedback: FeedbackReport = {
      ...report,
      id: `feedback_${Date.now()}`,
      status: 'new',
      submittedAt: new Date().toISOString(),
    };
    this.feedback.push(newFeedback);
    await this.save();
    return newFeedback;
  }

  async respondToFeedback(feedbackId: string, response: string, status: FeedbackReport['status']): Promise<FeedbackReport | null> {
    await this.initialize();
    const report = this.feedback.find(f => f.id === feedbackId);
    if (!report) return null;

    report.response = response;
    report.status = status;
    report.respondedAt = new Date().toISOString();
    await this.save();
    return report;
  }

  // Analytics
  async getAnalytics(): Promise<BetaAnalytics> {
    await this.initialize();

    const activeTesters = this.testers.filter(t => t.status === 'active');
    const totalCrashes = this.crashes.reduce((sum, c) => sum + c.occurrences, 0);
    const totalInstalls = this.builds.reduce((sum, b) => sum + b.installCount, 0);

    return {
      totalTesters: this.testers.length,
      activeTesters: activeTesters.length,
      totalInstalls,
      totalCrashes,
      crashFreeRate: totalInstalls > 0 ? ((totalInstalls - totalCrashes) / totalInstalls) * 100 : 100,
      averageSessionDuration: 12.5,
      dailyActiveUsers: Math.floor(activeTesters.length * 0.6),
      weeklyActiveUsers: Math.floor(activeTesters.length * 0.85),
      feedbackSubmissions: this.feedback.length,
      platformBreakdown: {
        ios: {
          testers: this.testers.filter(t => t.platforms.includes('testflight')).length,
          installs: this.builds.filter(b => b.platform === 'testflight').reduce((sum, b) => sum + b.installCount, 0),
          crashes: this.crashes.filter(c => c.platform === 'ios').reduce((sum, c) => sum + c.occurrences, 0),
        },
        android: {
          testers: this.testers.filter(t => t.platforms.includes('google_play')).length,
          installs: this.builds.filter(b => b.platform === 'google_play').reduce((sum, b) => sum + b.installCount, 0),
          crashes: this.crashes.filter(c => c.platform === 'android').reduce((sum, c) => sum + c.occurrences, 0),
        },
      },
      buildAdoption: [
        { version: '6.4.0', percentage: 65 },
        { version: '6.3.0', percentage: 30 },
        { version: '6.2.0', percentage: 5 },
      ],
      topCrashes: this.crashes
        .filter(c => c.status !== 'fixed')
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 5)
        .map(c => ({ id: c.id, title: c.title, occurrences: c.occurrences })),
    };
  }
}

export const betaTestingService = new BetaTestingService();
export default betaTestingService;
