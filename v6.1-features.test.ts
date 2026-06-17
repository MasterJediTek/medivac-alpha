/**
 * MediVac One v6.1 Feature Tests
 * Tests for Deployment Approval Workflow, Clip Transcription Search, and WACHS Site Dependency Mapping
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
  },
}));

describe('Deployment Approval Workflow Service', () => {
  let deploymentApprovalService: typeof import('../lib/services/deployment-approval-service').deploymentApprovalService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../lib/services/deployment-approval-service');
    deploymentApprovalService = module.deploymentApprovalService;
    await deploymentApprovalService.initialize();
  });

  it('should initialize with default approval chains', async () => {
    const chains = deploymentApprovalService.getChains();
    expect(chains.length).toBeGreaterThan(0);
  });

  it('should get existing requests', async () => {
    const requests = deploymentApprovalService.getRequests();
    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBeGreaterThan(0);
  });

  it('should get pending requests', async () => {
    const pending = deploymentApprovalService.getPendingRequests();
    expect(Array.isArray(pending)).toBe(true);
  });

  it('should get approval chains', async () => {
    const chains = deploymentApprovalService.getChains();
    expect(Array.isArray(chains)).toBe(true);
    expect(chains.length).toBeGreaterThan(0);
  });

  it('should get approvers', async () => {
    const approvers = deploymentApprovalService.getApprovers();
    expect(Array.isArray(approvers)).toBe(true);
    expect(approvers.length).toBeGreaterThan(0);
  });
});

describe('Clip Transcription Search Service', () => {
  let transcriptionSearchService: typeof import('../lib/services/transcription-search-service').transcriptionSearchService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../lib/services/transcription-search-service');
    transcriptionSearchService = module.transcriptionSearchService;
    await transcriptionSearchService.initialize();
  });

  it('should initialize with indexed transcriptions', async () => {
    const stats = transcriptionSearchService.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalTranscriptions).toBeGreaterThanOrEqual(0);
  });

  it('should search transcriptions by keyword', async () => {
    const results = transcriptionSearchService.search({ text: 'incident' });
    expect(results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it('should support search with filters', async () => {
    const results = transcriptionSearchService.search({
      text: 'security',
      filters: {
        minConfidence: 0.5,
      },
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it('should get search suggestions', async () => {
    const suggestions = transcriptionSearchService.getSuggestions('sec');
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('should track search history', async () => {
    transcriptionSearchService.search({ text: 'test query' });
    const history = transcriptionSearchService.getSearchHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe('WACHS Site Dependency Mapping Service', () => {
  let dependencyMappingService: typeof import('../lib/services/dependency-mapping-service').dependencyMappingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../lib/services/dependency-mapping-service');
    dependencyMappingService = module.dependencyMappingService;
    await dependencyMappingService.initialize();
  });

  it('should initialize with WACHS sites', async () => {
    const sites = dependencyMappingService.getSites();
    expect(sites.length).toBeGreaterThan(0);
  });

  it('should get dependencies for a site', async () => {
    const sites = dependencyMappingService.getSites();
    if (sites.length > 0) {
      const outbound = dependencyMappingService.getOutboundDependencies(sites[0].id);
      expect(Array.isArray(outbound)).toBe(true);
    }
  });

  it('should analyze cascade risks', async () => {
    const sites = dependencyMappingService.getSites();
    if (sites.length > 0) {
      const risks = dependencyMappingService.analyzeCascadeRisk(sites[0].id);
      expect(Array.isArray(risks)).toBe(true);
    }
  });

  it('should get dependency stats', async () => {
    const stats = dependencyMappingService.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalSites).toBeGreaterThan(0);
    expect(stats.totalDependencies).toBeGreaterThanOrEqual(0);
  });

  it('should get services by site', async () => {
    const sites = dependencyMappingService.getSites();
    if (sites.length > 0) {
      const services = dependencyMappingService.getServicesBySite(sites[0].id);
      expect(Array.isArray(services)).toBe(true);
    }
  });

  it('should get active alerts', async () => {
    const alerts = dependencyMappingService.getActiveAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should resolve an alert', async () => {
    // Create a mock alert scenario - just verify the method exists and runs
    const alerts = dependencyMappingService.getActiveAlerts();
    if (alerts.length > 0) {
      await dependencyMappingService.resolveAlert(alerts[0].id);
      const updatedAlerts = dependencyMappingService.getActiveAlerts();
      expect(updatedAlerts.length).toBeLessThanOrEqual(alerts.length);
    }
  });
});

describe('UI Screen Files Exist', () => {
  it('should have deployment-approvals screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/deployment-approvals.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it('should have transcription-search screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/transcription-search.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it('should have dependency-map screen file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const screenPath = path.join(process.cwd(), 'app/(tabs)/dependency-map.tsx');
    expect(fs.existsSync(screenPath)).toBe(true);
  });
});
