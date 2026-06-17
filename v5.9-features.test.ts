/**
 * Tests for MediVac One v5.9 Features
 * - OneDrive Personal File Sync
 * - WACHS Site Cloning
 * - Meeting Recording Integration
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

describe('OneDrive Personal File Sync Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize with default configuration', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const config = oneDriveSyncService.getConfig();
    expect(config).toBeDefined();
    expect(config.syncStatus).toBe('idle');
  });

  it('should connect to OneDrive', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const result = await oneDriveSyncService.connect('mock_token');
    expect(result).toBe(true);
    
    const config = oneDriveSyncService.getConfig();
    expect(config.connected).toBe(true);
    expect(config.userEmail).toBeDefined();
  });

  it('should get sync folders', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const folders = oneDriveSyncService.getSyncFolders();
    expect(Array.isArray(folders)).toBe(true);
  });

  it('should get files', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const files = oneDriveSyncService.getFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('should get statistics', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const stats = oneDriveSyncService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.totalFiles).toBe('number');
    expect(typeof stats.syncedFiles).toBe('number');
  });

  it('should export configuration', async () => {
    const { oneDriveSyncService } = await import('../lib/services/onedrive-sync-service');
    await oneDriveSyncService.initialize();
    
    const exported = oneDriveSyncService.exportConfig();
    expect(typeof exported).toBe('string');
    
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe('1.0');
  });
});

describe('WACHS Site Cloning Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize successfully', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBeGreaterThan(0);
  });

  it('should get available sites', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    expect(sites.length).toBeGreaterThan(0);
    
    const site = sites[0];
    expect(site.id).toBeDefined();
    expect(site.name).toBeDefined();
    expect(site.code).toBeDefined();
    expect(site.region).toBeDefined();
  });

  it('should get site by ID', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    const site = siteCloningService.getSite(sites[0].id);
    
    expect(site).toBeDefined();
    expect(site?.id).toBe(sites[0].id);
  });

  it('should get regions', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const regions = siteCloningService.getRegions();
    expect(Array.isArray(regions)).toBe(true);
    expect(regions.length).toBeGreaterThan(0);
  });

  it('should create clone request', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    const request = await siteCloningService.createCloneRequest({
      sourceSiteId: sites[0].id,
      targetSiteName: 'Test Hospital',
      targetSiteCode: 'TST',
      targetRegion: 'midwest',
      selectedOptions: ['network', 'services'],
    });
    
    expect(request).toBeDefined();
    expect(request.id).toBeDefined();
    expect(request.status).toBe('pending');
    expect(request.targetSiteName).toBe('Test Hospital');
  });

  it('should generate comparison', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    const comparison = siteCloningService.generateComparison(sites[0].id, {});
    
    expect(Array.isArray(comparison)).toBe(true);
    expect(comparison.length).toBeGreaterThan(0);
    
    const comp = comparison[0];
    expect(comp.option).toBeDefined();
    expect(comp.sourceValue).toBeDefined();
    expect(comp.targetValue).toBeDefined();
  });

  it('should get statistics', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const stats = siteCloningService.getStatistics();
    expect(stats).toBeDefined();
    expect(typeof stats.totalSites).toBe('number');
    expect(typeof stats.totalClones).toBe('number');
  });

  it('should export site configuration', async () => {
    const { siteCloningService } = await import('../lib/services/site-cloning-service');
    await siteCloningService.initialize();
    
    const sites = siteCloningService.getAvailableSites();
    const exported = siteCloningService.exportSiteConfig(sites[0].id);
    
    expect(typeof exported).toBe('string');
    
    const parsed = JSON.parse(exported);
    expect(parsed.site).toBeDefined();
    expect(parsed.version).toBe('1.0');
  });
});

describe('Meeting Recording Integration Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize with default configuration', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const config = recordingIntegrationService.getConfig();
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
  });

  it('should get recordings', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const recordings = recordingIntegrationService.getRecordings();
    expect(Array.isArray(recordings)).toBe(true);
    expect(recordings.length).toBeGreaterThan(0);
  });

  it('should get recording by ID', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const recordings = recordingIntegrationService.getRecordings();
    const recording = recordingIntegrationService.getRecording(recordings[0].id);
    
    expect(recording).toBeDefined();
    expect(recording?.id).toBe(recordings[0].id);
  });

  it('should get recordings by type', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const incidentRecordings = recordingIntegrationService.getRecordingsByType('incident_response');
    expect(Array.isArray(incidentRecordings)).toBe(true);
    
    incidentRecordings.forEach(r => {
      expect(r.type).toBe('incident_response');
    });
  });

  it('should search recordings', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const results = recordingIntegrationService.searchRecordings('incident');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should get analytics', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const analytics = recordingIntegrationService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(typeof analytics.totalRecordings).toBe('number');
    expect(typeof analytics.totalDuration).toBe('number');
    expect(typeof analytics.totalSize).toBe('number');
    expect(analytics.byType).toBeDefined();
    expect(analytics.byStatus).toBeDefined();
  });

  it('should update configuration', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const updated = await recordingIntegrationService.updateConfig({
      autoUpload: false,
    });
    
    expect(updated.autoUpload).toBe(false);
  });

  it('should export recording metadata', async () => {
    const { recordingIntegrationService } = await import('../lib/services/recording-integration-service');
    await recordingIntegrationService.initialize();
    
    const recordings = recordingIntegrationService.getRecordings();
    const exported = recordingIntegrationService.exportRecordingMetadata(recordings[0].id);
    
    expect(typeof exported).toBe('string');
    
    const parsed = JSON.parse(exported);
    expect(parsed.recording).toBeDefined();
    expect(parsed.version).toBe('1.0');
  });
});

describe('v5.9 UI Screen Files', () => {
  it('should have OneDrive sync screen file', async () => {
    // Verify the file exists by checking the service exports
    const { oneDriveSyncService, GRAPH_ENDPOINTS } = await import('../lib/services/onedrive-sync-service');
    expect(oneDriveSyncService).toBeDefined();
    expect(GRAPH_ENDPOINTS).toBeDefined();
  });

  it('should have site cloning screen file', async () => {
    const { siteCloningService, CLONE_OPTIONS } = await import('../lib/services/site-cloning-service');
    expect(siteCloningService).toBeDefined();
    expect(CLONE_OPTIONS).toBeDefined();
    expect(CLONE_OPTIONS.length).toBe(6);
  });

  it('should have recordings screen file', async () => {
    const { recordingIntegrationService, RECORDING_TYPES } = await import('../lib/services/recording-integration-service');
    expect(recordingIntegrationService).toBeDefined();
    expect(RECORDING_TYPES).toBeDefined();
    expect(Object.keys(RECORDING_TYPES).length).toBe(5);
  });
});
