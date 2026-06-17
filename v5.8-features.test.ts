/**
 * Tests for MediVac One v5.8 Features
 * SharePoint Document Sync, WACHS Site Provisioning Wizard, Teams Meeting Scheduler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import services
import { sharePointSyncService, DOCUMENT_CATEGORIES, GRAPH_ENDPOINTS } from '../lib/services/sharepoint-sync-service';
import { siteProvisioningService, WIZARD_STEPS, AVAILABLE_SERVICES, CONTACT_ROLES } from '../lib/services/site-provisioning-service';
import { teamsMeetingService, MEETING_TYPES } from '../lib/services/teams-meeting-service';

describe('SharePoint Document Sync Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await sharePointSyncService.initialize();
  });

  it('should have document categories defined', () => {
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('compliance');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('policy');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('procedure');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('form');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('report');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('training');
    expect(Object.keys(DOCUMENT_CATEGORIES)).toContain('other');
  });

  it('should have Microsoft Graph endpoints defined', () => {
    expect(GRAPH_ENDPOINTS.sites).toBe('https://graph.microsoft.com/v1.0/sites');
    expect(GRAPH_ENDPOINTS.drives).toBe('https://graph.microsoft.com/v1.0/drives');
    expect(GRAPH_ENDPOINTS.me).toBe('https://graph.microsoft.com/v1.0/me');
  });

  it('should get default configuration', () => {
    const config = sharePointSyncService.getConfig();
    expect(config).toBeDefined();
    expect(config.status).toBe('disconnected');
    expect(config.autoSync).toBe(false);
  });

  it('should update configuration', async () => {
    const updated = await sharePointSyncService.updateConfig({
      tenantId: 'test-tenant-id',
      clientId: 'test-client-id',
      siteUrl: 'https://test.sharepoint.com/sites/medivac',
    });
    expect(updated.tenantId).toBe('test-tenant-id');
    expect(updated.clientId).toBe('test-client-id');
    expect(updated.siteUrl).toBe('https://test.sharepoint.com/sites/medivac');
  });

  it('should get sample libraries', () => {
    const libraries = sharePointSyncService.getLibraries();
    expect(libraries.length).toBeGreaterThan(0);
    expect(libraries[0]).toHaveProperty('id');
    expect(libraries[0]).toHaveProperty('name');
    expect(libraries[0]).toHaveProperty('itemCount');
  });

  it('should get statistics', () => {
    const stats = sharePointSyncService.getStatistics();
    expect(stats).toHaveProperty('isConnected');
    expect(stats).toHaveProperty('totalLibraries');
    expect(stats).toHaveProperty('totalMappings');
    expect(stats).toHaveProperty('successRate');
  });

  it('should export configuration', () => {
    const exported = sharePointSyncService.exportConfig();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('config');
    expect(parsed).toHaveProperty('mappings');
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('version');
  });
});

describe('WACHS Site Provisioning Wizard Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await siteProvisioningService.initialize();
  });

  it('should have wizard steps defined', () => {
    expect(WIZARD_STEPS.length).toBe(6);
    expect(WIZARD_STEPS[0].id).toBe('template');
    expect(WIZARD_STEPS[1].id).toBe('basic');
    expect(WIZARD_STEPS[2].id).toBe('network');
    expect(WIZARD_STEPS[3].id).toBe('services');
    expect(WIZARD_STEPS[4].id).toBe('contacts');
    expect(WIZARD_STEPS[5].id).toBe('review');
  });

  it('should have available services defined', () => {
    expect(AVAILABLE_SERVICES.length).toBeGreaterThan(0);
    const requiredServices = AVAILABLE_SERVICES.filter(s => s.required);
    expect(requiredServices.length).toBeGreaterThan(0);
  });

  it('should have contact roles defined', () => {
    expect(CONTACT_ROLES).toContain('IT Manager');
    expect(CONTACT_ROLES).toContain('Clinical Director');
    expect(CONTACT_ROLES).toContain('Facility Manager');
  });

  it('should get site templates', () => {
    const templates = siteProvisioningService.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('type');
    expect(templates[0]).toHaveProperty('defaultServices');
  });

  it('should create a draft', async () => {
    const draft = await siteProvisioningService.createDraft();
    expect(draft).toBeDefined();
    expect(draft.id).toMatch(/^draft_/);
    expect(draft.currentStep).toBe('template');
    expect(draft.status).toBe('draft');
  });

  it('should create a draft from template', async () => {
    const templates = siteProvisioningService.getTemplates();
    const draft = await siteProvisioningService.createDraft(templates[0].id);
    expect(draft.template).toBeDefined();
    expect(draft.template?.id).toBe(templates[0].id);
    expect(draft.services.selected.length).toBeGreaterThan(0);
  });

  it('should update draft', async () => {
    const draft = await siteProvisioningService.createDraft();
    const updated = await siteProvisioningService.updateDraft(draft.id, {
      basicInfo: {
        ...draft.basicInfo,
        name: 'Test Hospital',
        code: 'TST',
      },
    });
    expect(updated?.basicInfo.name).toBe('Test Hospital');
    expect(updated?.basicInfo.code).toBe('TST');
  });

  it('should complete wizard step', async () => {
    const draft = await siteProvisioningService.createDraft();
    const updated = await siteProvisioningService.completeStep(draft.id, 'template');
    expect(updated?.completedSteps).toContain('template');
    expect(updated?.currentStep).toBe('basic');
  });

  it('should get statistics', () => {
    const stats = siteProvisioningService.getStatistics();
    expect(stats).toHaveProperty('totalTemplates');
    expect(stats).toHaveProperty('activeDrafts');
    expect(stats).toHaveProperty('completedProvisions');
    expect(stats).toHaveProperty('successRate');
  });
});

describe('Teams Meeting Scheduler Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await teamsMeetingService.initialize();
  });

  it('should have meeting types defined', () => {
    expect(Object.keys(MEETING_TYPES)).toContain('incident_response');
    expect(Object.keys(MEETING_TYPES)).toContain('drill_debrief');
    expect(Object.keys(MEETING_TYPES)).toContain('compliance_review');
    expect(Object.keys(MEETING_TYPES)).toContain('training');
    expect(Object.keys(MEETING_TYPES)).toContain('general');
  });

  it('should get meeting templates', () => {
    const templates = teamsMeetingService.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
    expect(templates[0]).toHaveProperty('type');
    expect(templates[0]).toHaveProperty('defaultDuration');
    expect(templates[0]).toHaveProperty('defaultAgenda');
  });

  it('should get staff list', () => {
    const staff = teamsMeetingService.getStaff();
    expect(staff.length).toBeGreaterThan(0);
    expect(staff[0]).toHaveProperty('id');
    expect(staff[0]).toHaveProperty('name');
    expect(staff[0]).toHaveProperty('email');
    expect(staff[0]).toHaveProperty('role');
    expect(staff[0]).toHaveProperty('department');
  });

  it('should get departments', () => {
    const departments = teamsMeetingService.getDepartments();
    expect(departments.length).toBeGreaterThan(0);
    expect(departments).toContain('IT');
    expect(departments).toContain('Clinical');
  });

  it('should create a meeting', async () => {
    const staff = teamsMeetingService.getStaff();
    const meeting = await teamsMeetingService.createMeeting({
      title: 'Test Meeting',
      description: 'Test description',
      type: 'general',
      startTime: new Date(Date.now() + 3600000),
      duration: 30,
      attendees: [staff[0]],
    });
    expect(meeting).toBeDefined();
    expect(meeting.id).toMatch(/^meeting_/);
    expect(meeting.title).toBe('Test Meeting');
    expect(meeting.status).toBe('scheduled');
    expect(meeting.joinUrl).toBeDefined();
  });

  it('should get upcoming meetings', () => {
    const upcoming = teamsMeetingService.getUpcomingMeetings();
    expect(Array.isArray(upcoming)).toBe(true);
  });

  it('should get past meetings', () => {
    const past = teamsMeetingService.getPastMeetings();
    expect(Array.isArray(past)).toBe(true);
  });

  it('should get statistics', () => {
    const stats = teamsMeetingService.getStatistics();
    expect(stats).toHaveProperty('totalMeetings');
    expect(stats).toHaveProperty('upcomingMeetings');
    expect(stats).toHaveProperty('completedMeetings');
    expect(stats).toHaveProperty('averageDuration');
    expect(stats).toHaveProperty('byType');
  });

  it('should export meetings', () => {
    const exported = teamsMeetingService.exportMeetings();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('meetings');
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('version');
  });
});

describe('UI Screen Files Exist', () => {
  it('should have SharePoint Sync screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/sharepoint-sync.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it('should have Site Provisioning screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/site-provisioning.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it('should have Teams Meetings screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/teams-meetings.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });
});
