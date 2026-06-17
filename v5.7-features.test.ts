/**
 * Tests for v5.7 Features
 * - Drill Certification Export
 * - Health Monitoring Webhooks
 * - Report Template Customization
 * - Microsoft Teams Integration
 * - WACHS WAN Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import services after mocking
import { drillCertificateService } from '../lib/services/drill-certificate-service';
import { webhookService, PROVIDER_CONFIG, ALERT_TYPES } from '../lib/services/webhook-service';
import { reportTemplateService, SECTION_LIBRARY } from '../lib/services/report-template-service';
import { teamsIntegrationService, NOTIFICATION_TEMPLATES, AZURE_AD_CONFIG } from '../lib/services/teams-integration-service';
import { wachsWANService, WACHS_REGIONS, AUTH_METHODS } from '../lib/services/wachs-wan-service';

describe('Drill Certificate Service', () => {
  beforeEach(async () => {
    await drillCertificateService.initialize();
  });

  it('should initialize with default templates', async () => {
    const templates = drillCertificateService.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should generate certificate for drill session', async () => {
    const certificate = await drillCertificateService.generateCertificate({
      drillSessionId: 'drill_test',
      scenarioId: 'scenario_1',
      scenarioName: 'Ransomware Response Drill',
      threatType: 'ransomware',
      difficulty: 'advanced',
      userId: 'user_1',
      userName: 'John Smith',
      userRole: 'Security Analyst',
      score: 95,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      duration: 1800,
      stepsCompleted: 10,
      totalSteps: 10,
      hintsUsed: 0,
      errorsCount: 1,
    });

    expect(certificate).toBeDefined();
    expect(certificate.id).toBeDefined();
    expect(certificate.userName).toBe('John Smith');
    expect(certificate.score).toBe(95);
    expect(certificate.status).toBe('generated');
  });

  it('should get certificates by user', async () => {
    await drillCertificateService.generateCertificate({
      drillSessionId: 'drill_1',
      scenarioId: 'scenario_2',
      scenarioName: 'Test Drill',
      threatType: 'phishing',
      difficulty: 'intermediate',
      userId: 'user_jane',
      userName: 'Jane Doe',
      userRole: 'Admin',
      score: 88,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      duration: 1200,
      stepsCompleted: 8,
      totalSteps: 10,
      hintsUsed: 1,
      errorsCount: 2,
    });

    const certificates = drillCertificateService.getCertificates();
    const janeCerts = certificates.filter(c => c.userName === 'Jane Doe');
    expect(janeCerts.length).toBeGreaterThan(0);
    expect(janeCerts[0].userName).toBe('Jane Doe');
  });

  it('should have verifyCertificate method', () => {
    expect(typeof drillCertificateService.verifyCertificate).toBe('function');
  });
});

describe('Webhook Service', () => {
  beforeEach(async () => {
    await webhookService.initialize();
  });

  it('should have provider configurations', () => {
    expect(PROVIDER_CONFIG.slack).toBeDefined();
    expect(PROVIDER_CONFIG.teams).toBeDefined();
    expect(PROVIDER_CONFIG.pagerduty).toBeDefined();
    expect(PROVIDER_CONFIG.discord).toBeDefined();
    expect(PROVIDER_CONFIG.generic).toBeDefined();
  });

  it('should have alert type configurations', () => {
    expect(ALERT_TYPES.smtp_health).toBeDefined();
    expect(ALERT_TYPES.incident_created).toBeDefined();
    expect(ALERT_TYPES.drill_completed).toBeDefined();
  });

  it('should create webhook configuration', async () => {
    const webhook = await webhookService.createWebhook({
      name: 'Test Slack Webhook',
      description: 'Test webhook for alerts',
      provider: 'slack',
      url: 'https://hooks.slack.com/services/SLACK_WEBHOOK_URL_PLACEHOLDER',
      status: 'active',
      enabledAlerts: ['warning', 'critical'],
      enabledSources: [],
      retryEnabled: true,
      maxRetries: 3,
      retryDelaySeconds: 30,
      rateLimitPerMinute: 60,
    });

    expect(webhook).toBeDefined();
    expect(webhook.id).toBeDefined();
    expect(webhook.name).toBe('Test Slack Webhook');
    expect(webhook.provider).toBe('slack');
  });

  it('should get webhook statistics', () => {
    const stats = webhookService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.totalWebhooks).toBe('number');
    expect(typeof stats.activeWebhooks).toBe('number');
    expect(typeof stats.successRate).toBe('number');
  });
});

describe('Report Template Service', () => {
  beforeEach(async () => {
    await reportTemplateService.initialize();
  });

  it('should have section library', () => {
    expect(SECTION_LIBRARY.header).toBeDefined();
    expect(SECTION_LIBRARY.summary).toBeDefined();
    expect(SECTION_LIBRARY.chart).toBeDefined();
    expect(SECTION_LIBRARY.table).toBeDefined();
    expect(SECTION_LIBRARY.footer).toBeDefined();
  });

  it('should get default templates', () => {
    const templates = reportTemplateService.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should create custom template', async () => {
    const template = await reportTemplateService.createTemplate({
      name: 'Custom Report',
      description: 'A custom report template',
      category: 'custom',
      isDefault: false,
      sections: [
        { id: 's1', type: 'header', title: 'Header', order: 0, visible: true, config: {} },
        { id: 's2', type: 'summary', title: 'Summary', order: 1, visible: true, config: {} },
      ],
      styling: {
        primaryColor: '#3B82F6',
        secondaryColor: '#60A5FA',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        headerSize: 24,
        bodySize: 12,
        pageMargin: 40,
        sectionSpacing: 20,
      },
      createdBy: 'test',
    });

    expect(template).toBeDefined();
    expect(template.id).toBeDefined();
    expect(template.name).toBe('Custom Report');
    expect(template.sections.length).toBe(2);
  });

  it('should add section to template', async () => {
    const templates = reportTemplateService.getTemplates();
    const template = templates[0];
    
    const section = await reportTemplateService.addSection(template.id, 'text');
    expect(section).toBeDefined();
    expect(section?.type).toBe('text');
  });

  it('should get template statistics', () => {
    const stats = reportTemplateService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.totalTemplates).toBe('number');
    expect(typeof stats.customTemplates).toBe('number');
  });
});

describe('Teams Integration Service', () => {
  beforeEach(async () => {
    await teamsIntegrationService.initialize();
  });

  it('should have notification templates', () => {
    expect(NOTIFICATION_TEMPLATES.incident).toBeDefined();
    expect(NOTIFICATION_TEMPLATES.compliance).toBeDefined();
    expect(NOTIFICATION_TEMPLATES.drill).toBeDefined();
    expect(NOTIFICATION_TEMPLATES.system).toBeDefined();
  });

  it('should have Azure AD configuration', () => {
    expect(AZURE_AD_CONFIG.authorizeEndpoint).toBeDefined();
    expect(AZURE_AD_CONFIG.tokenEndpoint).toBeDefined();
    expect(AZURE_AD_CONFIG.graphEndpoint).toBeDefined();
    expect(AZURE_AD_CONFIG.defaultScopes.length).toBeGreaterThan(0);
  });

  it('should get initial config', () => {
    const config = teamsIntegrationService.getConfig();
    expect(config).toBeDefined();
    expect(config.status).toBe('disconnected');
    expect(config.scopes.length).toBeGreaterThan(0);
  });

  it('should update configuration', async () => {
    const updated = await teamsIntegrationService.updateConfig({
      tenantId: 'test-tenant-id',
      clientId: 'test-client-id',
    });

    expect(updated.tenantId).toBe('test-tenant-id');
    expect(updated.clientId).toBe('test-client-id');
  });

  it('should add Teams channel', async () => {
    const channel = await teamsIntegrationService.addChannel({
      teamId: 'team_1',
      teamName: 'IT Security',
      channelId: 'channel_1',
      channelName: 'Alerts',
      isDefault: true,
      enabledNotifications: ['incident', 'system'],
    });

    expect(channel).toBeDefined();
    expect(channel.id).toBeDefined();
    expect(channel.teamName).toBe('IT Security');
  });

  it('should get statistics', () => {
    const stats = teamsIntegrationService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.isConnected).toBe('boolean');
    expect(typeof stats.channelCount).toBe('number');
  });
});

describe('WACHS WAN Service', () => {
  beforeEach(async () => {
    await wachsWANService.initialize();
  });

  it('should have WACHS regions', () => {
    expect(WACHS_REGIONS.goldfields).toBeDefined();
    expect(WACHS_REGIONS.great_southern).toBeDefined();
    expect(WACHS_REGIONS.kimberley).toBeDefined();
    expect(WACHS_REGIONS.midwest).toBeDefined();
    expect(WACHS_REGIONS.pilbara).toBeDefined();
    expect(WACHS_REGIONS.south_west).toBeDefined();
    expect(WACHS_REGIONS.wheatbelt).toBeDefined();
  });

  it('should have authentication methods', () => {
    expect(AUTH_METHODS.certificate).toBeDefined();
    expect(AUTH_METHODS.radius).toBeDefined();
    expect(AUTH_METHODS.ldap).toBeDefined();
    expect(AUTH_METHODS.oauth2).toBeDefined();
    expect(AUTH_METHODS.api_key).toBeDefined();
  });

  it('should get initial config', () => {
    const config = wachsWANService.getConfig();
    expect(config).toBeDefined();
    expect(config.status).toBe('disconnected');
    expect(config.networkProtocol).toBe('mpls');
  });

  it('should update configuration', async () => {
    const updated = await wachsWANService.updateConfig({
      organizationId: 'WACHS-001',
      organizationName: 'WA Country Health Service',
      primaryGateway: '10.0.0.1',
    });

    expect(updated.organizationId).toBe('WACHS-001');
    expect(updated.organizationName).toBe('WA Country Health Service');
    expect(updated.primaryGateway).toBe('10.0.0.1');
  });

  it('should get sample sites', () => {
    const sites = wachsWANService.getSites();
    expect(sites.length).toBeGreaterThan(0);
  });

  it('should get sites by region', () => {
    const sites = wachsWANService.getSitesByRegion('south_west');
    expect(sites.length).toBeGreaterThan(0);
    expect(sites[0].region).toBe('south_west');
  });

  it('should get statistics', () => {
    const stats = wachsWANService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.isConnected).toBe('boolean');
    expect(typeof stats.totalSites).toBe('number');
    expect(typeof stats.averageLatency).toBe('number');
  });

  it('should add new site', async () => {
    const site = await wachsWANService.addSite({
      name: 'Test Clinic',
      code: 'TST',
      type: 'clinic',
      region: 'wheatbelt',
      address: '123 Test St, Northam WA',
      ipRange: '10.100.99.0/24',
      gateway: '10.100.99.1',
      vlanId: 199,
      contacts: [],
      services: ['EMR'],
    });

    expect(site).toBeDefined();
    expect(site.id).toBeDefined();
    expect(site.name).toBe('Test Clinic');
    expect(site.status).toBe('disconnected');
  });

  it('should get connection logs', () => {
    const logs = wachsWANService.getLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe('Service File Existence', () => {
  it('should have drill certificate service', () => {
    expect(drillCertificateService).toBeDefined();
    expect(typeof drillCertificateService.initialize).toBe('function');
    expect(typeof drillCertificateService.generateCertificate).toBe('function');
  });

  it('should have webhook service', () => {
    expect(webhookService).toBeDefined();
    expect(typeof webhookService.initialize).toBe('function');
    expect(typeof webhookService.createWebhook).toBe('function');
  });

  it('should have report template service', () => {
    expect(reportTemplateService).toBeDefined();
    expect(typeof reportTemplateService.initialize).toBe('function');
    expect(typeof reportTemplateService.createTemplate).toBe('function');
  });

  it('should have teams integration service', () => {
    expect(teamsIntegrationService).toBeDefined();
    expect(typeof teamsIntegrationService.initialize).toBe('function');
    expect(typeof teamsIntegrationService.getConfig).toBe('function');
  });

  it('should have WACHS WAN service', () => {
    expect(wachsWANService).toBeDefined();
    expect(typeof wachsWANService.initialize).toBe('function');
    expect(typeof wachsWANService.connect).toBe('function');
  });
});
