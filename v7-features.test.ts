/**
 * MediVac One v7.0 Feature Tests
 * Tests for Cooperative Missions, Live Push, CI/CD, and JEDI Forum integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  },
}));

// Mock Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('Cooperative Mission Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default missions', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    await cooperativeMissionService.initialize();
    const missions = await cooperativeMissionService.getMissions();
    expect(missions).toBeDefined();
    expect(Array.isArray(missions)).toBe(true);
  });

  it('should support different mission types', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    await cooperativeMissionService.initialize();
    
    const missionTypes = ['medical_emergency', 'environmental_hazard', 'engineering_crisis', 'security_breach', 'research_expedition'];
    const missions = await cooperativeMissionService.getMissions();
    
    const foundTypes = new Set(missions.map(m => m.type));
    expect(foundTypes.size).toBeGreaterThan(0);
  });

  it('should support mission difficulty levels', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    await cooperativeMissionService.initialize();
    
    const missions = await cooperativeMissionService.getMissions();
    const difficulties = ['training', 'standard', 'advanced', 'expert', 'legendary'];
    
    missions.forEach(mission => {
      expect(difficulties).toContain(mission.difficulty);
    });
  });

  it('should get leaderboard', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    await cooperativeMissionService.initialize();
    
    const leaderboard = await cooperativeMissionService.getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  it('should filter missions by type', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    await cooperativeMissionService.initialize();
    
    const medicalMissions = await cooperativeMissionService.getMissions({ type: 'medical_emergency' });
    medicalMissions.forEach(mission => {
      expect(mission.type).toBe('medical_emergency');
    });
  });
});

describe('Live Push Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default configs', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const apnsConfig = await livePushNotificationService.getAPNsConfig();
    const fcmConfig = await livePushNotificationService.getFCMConfig();
    
    expect(apnsConfig).toBeDefined();
    expect(fcmConfig).toBeDefined();
  });

  it('should register device', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const registration = await livePushNotificationService.registerDevice(
      'user_123',
      'device_token_abc',
      {
        platform: 'ios',
        deviceModel: 'iPhone 14',
        osVersion: '17.0',
        appVersion: '7.0.0',
      }
    );
    
    expect(registration).toBeDefined();
    expect(registration.odId).toBe('user_123');
    expect(registration.deviceToken).toBe('device_token_abc');
    expect(registration.platform).toBe('ios');
  });

  it('should get registered devices', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const devices = await livePushNotificationService.getDevices();
    expect(Array.isArray(devices)).toBe(true);
  });

  it('should validate APNs config', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const result = await livePushNotificationService.validateAPNsConfig();
    expect(result).toHaveProperty('valid');
  });

  it('should validate FCM config', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const result = await livePushNotificationService.validateFCMConfig();
    expect(result).toHaveProperty('valid');
  });

  it('should get analytics', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const analytics = await livePushNotificationService.getAnalytics();
    expect(analytics).toHaveProperty('totalSent');
    expect(analytics).toHaveProperty('totalDelivered');
    expect(analytics).toHaveProperty('deliveryRate');
  });

  it('should schedule notification', async () => {
    const { livePushNotificationService } = await import('../live-push-notification-service');
    await livePushNotificationService.initialize();
    
    const scheduled = await livePushNotificationService.scheduleNotification(
      {
        id: 'notif_1',
        title: 'Test Notification',
        body: 'This is a test',
        category: 'system',
        priority: 'normal',
      },
      new Date(Date.now() + 3600000).toISOString(),
      { topics: ['all'] },
      'admin@medivac.one'
    );
    
    expect(scheduled).toBeDefined();
    expect(scheduled.status).toBe('scheduled');
  });
});

describe('CI/CD Build Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default configs', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const configs = await cicdBuildService.getConfigs();
    expect(configs).toBeDefined();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  it('should get version info', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const versionInfo = await cicdBuildService.getVersionInfo();
    expect(versionInfo).toBeDefined();
    expect(versionInfo).toHaveProperty('version');
    expect(versionInfo).toHaveProperty('buildNumber');
  });

  it('should get builds', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const builds = await cicdBuildService.getBuilds();
    expect(Array.isArray(builds)).toBe(true);
  });

  it('should filter builds by platform', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const iosBuilds = await cicdBuildService.getBuilds({ platform: 'ios' });
    iosBuilds.forEach(build => {
      expect(build.platform).toBe('ios');
    });
  });

  it('should get build configuration', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const configs = await cicdBuildService.getConfigs();
    if (configs.length > 0) {
      const config = await cicdBuildService.getConfig(configs[0].id);
      expect(config).toBeDefined();
      expect(config?.id).toBe(configs[0].id);
    }
  });

  it('should support different build environments', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const configs = await cicdBuildService.getConfigs();
    const environments = new Set(configs.map(c => c.environment));
    
    expect(environments.has('production') || environments.has('staging')).toBe(true);
  });

  it('should get rollback history', async () => {
    const { cicdBuildService } = await import('../cicd-build-service');
    await cicdBuildService.initialize();
    
    const rollbacks = await cicdBuildService.getRollbacks();
    expect(Array.isArray(rollbacks)).toBe(true);
  });
});

describe('JEDI Forum Crash Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default forum configs', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const configs = await jediForumCrashService.getConfigs();
    expect(configs).toBeDefined();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  it('should have JEDI Masters Forum configured', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const configs = await jediForumCrashService.getConfigs();
    const mastersForum = configs.find(c => c.forumType === 'jedi_masters');
    
    expect(mastersForum).toBeDefined();
    expect(mastersForum?.name).toBe('JEDI Masters Forum');
    expect(mastersForum?.isActive).toBe(true);
  });

  it('should have High JEDI Council configured', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const configs = await jediForumCrashService.getConfigs();
    const councilForum = configs.find(c => c.forumType === 'high_council');
    
    expect(councilForum).toBeDefined();
    expect(councilForum?.name).toBe('High JEDI Council');
    expect(councilForum?.isActive).toBe(true);
  });

  it('should get posting rules', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const rules = await jediForumCrashService.getRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should have critical issue rule for all forums', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const rules = await jediForumCrashService.getRules();
    const criticalRule = rules.find(r => r.condition.severity?.includes('critical'));
    
    expect(criticalRule).toBeDefined();
    expect(criticalRule?.targetForums).toContain('high_council');
  });

  it('should get posts', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const posts = await jediForumCrashService.getPosts();
    expect(Array.isArray(posts)).toBe(true);
  });

  it('should filter posts by forum type', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const councilPosts = await jediForumCrashService.getPosts({ forumType: 'high_council' });
    councilPosts.forEach(post => {
      expect(post.forumType).toBe('high_council');
    });
  });

  it('should get analytics', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const analytics = await jediForumCrashService.getAnalytics();
    expect(analytics).toHaveProperty('totalPosts');
    expect(analytics).toHaveProperty('resolvedPosts');
    expect(analytics).toHaveProperty('averageResolutionTime');
    expect(analytics).toHaveProperty('byForum');
    expect(analytics).toHaveProperty('bySeverity');
  });

  it('should capture screenshot', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const screenshot = await jediForumCrashService.captureScreenshot(
      'crash_123',
      'HomeScreen',
      'base64_image_data',
      {
        model: 'iPhone 14',
        os: 'iOS 17.0',
        screenSize: '390x844',
        orientation: 'portrait',
      }
    );
    
    expect(screenshot).toBeDefined();
    expect(screenshot.crashId).toBe('crash_123');
    expect(screenshot.screenName).toBe('HomeScreen');
    expect(screenshot.annotations).toEqual([]);
  });

  it('should add annotation to screenshot', async () => {
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    await jediForumCrashService.initialize();
    
    const screenshot = await jediForumCrashService.captureScreenshot(
      'crash_456',
      'ErrorScreen',
      'base64_image_data',
      {
        model: 'iPhone 14',
        os: 'iOS 17.0',
        screenSize: '390x844',
        orientation: 'portrait',
      }
    );
    
    const annotation = await jediForumCrashService.addAnnotation(screenshot.id, {
      type: 'arrow',
      x: 100,
      y: 200,
      endX: 150,
      endY: 250,
      color: '#FF0000',
      text: 'Error location',
    });
    
    expect(annotation).toBeDefined();
    expect(annotation?.type).toBe('arrow');
    expect(annotation?.text).toBe('Error location');
  });
});

describe('Enhanced Beta Testing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default capture options', async () => {
    const { enhancedBetaTestingService } = await import('../enhanced-beta-testing-service');
    await enhancedBetaTestingService.initialize();
    
    const options = await enhancedBetaTestingService.getCaptureOptions();
    expect(options).toBeDefined();
    expect(options.captureScreenshot).toBe(true);
    expect(options.autoPostToForums).toBe(true);
    expect(options.notifyJediMasters).toBe(true);
    expect(options.notifyHighCouncil).toBe(true);
  });

  it('should get performance metrics', async () => {
    const { enhancedBetaTestingService } = await import('../enhanced-beta-testing-service');
    await enhancedBetaTestingService.initialize();
    
    const metrics = await enhancedBetaTestingService.getPerformanceMetrics();
    expect(metrics).toHaveProperty('crashFreeRate');
    expect(metrics).toHaveProperty('crashesLast24h');
    expect(metrics).toHaveProperty('crashesLast7d');
    expect(metrics).toHaveProperty('mttr');
  });

  it('should update capture options', async () => {
    const { enhancedBetaTestingService } = await import('../enhanced-beta-testing-service');
    await enhancedBetaTestingService.initialize();
    
    const updated = await enhancedBetaTestingService.updateCaptureOptions({
      captureScreenshot: false,
    });
    
    expect(updated.captureScreenshot).toBe(false);
  });

  it('should get enhanced crashes', async () => {
    const { enhancedBetaTestingService } = await import('../enhanced-beta-testing-service');
    await enhancedBetaTestingService.initialize();
    
    const crashes = await enhancedBetaTestingService.getEnhancedCrashes();
    expect(Array.isArray(crashes)).toBe(true);
  });

  it('should sync forum resolutions', async () => {
    const { enhancedBetaTestingService } = await import('../enhanced-beta-testing-service');
    await enhancedBetaTestingService.initialize();
    
    const result = await enhancedBetaTestingService.syncForumResolutions();
    expect(result).toHaveProperty('synced');
    expect(result).toHaveProperty('resolved');
  });
});

describe('Integration Tests', () => {
  it('should have all services properly exported', async () => {
    const cooperativeModule = await import('../cooperative-mission-service');
    const pushModule = await import('../live-push-notification-service');
    const cicdModule = await import('../cicd-build-service');
    const forumModule = await import('../jedi-forum-crash-service');
    const enhancedModule = await import('../enhanced-beta-testing-service');
    
    expect(cooperativeModule.cooperativeMissionService).toBeDefined();
    expect(pushModule.livePushNotificationService).toBeDefined();
    expect(cicdModule.cicdBuildService).toBeDefined();
    expect(forumModule.jediForumCrashService).toBeDefined();
    expect(enhancedModule.enhancedBetaTestingService).toBeDefined();
  });

  it('should support event listeners on all services', async () => {
    const { cooperativeMissionService } = await import('../cooperative-mission-service');
    const { livePushNotificationService } = await import('../live-push-notification-service');
    const { cicdBuildService } = await import('../cicd-build-service');
    const { jediForumCrashService } = await import('../jedi-forum-crash-service');
    
    const callback = vi.fn();
    
    // All services should have on/off methods
    expect(typeof cooperativeMissionService.on).toBe('function');
    expect(typeof cooperativeMissionService.off).toBe('function');
    expect(typeof livePushNotificationService.on).toBe('function');
    expect(typeof livePushNotificationService.off).toBe('function');
    expect(typeof cicdBuildService.on).toBe('function');
    expect(typeof cicdBuildService.off).toBe('function');
    expect(typeof jediForumCrashService.on).toBe('function');
    expect(typeof jediForumCrashService.off).toBe('function');
  });
});
