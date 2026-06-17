/**
 * MediVac One Enhanced Beta Testing Service
 * Integrates crash reports with JEDI Forum posting, screenshots, and annotations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import jediForumCrashService, {
  type ForumCrashReport,
  type CrashScreenshot,
  type ScreenshotAnnotation,
  type CrashSeverity,
  type ForumType,
} from './jedi-forum-crash-service';
import betaTestingService, { type CrashReport } from './beta-testing-service';

// Enhanced Crash Report with Forum Integration
export interface EnhancedCrashReport extends CrashReport {
  forumPosts: {
    forumType: ForumType;
    postId: string;
    threadUrl: string;
    status: string;
    postedAt: string;
  }[];
  screenshots: CrashScreenshot[];
  autoPostedToForums: boolean;
  jediMastersNotified: boolean;
  highCouncilNotified: boolean;
}

// Crash Capture Options
export interface CrashCaptureOptions {
  captureScreenshot: boolean;
  includeDeviceLogs: boolean;
  includeNetworkLogs: boolean;
  includeUserActions: boolean;
  autoPostToForums: boolean;
  notifyJediMasters: boolean;
  notifyHighCouncil: boolean;
  customTags: string[];
}

// Live Performance Metrics
export interface LivePerformanceMetrics {
  crashFreeRate: number;
  crashesLast24h: number;
  crashesLast7d: number;
  topCrashingScreens: { screen: string; count: number }[];
  topCrashingDevices: { device: string; count: number }[];
  averageSessionDuration: number;
  activeUsers: number;
  forumPostsCreated: number;
  forumPostsResolved: number;
  mttr: number; // Mean Time To Resolution in hours
}

const STORAGE_KEYS = {
  ENHANCED_CRASHES: 'enhanced_beta_crashes',
  PERFORMANCE_METRICS: 'enhanced_beta_metrics',
  CAPTURE_OPTIONS: 'enhanced_beta_capture_options',
};

class EnhancedBetaTestingService {
  private enhancedCrashes: EnhancedCrashReport[] = [];
  private performanceMetrics: LivePerformanceMetrics | null = null;
  private captureOptions: CrashCaptureOptions = this.getDefaultCaptureOptions();
  private initialized = false;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  private getDefaultCaptureOptions(): CrashCaptureOptions {
    return {
      captureScreenshot: true,
      includeDeviceLogs: true,
      includeNetworkLogs: true,
      includeUserActions: true,
      autoPostToForums: true,
      notifyJediMasters: true,
      notifyHighCouncil: true,
      customTags: [],
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [crashesData, metricsData, optionsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ENHANCED_CRASHES),
        AsyncStorage.getItem(STORAGE_KEYS.PERFORMANCE_METRICS),
        AsyncStorage.getItem(STORAGE_KEYS.CAPTURE_OPTIONS),
      ]);

      this.enhancedCrashes = crashesData ? JSON.parse(crashesData) : [];
      this.performanceMetrics = metricsData ? JSON.parse(metricsData) : this.getDefaultMetrics();
      this.captureOptions = optionsData ? JSON.parse(optionsData) : this.getDefaultCaptureOptions();

      // Initialize dependent services
      await betaTestingService.initialize();
      await jediForumCrashService.initialize();

      this.initialized = true;
      console.log('[Enhanced Beta] Service initialized');
    } catch (error) {
      console.error('[Enhanced Beta] Failed to initialize:', error);
      this.performanceMetrics = this.getDefaultMetrics();
      this.initialized = true;
    }
  }

  private getDefaultMetrics(): LivePerformanceMetrics {
    return {
      crashFreeRate: 99.2,
      crashesLast24h: 3,
      crashesLast7d: 15,
      topCrashingScreens: [
        { screen: 'PatientDetail', count: 5 },
        { screen: 'MedicationList', count: 3 },
        { screen: 'VitalSigns', count: 2 },
      ],
      topCrashingDevices: [
        { device: 'iPhone 12', count: 4 },
        { device: 'Samsung Galaxy S21', count: 3 },
        { device: 'iPad Pro', count: 2 },
      ],
      averageSessionDuration: 12.5,
      activeUsers: 847,
      forumPostsCreated: 8,
      forumPostsResolved: 6,
      mttr: 4.2,
    };
  }

  private async save(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ENHANCED_CRASHES, JSON.stringify(this.enhancedCrashes.slice(-200))),
        AsyncStorage.setItem(STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(this.performanceMetrics)),
        AsyncStorage.setItem(STORAGE_KEYS.CAPTURE_OPTIONS, JSON.stringify(this.captureOptions)),
      ]);
    } catch (error) {
      console.error('[Enhanced Beta] Failed to save:', error);
    }
  }

  // Capture Options
  async getCaptureOptions(): Promise<CrashCaptureOptions> {
    await this.initialize();
    return this.captureOptions;
  }

  async updateCaptureOptions(options: Partial<CrashCaptureOptions>): Promise<CrashCaptureOptions> {
    await this.initialize();
    this.captureOptions = { ...this.captureOptions, ...options };
    await this.save();
    return this.captureOptions;
  }

  // Enhanced Crash Reporting
  async reportCrashWithScreenshot(
    crashData: {
      platform: 'ios' | 'android' | 'web';
      buildVersion: string;
      buildNumber: number;
      crashType: 'exception' | 'anr' | 'signal' | 'oom';
      title: string;
      stackTrace: string;
      deviceModel: string;
      osVersion: string;
      appState: 'foreground' | 'background';
      occurredAt: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      screenName: string;
      userActions?: string[];
      networkLogs?: string[];
      deviceLogs?: string[];
    },
    screenshotData?: {
      imageBase64: string;
      annotations?: Omit<ScreenshotAnnotation, 'id'>[];
    }
  ): Promise<EnhancedCrashReport> {
    await this.initialize();

    // Create base crash report
    const baseCrash = await betaTestingService.reportCrash({
      platform: crashData.platform,
      buildVersion: crashData.buildVersion,
      buildNumber: crashData.buildNumber,
      crashType: crashData.crashType,
      title: crashData.title,
      stackTrace: crashData.stackTrace,
      deviceModel: crashData.deviceModel,
      osVersion: crashData.osVersion,
      appState: crashData.appState,
      occurredAt: crashData.occurredAt,
      priority: crashData.priority,
    });

    const enhancedCrash: EnhancedCrashReport = {
      ...baseCrash,
      forumPosts: [],
      screenshots: [],
      autoPostedToForums: false,
      jediMastersNotified: false,
      highCouncilNotified: false,
    };

    // Capture screenshot if provided
    if (screenshotData && this.captureOptions.captureScreenshot) {
      const screenshot = await jediForumCrashService.captureScreenshot(
        baseCrash.id,
        crashData.screenName,
        screenshotData.imageBase64,
        {
          model: crashData.deviceModel,
          os: crashData.osVersion,
          screenSize: '390x844',
          orientation: 'portrait',
        }
      );

      // Add annotations if provided
      if (screenshotData.annotations) {
        for (const annotation of screenshotData.annotations) {
          await jediForumCrashService.addAnnotation(screenshot.id, annotation);
        }
      }

      enhancedCrash.screenshots.push(screenshot);
    }

    // Auto-post to forums if enabled
    if (this.captureOptions.autoPostToForums) {
      await this.postCrashToForums(enhancedCrash, crashData);
    }

    this.enhancedCrashes.push(enhancedCrash);
    await this.updatePerformanceMetrics();
    await this.save();

    this.emit('enhanced_crash_reported', enhancedCrash);
    return enhancedCrash;
  }

  private async postCrashToForums(
    crash: EnhancedCrashReport,
    crashData: {
      title: string;
      stackTrace: string;
      priority: string;
      screenName: string;
      userActions?: string[];
      platform: string;
      buildVersion: string;
      buildNumber: number;
      deviceModel: string;
      osVersion: string;
      occurredAt: string;
    }
  ): Promise<void> {
    // Determine severity for forum routing
    const severity = this.mapPriorityToSeverity(crashData.priority);

    // Create forum crash report
    const forumReport: Omit<ForumCrashReport, 'id' | 'screenshots'> = {
      crashId: crash.id,
      title: crashData.title,
      description: `Crash occurred on ${crashData.screenName} screen`,
      severity,
      platform: crashData.platform as 'ios' | 'android' | 'web',
      buildVersion: crashData.buildVersion,
      buildNumber: crashData.buildNumber,
      stackTrace: crashData.stackTrace,
      deviceModel: crashData.deviceModel,
      osVersion: crashData.osVersion,
      occurredAt: crashData.occurredAt,
      occurrences: crash.occurrences,
      affectedUsers: crash.affectedUsers,
      logs: [],
      steps: crashData.userActions || [],
      relatedCrashes: [],
      tags: this.captureOptions.customTags.concat([
        crashData.platform,
        severity,
        crashData.screenName.toLowerCase().replace(/\s+/g, '-'),
      ]),
    };

    // Create the forum crash report (this triggers auto-posting based on rules)
    const createdReport = await jediForumCrashService.createCrashReport(forumReport);

    // Get posts created for this crash
    const posts = await jediForumCrashService.getPosts();
    const crashPosts = posts.filter(p => p.crashReportId === createdReport.id);

    for (const post of crashPosts) {
      crash.forumPosts.push({
        forumType: post.forumType,
        postId: post.id,
        threadUrl: post.threadUrl || '',
        status: post.status,
        postedAt: post.postedAt || new Date().toISOString(),
      });

      if (post.forumType === 'jedi_masters') {
        crash.jediMastersNotified = true;
      }
      if (post.forumType === 'high_council') {
        crash.highCouncilNotified = true;
      }
    }

    crash.autoPostedToForums = crashPosts.length > 0;

    console.log(`[Enhanced Beta] Crash posted to ${crashPosts.length} forums`);
  }

  private mapPriorityToSeverity(priority: string): CrashSeverity {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  // Add screenshot to existing crash
  async addScreenshotToCrash(
    crashId: string,
    screenName: string,
    imageBase64: string,
    deviceInfo: { model: string; os: string },
    annotations?: Omit<ScreenshotAnnotation, 'id'>[]
  ): Promise<CrashScreenshot | null> {
    await this.initialize();

    const crash = this.enhancedCrashes.find(c => c.id === crashId);
    if (!crash) return null;

    const screenshot = await jediForumCrashService.captureScreenshot(
      crashId,
      screenName,
      imageBase64,
      {
        model: deviceInfo.model,
        os: deviceInfo.os,
        screenSize: '390x844',
        orientation: 'portrait',
      }
    );

    if (annotations) {
      for (const annotation of annotations) {
        await jediForumCrashService.addAnnotation(screenshot.id, annotation);
      }
    }

    crash.screenshots.push(screenshot);
    await this.save();

    return screenshot;
  }

  // Add annotation to screenshot
  async addAnnotationToScreenshot(
    screenshotId: string,
    annotation: Omit<ScreenshotAnnotation, 'id'>
  ): Promise<ScreenshotAnnotation | null> {
    await this.initialize();
    return jediForumCrashService.addAnnotation(screenshotId, annotation);
  }

  // Get enhanced crashes
  async getEnhancedCrashes(filter?: {
    platform?: string;
    severity?: string;
    hasForumPosts?: boolean;
  }): Promise<EnhancedCrashReport[]> {
    await this.initialize();
    let filtered = [...this.enhancedCrashes];

    if (filter?.platform) {
      filtered = filtered.filter(c => c.platform === filter.platform);
    }
    if (filter?.severity) {
      filtered = filtered.filter(c => c.priority === filter.severity);
    }
    if (filter?.hasForumPosts !== undefined) {
      filtered = filtered.filter(c => 
        filter.hasForumPosts ? c.forumPosts.length > 0 : c.forumPosts.length === 0
      );
    }

    return filtered;
  }

  // Live Performance Metrics
  async getPerformanceMetrics(): Promise<LivePerformanceMetrics> {
    await this.initialize();
    return this.performanceMetrics || this.getDefaultMetrics();
  }

  private async updatePerformanceMetrics(): Promise<void> {
    if (!this.performanceMetrics) {
      this.performanceMetrics = this.getDefaultMetrics();
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Count crashes
    const crashesLast24h = this.enhancedCrashes.filter(c => 
      new Date(c.occurredAt).getTime() > oneDayAgo
    ).length;
    
    const crashesLast7d = this.enhancedCrashes.filter(c => 
      new Date(c.occurredAt).getTime() > sevenDaysAgo
    ).length;

    // Update metrics
    this.performanceMetrics.crashesLast24h = crashesLast24h;
    this.performanceMetrics.crashesLast7d = crashesLast7d;

    // Update crash-free rate (simulated)
    const totalSessions = 10000; // Simulated
    this.performanceMetrics.crashFreeRate = 
      ((totalSessions - crashesLast7d) / totalSessions) * 100;

    // Update forum post counts
    const posts = await jediForumCrashService.getPosts();
    this.performanceMetrics.forumPostsCreated = posts.length;
    this.performanceMetrics.forumPostsResolved = posts.filter(p => p.status === 'resolved').length;

    // Calculate MTTR
    const resolvedPosts = posts.filter(p => p.status === 'resolved' && p.postedAt && p.resolvedAt);
    if (resolvedPosts.length > 0) {
      const totalResolutionTime = resolvedPosts.reduce((sum, p) => {
        return sum + (new Date(p.resolvedAt!).getTime() - new Date(p.postedAt!).getTime());
      }, 0);
      this.performanceMetrics.mttr = totalResolutionTime / resolvedPosts.length / 3600000;
    }
  }

  // Manually post crash to specific forum
  async postCrashToForum(
    crashId: string,
    forumType: ForumType,
    author: string,
    authorRole: string
  ): Promise<{ success: boolean; postId?: string; threadUrl?: string }> {
    await this.initialize();

    const crash = this.enhancedCrashes.find(c => c.id === crashId);
    if (!crash) {
      return { success: false };
    }

    // Check if already posted to this forum
    if (crash.forumPosts.some(p => p.forumType === forumType)) {
      return { success: false };
    }

    const forumReport: Omit<ForumCrashReport, 'id' | 'screenshots'> = {
      crashId: crash.id,
      title: crash.title,
      description: `Manual crash report submission`,
      severity: this.mapPriorityToSeverity(crash.priority),
      platform: crash.platform,
      buildVersion: crash.buildVersion,
      buildNumber: crash.buildNumber,
      stackTrace: crash.stackTrace,
      deviceModel: crash.deviceModel,
      osVersion: crash.osVersion,
      occurredAt: crash.occurredAt,
      occurrences: crash.occurrences,
      affectedUsers: crash.affectedUsers,
      logs: [],
      steps: [],
      relatedCrashes: [],
      tags: [crash.platform, crash.priority],
    };

    const createdReport = await jediForumCrashService.createCrashReport(forumReport);
    const post = await jediForumCrashService.postToForum(
      { ...createdReport, screenshots: crash.screenshots },
      forumType,
      crash.priority === 'critical' ? 'urgent' : crash.priority === 'high' ? 'high' : 'normal',
      author,
      authorRole
    );

    crash.forumPosts.push({
      forumType,
      postId: post.id,
      threadUrl: post.threadUrl || '',
      status: post.status,
      postedAt: post.postedAt || new Date().toISOString(),
    });

    if (forumType === 'jedi_masters') {
      crash.jediMastersNotified = true;
    }
    if (forumType === 'high_council') {
      crash.highCouncilNotified = true;
    }

    await this.save();

    return {
      success: true,
      postId: post.id,
      threadUrl: post.threadUrl,
    };
  }

  // Sync crash resolution status from forums
  async syncForumResolutions(): Promise<{ synced: number; resolved: number }> {
    await this.initialize();

    let synced = 0;
    let resolved = 0;

    for (const crash of this.enhancedCrashes) {
      for (const forumPost of crash.forumPosts) {
        const post = await jediForumCrashService.getPost(forumPost.postId);
        if (post && post.status !== forumPost.status) {
          forumPost.status = post.status;
          synced++;

          if (post.status === 'resolved') {
            resolved++;
            // Update crash status in beta testing service
            await betaTestingService.updateCrashStatus(crash.id, 'fixed', post.resolution);
          }
        }
      }
    }

    await this.save();
    return { synced, resolved };
  }

  // Event System
  on(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
    console.log(`[Enhanced Beta] Event: ${event}`);
  }
}

export const enhancedBetaTestingService = new EnhancedBetaTestingService();
export default enhancedBetaTestingService;
