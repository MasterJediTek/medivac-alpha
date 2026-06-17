/**
 * Beta Testing Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import betaTestingService from '../beta-testing-service';

describe('BetaTestingService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset service state by re-initializing
    await betaTestingService.initialize();
  });

  describe('TestFlight Configuration', () => {
    it('should get TestFlight configuration', async () => {
      const config = await betaTestingService.getTestFlightConfig();
      expect(config).toBeDefined();
      expect(config?.bundleId).toBe('au.com.medivac.one');
      expect(config?.status).toBeDefined();
    });

    it('should update TestFlight configuration', async () => {
      const updated = await betaTestingService.updateTestFlightConfig({
        externalTestingEnabled: false,
      });
      expect(updated?.externalTestingEnabled).toBe(false);
    });

    it('should validate TestFlight configuration', async () => {
      const result = await betaTestingService.validateTestFlightConfig();
      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Google Play Configuration', () => {
    it('should get Google Play configuration', async () => {
      const config = await betaTestingService.getGooglePlayConfig();
      expect(config).toBeDefined();
      expect(config?.packageName).toBe('au.com.medivac.one');
      expect(config?.track).toBeDefined();
    });

    it('should update Google Play configuration', async () => {
      const updated = await betaTestingService.updateGooglePlayConfig({
        rolloutPercentage: 50,
      });
      expect(updated?.rolloutPercentage).toBe(50);
    });

    it('should validate Google Play configuration', async () => {
      const result = await betaTestingService.validateGooglePlayConfig();
      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Testers Management', () => {
    it('should get all testers', async () => {
      const testers = await betaTestingService.getTesters();
      expect(Array.isArray(testers)).toBe(true);
      expect(testers.length).toBeGreaterThan(0);
    });

    it('should invite a new tester', async () => {
      const tester = await betaTestingService.inviteTester(
        'new.tester@example.com',
        'New Tester',
        ['testflight'],
        ['grp_internal']
      );
      expect(tester.email).toBe('new.tester@example.com');
      expect(tester.name).toBe('New Tester');
      expect(tester.status).toBe('invited');
      expect(tester.platforms).toContain('testflight');
    });

    it('should remove a tester', async () => {
      const testers = await betaTestingService.getTesters();
      const testerId = testers[0].id;
      const result = await betaTestingService.removeTester(testerId);
      expect(result).toBe(true);
    });

    it('should update tester groups', async () => {
      const testers = await betaTestingService.getTesters();
      const testerId = testers[0].id;
      const updated = await betaTestingService.updateTesterGroups(testerId, ['grp_early_access']);
      expect(updated?.groups).toContain('grp_early_access');
    });
  });

  describe('Groups Management', () => {
    it('should get all groups', async () => {
      const groups = await betaTestingService.getGroups();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should create a new group', async () => {
      const group = await betaTestingService.createGroup({
        name: 'Test Group',
        description: 'A test group for testing',
        platform: 'testflight',
        isPublic: false,
        feedbackEnabled: true,
      });
      expect(group.name).toBe('Test Group');
      expect(group.testerCount).toBe(0);
    });

    it('should delete a group', async () => {
      const group = await betaTestingService.createGroup({
        name: 'Temp Group',
        description: 'Temporary group',
        platform: 'testflight',
        isPublic: false,
        feedbackEnabled: true,
      });
      const result = await betaTestingService.deleteGroup(group.id);
      expect(result).toBe(true);
    });
  });

  describe('Builds Management', () => {
    it('should get all builds', async () => {
      const builds = await betaTestingService.getBuilds();
      expect(Array.isArray(builds)).toBe(true);
      expect(builds.length).toBeGreaterThan(0);
    });

    it('should upload a new build', async () => {
      const build = await betaTestingService.uploadBuild({
        platform: 'testflight',
        version: '6.5.0',
        buildNumber: 65,
        releaseNotes: 'Test build release notes',
        minOsVersion: '15.0',
        size: 100000000,
        groups: ['grp_internal'],
      });
      expect(build.version).toBe('6.5.0');
      expect(build.buildNumber).toBe(65);
      expect(build.status).toBe('uploading');
    });

    it('should distribute a build to groups', async () => {
      const builds = await betaTestingService.getBuilds();
      const readyBuild = builds.find(b => b.status === 'ready' || b.status === 'testing');
      if (readyBuild) {
        // First make it ready
        readyBuild.status = 'ready';
        const result = await betaTestingService.distributeBuild(readyBuild.id, ['grp_internal', 'grp_clinical']);
        expect(result.success).toBeDefined();
      }
    });
  });

  describe('Crash Reports', () => {
    it('should get all crash reports', async () => {
      const crashes = await betaTestingService.getCrashReports();
      expect(Array.isArray(crashes)).toBe(true);
    });

    it('should report a new crash', async () => {
      const crash = await betaTestingService.reportCrash({
        platform: 'ios',
        buildVersion: '6.5.0',
        buildNumber: 65,
        crashType: 'exception',
        title: 'Test crash',
        stackTrace: 'at TestFunction()\nat main()',
        deviceModel: 'iPhone 15',
        osVersion: '17.0',
        appState: 'foreground',
        occurredAt: new Date().toISOString(),
        priority: 'medium',
      });
      expect(crash.title).toBe('Test crash');
      expect(crash.status).toBe('new');
      expect(crash.occurrences).toBe(1);
    });

    it('should update crash status', async () => {
      const crashes = await betaTestingService.getCrashReports();
      if (crashes.length > 0) {
        const updated = await betaTestingService.updateCrashStatus(crashes[0].id, 'investigating', 'Looking into this');
        expect(updated?.status).toBe('investigating');
      }
    });

    it('should assign a crash to someone', async () => {
      const crashes = await betaTestingService.getCrashReports();
      if (crashes.length > 0) {
        const updated = await betaTestingService.assignCrash(crashes[0].id, 'dev_team');
        expect(updated?.assignedTo).toBe('dev_team');
      }
    });
  });

  describe('Feedback', () => {
    it('should get all feedback', async () => {
      const feedback = await betaTestingService.getFeedback();
      expect(Array.isArray(feedback)).toBe(true);
    });

    it('should submit feedback', async () => {
      const feedback = await betaTestingService.submitFeedback({
        platform: 'testflight',
        buildVersion: '6.5.0',
        buildNumber: 65,
        type: 'bug',
        title: 'Test feedback',
        description: 'This is test feedback',
        deviceModel: 'iPhone 15',
        osVersion: '17.0',
        submittedBy: 'tester@example.com',
        priority: 'medium',
      });
      expect(feedback.title).toBe('Test feedback');
      expect(feedback.status).toBe('new');
    });

    it('should respond to feedback', async () => {
      const feedback = await betaTestingService.submitFeedback({
        platform: 'testflight',
        buildVersion: '6.5.0',
        buildNumber: 65,
        type: 'feature_request',
        title: 'Feature request',
        description: 'Please add this feature',
        deviceModel: 'iPhone 15',
        osVersion: '17.0',
        submittedBy: 'tester@example.com',
        priority: 'low',
      });
      const updated = await betaTestingService.respondToFeedback(
        feedback.id,
        'Thank you for your feedback!',
        'accepted'
      );
      expect(updated?.response).toBe('Thank you for your feedback!');
      expect(updated?.status).toBe('accepted');
    });
  });

  describe('Analytics', () => {
    it('should get beta analytics', async () => {
      const analytics = await betaTestingService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics.totalTesters).toBeGreaterThanOrEqual(0);
      expect(analytics.activeTesters).toBeGreaterThanOrEqual(0);
      expect(analytics.crashFreeRate).toBeGreaterThanOrEqual(0);
      expect(analytics.crashFreeRate).toBeLessThanOrEqual(100);
      expect(analytics.platformBreakdown).toBeDefined();
      expect(analytics.platformBreakdown.ios).toBeDefined();
      expect(analytics.platformBreakdown.android).toBeDefined();
    });

    it('should have build adoption data', async () => {
      const analytics = await betaTestingService.getAnalytics();
      expect(Array.isArray(analytics.buildAdoption)).toBe(true);
    });

    it('should have top crashes data', async () => {
      const analytics = await betaTestingService.getAnalytics();
      expect(Array.isArray(analytics.topCrashes)).toBe(true);
    });
  });
});
