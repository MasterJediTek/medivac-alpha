/**
 * Tests for MediVac One v7.1 Features
 * - Mission Voice Chat
 * - Crash Report Templates
 * - CI/CD Teams Notifications
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

import missionVoiceChatService from '../mission-voice-chat-service';
import crashReportTemplateService from '../crash-report-template-service';
import cicdTeamsNotificationService from '../cicd-teams-notification-service';

describe('MediVac One v7.1 Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mission Voice Chat Service', () => {
    it('should initialize successfully', async () => {
      await missionVoiceChatService.initialize();
      expect(missionVoiceChatService).toBeDefined();
    });

    it('should get channels', async () => {
      await missionVoiceChatService.initialize();
      const channels = await missionVoiceChatService.getChannels();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
    });

    it('should get default channels with correct types', async () => {
      await missionVoiceChatService.initialize();
      const channels = await missionVoiceChatService.getChannels();
      
      const missionChannel = channels.find(c => c.type === 'mission');
      const teamChannel = channels.find(c => c.type === 'team');
      const commandChannel = channels.find(c => c.type === 'command');
      const proximityChannel = channels.find(c => c.type === 'proximity');
      
      expect(missionChannel).toBeDefined();
      expect(teamChannel).toBeDefined();
      expect(commandChannel).toBeDefined();
      expect(proximityChannel).toBeDefined();
    });

    it('should create a new channel', async () => {
      await missionVoiceChatService.initialize();
      const channel = await missionVoiceChatService.createChannel(
        'Test Channel',
        'mission',
        'user_test'
      );
      
      expect(channel).toBeDefined();
      expect(channel.name).toBe('Test Channel');
      expect(channel.type).toBe('mission');
      expect(channel.createdBy).toBe('user_test');
    });

    it('should join a channel', async () => {
      await missionVoiceChatService.initialize();
      const channels = await missionVoiceChatService.getChannels();
      const channel = channels[0];
      
      const result = await missionVoiceChatService.joinChannel(
        'user_test',
        'Test User',
        channel.id
      );
      
      expect(result.success).toBe(true);
      expect(result.channel).toBeDefined();
    });

    it('should leave a channel', async () => {
      await missionVoiceChatService.initialize();
      const channels = await missionVoiceChatService.getChannels();
      const channel = channels[0];
      
      await missionVoiceChatService.joinChannel('user_test', 'Test User', channel.id);
      const success = await missionVoiceChatService.leaveChannel('user_test', channel.id);
      
      expect(success).toBe(true);
    });

    it('should get and update settings', async () => {
      await missionVoiceChatService.initialize();
      const settings = await missionVoiceChatService.getSettings();
      
      expect(settings).toBeDefined();
      expect(settings.mode).toBeDefined();
      expect(settings.quality).toBeDefined();
      
      const newSettings = await missionVoiceChatService.updateSettings({
        mode: 'open_mic',
        quality: 'ultra',
      });
      
      expect(newSettings.mode).toBe('open_mic');
      expect(newSettings.quality).toBe('ultra');
    });

    it('should get voice stats', async () => {
      await missionVoiceChatService.initialize();
      const stats = await missionVoiceChatService.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.latency).toBeDefined();
      expect(stats.packetLoss).toBeDefined();
      expect(stats.codec).toBe('opus');
    });

    it('should get analytics', async () => {
      await missionVoiceChatService.initialize();
      const analytics = await missionVoiceChatService.getAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalSessions).toBeDefined();
      expect(analytics.participantsByChannel).toBeDefined();
    });

    it('should create mission channel', async () => {
      await missionVoiceChatService.initialize();
      const channel = await missionVoiceChatService.createMissionChannel(
        'mission_123',
        'Medical Emergency',
        'user_leader'
      );
      
      expect(channel).toBeDefined();
      expect(channel.type).toBe('mission');
      expect(channel.missionId).toBe('mission_123');
    });

    it('should create team channel', async () => {
      await missionVoiceChatService.initialize();
      const channel = await missionVoiceChatService.createTeamChannel(
        'team_alpha',
        'Alpha Squad',
        'user_leader'
      );
      
      expect(channel).toBeDefined();
      expect(channel.type).toBe('team');
      expect(channel.teamId).toBe('team_alpha');
    });
  });

  describe('Crash Report Template Service', () => {
    it('should initialize successfully', async () => {
      await crashReportTemplateService.initialize();
      expect(crashReportTemplateService).toBeDefined();
    });

    it('should get templates', async () => {
      await crashReportTemplateService.initialize();
      const templates = await crashReportTemplateService.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have built-in templates for all major categories', async () => {
      await crashReportTemplateService.initialize();
      const templates = await crashReportTemplateService.getTemplates();
      
      const categories = new Set(templates.map(t => t.category));
      expect(categories.has('ui_crash')).toBe(true);
      expect(categories.has('network_error')).toBe(true);
      expect(categories.has('memory_issue')).toBe(true);
      expect(categories.has('database_error')).toBe(true);
    });

    it('should filter templates by category', async () => {
      await crashReportTemplateService.initialize();
      const uiTemplates = await crashReportTemplateService.getTemplates({ category: 'ui_crash' });
      
      expect(uiTemplates.length).toBeGreaterThan(0);
      expect(uiTemplates.every(t => t.category === 'ui_crash')).toBe(true);
    });

    it('should create a custom template', async () => {
      await crashReportTemplateService.initialize();
      const template = await crashReportTemplateService.createTemplate({
        name: 'Custom Test Template',
        description: 'A test template',
        category: 'general',
        annotations: [],
        forumTitle: 'Test: {{errorType}}',
        forumBodyTemplate: 'Error occurred: {{errorMessage}}',
        severity: 'medium',
        targetForums: ['jedi_masters'],
        tags: ['test', 'custom'],
        isShared: false,
        createdBy: 'user_test',
      });
      
      expect(template).toBeDefined();
      expect(template.name).toBe('Custom Test Template');
      expect(template.isBuiltIn).toBe(false);
    });

    it('should apply a template', async () => {
      await crashReportTemplateService.initialize();
      const templates = await crashReportTemplateService.getTemplates();
      const template = templates[0];
      
      const application = await crashReportTemplateService.applyTemplate(
        template.id,
        'crash_123',
        'screenshot_123',
        'user_test'
      );
      
      expect(application).toBeDefined();
      expect(application?.templateId).toBe(template.id);
      expect(application?.crashId).toBe('crash_123');
    });

    it('should suggest templates based on crash info', async () => {
      await crashReportTemplateService.initialize();
      const suggestions = await crashReportTemplateService.suggestTemplates({
        errorType: 'NetworkError',
        errorMessage: 'Connection timeout',
        tags: ['network', 'timeout'],
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });

    it('should share a template', async () => {
      await crashReportTemplateService.initialize();
      const template = await crashReportTemplateService.createTemplate({
        name: 'Shareable Template',
        description: 'A template to share',
        category: 'general',
        annotations: [],
        forumTitle: 'Shared: {{errorType}}',
        forumBodyTemplate: 'Shared error: {{errorMessage}}',
        severity: 'low',
        targetForums: ['jedi_masters'],
        tags: ['shared'],
        isShared: false,
        createdBy: 'user_test',
      });
      
      const success = await crashReportTemplateService.shareTemplate(template.id);
      expect(success).toBe(true);
      
      const updated = await crashReportTemplateService.getTemplate(template.id);
      expect(updated?.isShared).toBe(true);
    });

    it('should export templates', async () => {
      await crashReportTemplateService.initialize();
      const exported = await crashReportTemplateService.exportTemplates();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should get analytics', async () => {
      await crashReportTemplateService.initialize();
      const analytics = await crashReportTemplateService.getAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalTemplates).toBeGreaterThan(0);
      expect(analytics.byCategory).toBeDefined();
    });

    it('should get categories', () => {
      const categories = crashReportTemplateService.getCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(10);
      expect(categories.some(c => c.value === 'ui_crash')).toBe(true);
    });
  });

  describe('CI/CD Teams Notification Service', () => {
    it('should initialize successfully', async () => {
      await cicdTeamsNotificationService.initialize();
      expect(cicdTeamsNotificationService).toBeDefined();
    });

    it('should get channels', async () => {
      await cicdTeamsNotificationService.initialize();
      const channels = await cicdTeamsNotificationService.getChannels();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
    });

    it('should have default channels configured', async () => {
      await cicdTeamsNotificationService.initialize();
      const channels = await cicdTeamsNotificationService.getChannels();
      
      const buildChannel = channels.find(c => c.name === 'Build Notifications');
      const releaseChannel = channels.find(c => c.name === 'Release Channel');
      const jediChannel = channels.find(c => c.name === 'JEDI Masters');
      
      expect(buildChannel).toBeDefined();
      expect(releaseChannel).toBeDefined();
      expect(jediChannel).toBeDefined();
    });

    it('should create a new channel', async () => {
      await cicdTeamsNotificationService.initialize();
      const channel = await cicdTeamsNotificationService.createChannel({
        name: 'Test Channel',
        webhookUrl: 'https://outlook.office.com/webhook/test',
        teamId: 'team_test',
        teamName: 'Test Team',
        isActive: true,
        notifyOn: ['ready', 'failed'],
        mentionOnFailure: true,
        mentionUsers: ['test@example.com'],
        createdBy: 'user_test',
      });
      
      expect(channel).toBeDefined();
      expect(channel.name).toBe('Test Channel');
      expect(channel.isActive).toBe(true);
    });

    it('should send build notification', async () => {
      await cicdTeamsNotificationService.initialize();
      const notifications = await cicdTeamsNotificationService.sendBuildNotification(
        'build_test_123',
        'ready',
        {
          version: '1.0.0',
          buildNumber: 42,
          platform: 'ios',
          environment: 'staging',
          branch: 'main',
          commitMessage: 'Test commit',
          duration: 180,
          testResults: { passed: 100, failed: 0, total: 100 },
        }
      );
      
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should test channel webhook', async () => {
      await cicdTeamsNotificationService.initialize();
      const channels = await cicdTeamsNotificationService.getChannels();
      const channel = channels[0];
      
      const result = await cicdTeamsNotificationService.testChannel(channel.id);
      expect(result.success).toBe(true);
    });

    it('should toggle channel active state', async () => {
      await cicdTeamsNotificationService.initialize();
      const channels = await cicdTeamsNotificationService.getChannels();
      const channel = channels[0];
      const originalState = channel.isActive;
      
      await cicdTeamsNotificationService.updateChannel(channel.id, { isActive: !originalState });
      const updated = await cicdTeamsNotificationService.getChannel(channel.id);
      
      expect(updated?.isActive).toBe(!originalState);
    });

    it('should get notification history', async () => {
      await cicdTeamsNotificationService.initialize();
      
      // Send a notification first
      await cicdTeamsNotificationService.sendBuildNotification(
        'build_history_test',
        'building',
        {
          version: '1.0.0',
          buildNumber: 1,
          platform: 'android',
          environment: 'dev',
          branch: 'develop',
        }
      );
      
      const notifications = await cicdTeamsNotificationService.getNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should update notification preferences', async () => {
      await cicdTeamsNotificationService.initialize();
      const preference = await cicdTeamsNotificationService.updatePreference(
        'user_test',
        'Test User',
        'test@example.com',
        {
          notifyOnSuccess: true,
          notifyOnFailure: true,
          mentionOnFailure: true,
        }
      );
      
      expect(preference).toBeDefined();
      expect(preference.notifyOnSuccess).toBe(true);
      expect(preference.notifyOnFailure).toBe(true);
    });

    it('should get analytics', async () => {
      await cicdTeamsNotificationService.initialize();
      const analytics = await cicdTeamsNotificationService.getAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.totalNotifications).toBeDefined();
      expect(analytics.deliveryRate).toBeDefined();
      expect(analytics.byStatus).toBeDefined();
    });

    it('should generate adaptive card', async () => {
      await cicdTeamsNotificationService.initialize();
      
      const notifications = await cicdTeamsNotificationService.sendBuildNotification(
        'build_card_test',
        'ready',
        {
          version: '1.0.0',
          buildNumber: 99,
          platform: 'ios',
          environment: 'production',
          branch: 'main',
        }
      );
      
      const card = cicdTeamsNotificationService.generateAdaptiveCard(notifications[0]);
      
      expect(card).toBeDefined();
      expect((card as any)['@type']).toBe('MessageCard');
      expect((card as any).themeColor).toBeDefined();
    });

    it('should retry failed notifications', async () => {
      await cicdTeamsNotificationService.initialize();
      const result = await cicdTeamsNotificationService.retryFailedNotifications();
      
      expect(result).toBeDefined();
      expect(result.retried).toBeDefined();
      expect(result.succeeded).toBeDefined();
      expect(result.failed).toBeDefined();
    });
  });
});
