/**
 * Tests for v6.0 Features
 * Recording Highlights, WACHS Health Dashboard, Sync Rules, WACHS Deployment, Microsoft Auth
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

describe('v6.0 Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Recording Highlights Service', () => {
    it('should define highlight types', async () => {
      const { HIGHLIGHT_TYPES } = await import('../lib/services/recording-highlights-service');
      expect(HIGHLIGHT_TYPES).toBeDefined();
      expect(HIGHLIGHT_TYPES.key_moment).toBeDefined();
      expect(HIGHLIGHT_TYPES.action_item).toBeDefined();
      expect(HIGHLIGHT_TYPES.decision).toBeDefined();
    });

    it('should initialize service', async () => {
      const { recordingHighlightsService } = await import('../lib/services/recording-highlights-service');
      await recordingHighlightsService.initialize();
      const highlights = recordingHighlightsService.getHighlights();
      expect(Array.isArray(highlights)).toBe(true);
    });

    it('should create highlight', async () => {
      const { recordingHighlightsService } = await import('../lib/services/recording-highlights-service');
      await recordingHighlightsService.initialize();
      
      const highlight = await recordingHighlightsService.createHighlight({
        recordingId: 'rec_test',
        type: 'key_moment',
        title: 'Test Highlight',
        timestamp: 60,
        duration: 60,
        createdBy: 'Test User',
        tags: [],
        isBookmarked: false,
      });
      
      expect(highlight.id).toBeDefined();
      expect(highlight.title).toBe('Test Highlight');
      expect(highlight.type).toBe('key_moment');
    });

    it('should create clip', async () => {
      const { recordingHighlightsService } = await import('../lib/services/recording-highlights-service');
      await recordingHighlightsService.initialize();
      
      const clip = await recordingHighlightsService.createClip({
        recordingId: 'rec_test',
        title: 'Test Clip',
        description: 'A test clip',
        startTime: 0,
        endTime: 30,
        createdBy: 'Test User',
      });
      
      expect(clip.id).toBeDefined();
      expect(clip.title).toBe('Test Clip');
    });
  });

  describe('WACHS Health Dashboard Service', () => {
    it('should define regions', async () => {
      const { WACHS_REGIONS } = await import('../lib/services/wachs-health-service');
      expect(WACHS_REGIONS).toBeDefined();
      expect(Object.keys(WACHS_REGIONS).length).toBeGreaterThan(0);
    });

    it('should initialize service', async () => {
      const { wachsHealthService } = await import('../lib/services/wachs-health-service');
      await wachsHealthService.initialize();
      const sites = wachsHealthService.getSites();
      expect(Array.isArray(sites)).toBe(true);
    });

    it('should get site by id', async () => {
      const { wachsHealthService } = await import('../lib/services/wachs-health-service');
      await wachsHealthService.initialize();
      const sites = wachsHealthService.getSites();
      
      if (sites.length > 0) {
        const site = wachsHealthService.getSite(sites[0].siteId);
        expect(site).toBeDefined();
        expect(site?.siteName).toBeDefined();
      }
    });

    it('should get region health', async () => {
      const { wachsHealthService } = await import('../lib/services/wachs-health-service');
      await wachsHealthService.initialize();
      const regionHealth = wachsHealthService.getRegionHealth();
      
      expect(Array.isArray(regionHealth)).toBe(true);
      if (regionHealth.length > 0) {
        expect(regionHealth[0].regionName).toBeDefined();
        expect(regionHealth[0].siteCount).toBeDefined();
      }
    });
  });

  describe('Sync Rules Service', () => {
    it('should define rule types', async () => {
      const { RULE_TYPES } = await import('../lib/services/sync-rules-service');
      expect(RULE_TYPES).toBeDefined();
      expect(RULE_TYPES.file_type).toBeDefined();
      expect(RULE_TYPES.folder).toBeDefined();
    });

    it('should initialize service', async () => {
      const { syncRulesService } = await import('../lib/services/sync-rules-service');
      await syncRulesService.initialize();
      const rules = syncRulesService.getRules();
      expect(Array.isArray(rules)).toBe(true);
    });

    it('should create sync rule', async () => {
      const { syncRulesService } = await import('../lib/services/sync-rules-service');
      await syncRulesService.initialize();
      
      const rule = await syncRulesService.createRule({
        name: 'Test Rule',
        type: 'file_type',
        action: 'include',
        conditions: {
          fileTypes: ['pdf', 'docx'],
        },
      });
      
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.type).toBe('file_type');
    });

    it('should get rule by id', async () => {
      const { syncRulesService } = await import('../lib/services/sync-rules-service');
      await syncRulesService.initialize();
      const rules = syncRulesService.getRules();
      
      if (rules.length > 0) {
        const rule = syncRulesService.getRule(rules[0].id);
        expect(rule).toBeDefined();
      }
    });
  });

  describe('WACHS Deployment Service', () => {
    it('should define package types', async () => {
      const { PACKAGE_TYPES } = await import('../lib/services/wachs-deployment-service');
      expect(PACKAGE_TYPES).toBeDefined();
      expect(PACKAGE_TYPES.application).toBeDefined();
      expect(PACKAGE_TYPES.configuration).toBeDefined();
    });

    it('should initialize service', async () => {
      const { wachsDeploymentService } = await import('../lib/services/wachs-deployment-service');
      await wachsDeploymentService.initialize();
      const deployments = wachsDeploymentService.getDeployments();
      expect(Array.isArray(deployments)).toBe(true);
    });

    it('should get packages', async () => {
      const { wachsDeploymentService } = await import('../lib/services/wachs-deployment-service');
      await wachsDeploymentService.initialize();
      const packages = wachsDeploymentService.getPackages();
      expect(Array.isArray(packages)).toBe(true);
    });

    it('should create deployment', async () => {
      const { wachsDeploymentService } = await import('../lib/services/wachs-deployment-service');
      await wachsDeploymentService.initialize();
      const packages = wachsDeploymentService.getPackages();
      
      if (packages.length > 0) {
        const deployment = await wachsDeploymentService.createDeployment({
          name: 'Test Deployment',
          packageId: packages[0].id,
          target: 'all_sites',
          targetSites: ['site_1'],
        });
        
        expect(deployment.id).toBeDefined();
        expect(deployment.name).toBe('Test Deployment');
      }
    });

    it('should get analytics', async () => {
      const { wachsDeploymentService } = await import('../lib/services/wachs-deployment-service');
      await wachsDeploymentService.initialize();
      const analytics = wachsDeploymentService.getAnalytics();
      
      expect(analytics.totalDeployments).toBeDefined();
      expect(analytics.successRate).toBeDefined();
    });
  });

  describe('Microsoft Auth Service', () => {
    it('should define Microsoft services', async () => {
      const { MICROSOFT_SERVICES } = await import('../lib/services/microsoft-auth-service');
      expect(MICROSOFT_SERVICES).toBeDefined();
      expect(MICROSOFT_SERVICES.teams).toBeDefined();
      expect(MICROSOFT_SERVICES.sharepoint).toBeDefined();
      expect(MICROSOFT_SERVICES.onedrive).toBeDefined();
    });

    it('should initialize service', async () => {
      const { microsoftAuthService } = await import('../lib/services/microsoft-auth-service');
      await microsoftAuthService.initialize();
      const accounts = microsoftAuthService.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
    });

    it('should add account', async () => {
      const { microsoftAuthService } = await import('../lib/services/microsoft-auth-service');
      await microsoftAuthService.initialize();
      
      const account = await microsoftAuthService.addAccount({
        email: 'test@example.com',
        displayName: 'Test User',
        accountType: 'work',
      });
      
      expect(account.id).toBeDefined();
      expect(account.email).toBe('test@example.com');
      expect(account.connections).toBeDefined();
    });

    it('should connect service', async () => {
      const { microsoftAuthService } = await import('../lib/services/microsoft-auth-service');
      await microsoftAuthService.initialize();
      const accounts = microsoftAuthService.getAccounts();
      
      if (accounts.length > 0) {
        const result = await microsoftAuthService.connectService(accounts[0].id, 'teams');
        expect(result.success).toBe(true);
      }
    });

    it('should get config', async () => {
      const { microsoftAuthService } = await import('../lib/services/microsoft-auth-service');
      await microsoftAuthService.initialize();
      const config = microsoftAuthService.getConfig();
      
      expect(config.redirectUri).toBeDefined();
      expect(config.scopes).toBeDefined();
    });

    it('should get analytics', async () => {
      const { microsoftAuthService } = await import('../lib/services/microsoft-auth-service');
      await microsoftAuthService.initialize();
      const analytics = microsoftAuthService.getAnalytics();
      
      expect(analytics.totalAccounts).toBeDefined();
      expect(analytics.connectedServices).toBeDefined();
      expect(analytics.byService).toBeDefined();
    });
  });

  describe('UI Screen Files', () => {
    it('should have recording highlights screen file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const screenPath = path.join(process.cwd(), 'app/(tabs)/recording-highlights.tsx');
      expect(fs.existsSync(screenPath)).toBe(true);
    });

    it('should have WACHS health screen file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const screenPath = path.join(process.cwd(), 'app/(tabs)/wachs-health.tsx');
      expect(fs.existsSync(screenPath)).toBe(true);
    });

    it('should have sync rules screen file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const screenPath = path.join(process.cwd(), 'app/(tabs)/sync-rules.tsx');
      expect(fs.existsSync(screenPath)).toBe(true);
    });

    it('should have WACHS deployment screen file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const screenPath = path.join(process.cwd(), 'app/(tabs)/wachs-deployment.tsx');
      expect(fs.existsSync(screenPath)).toBe(true);
    });

    it('should have Microsoft auth screen file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const screenPath = path.join(process.cwd(), 'app/(tabs)/microsoft-auth.tsx');
      expect(fs.existsSync(screenPath)).toBe(true);
    });
  });
});
