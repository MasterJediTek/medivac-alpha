/**
 * Tests for MediVac WACHS v8.0 Features
 * - Knowledge Base Search API
 * - Auto-Sync Webhook Service
 * - Portal Health Monitor Service
 * - App Store Distribution Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { knowledgeBaseSearchService, KNOWLEDGE_BASE_URLS } from "../knowledge-base-search-service";
import { autoSyncWebhookService } from "../auto-sync-webhook-service";
import { portalHealthMonitorService, JEDITEK_PORTALS } from "../portal-health-monitor-service";
import { appStoreDistributionService } from "../app-store-distribution-service";

describe("Knowledge Base Search Service", () => {
  beforeEach(async () => {
    await knowledgeBaseSearchService.initialize();
  });

  it("should have all knowledge base URLs defined", () => {
    expect(KNOWLEDGE_BASE_URLS.knowledgeBase).toBeDefined();
    expect(KNOWLEDGE_BASE_URLS.servicesInventory).toBeDefined();
    expect(KNOWLEDGE_BASE_URLS.integrationSuite).toBeDefined();
  });

  it("should return document URLs", () => {
    const urls = knowledgeBaseSearchService.getAllDocumentUrls();
    expect(urls).toHaveProperty("knowledgeBase");
    expect(urls).toHaveProperty("servicesInventory");
  });

  it("should get specific document URL", () => {
    const url = knowledgeBaseSearchService.getDocumentUrl("knowledgeBase");
    expect(url).toContain("manuscdn.com");
  });

  it("should perform search and return results", async () => {
    // Search uses local index, doesn't require network
    const results = await knowledgeBaseSearchService.search({
      query: "test",
      maxResults: 5,
      documentTypes: [], // Empty to avoid fetching
    });
    expect(Array.isArray(results)).toBe(true);
  }, 10000);

  it("should get search history", async () => {
    const history = await knowledgeBaseSearchService.getSearchHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should get search analytics", async () => {
    const analytics = await knowledgeBaseSearchService.getAnalytics();
    expect(analytics).toHaveProperty("totalSearches");
    expect(analytics).toHaveProperty("popularQueries");
  });

  it("should get search suggestions", async () => {
    const suggestions = await knowledgeBaseSearchService.getSuggestions("med");
    expect(Array.isArray(suggestions)).toBe(true);
  });
});

describe("Auto-Sync Webhook Service", () => {
  beforeEach(async () => {
    await autoSyncWebhookService.initialize();
  });

  it("should get all sync configs", async () => {
    const configs = await autoSyncWebhookService.getAllSyncConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  it("should create sync config", async () => {
    const config = await autoSyncWebhookService.createSyncConfig({
      name: "Test Sync",
      enabled: true,
      sourceType: "document",
      sourcePath: "/test.md",
      destinationUrl: "https://example.com/test.md",
      syncInterval: "hourly",
      lastSyncTimestamp: "",
      lastSyncStatus: "never",
      retryCount: 0,
      maxRetries: 3,
    });
    expect(config.id).toBeDefined();
    expect(config.name).toBe("Test Sync");
  });

  it("should get sync events", async () => {
    const events = await autoSyncWebhookService.getSyncEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("should get sync analytics", async () => {
    const analytics = await autoSyncWebhookService.getAnalytics();
    expect(analytics).toHaveProperty("totalSyncs");
    expect(analytics).toHaveProperty("successfulSyncs");
    expect(analytics).toHaveProperty("failedSyncs");
  });

  it("should create webhook endpoint", async () => {
    const endpoint = await autoSyncWebhookService.createWebhookEndpoint({
      name: "Test Webhook",
      url: "https://example.com/webhook",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      enabled: true,
      events: ["checkpoint", "document_update"],
    });
    expect(endpoint.id).toBeDefined();
    expect(endpoint.name).toBe("Test Webhook");
  });

  it("should get all webhook endpoints", async () => {
    const endpoints = await autoSyncWebhookService.getAllWebhookEndpoints();
    expect(Array.isArray(endpoints)).toBe(true);
  });
});

describe("Portal Health Monitor Service", () => {
  beforeEach(async () => {
    await portalHealthMonitorService.initialize();
  });

  it("should have all JediTek portals defined", () => {
    expect(JEDITEK_PORTALS.main).toBeDefined();
    expect(JEDITEK_PORTALS.wongi).toBeDefined();
    expect(JEDITEK_PORTALS.nexusBeacon).toBeDefined();
    expect(JEDITEK_PORTALS.alphaPrime).toBeDefined();
  });

  it("should get all health statuses", async () => {
    const statuses = await portalHealthMonitorService.getAllHealthStatuses();
    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it("should get health status for specific portal", async () => {
    const status = await portalHealthMonitorService.getHealthStatus("main");
    expect(status).toBeDefined();
    expect(status?.portalId).toBe("main");
  });

  it("should get portal info", () => {
    const info = portalHealthMonitorService.getPortalInfo("main");
    expect(info).toBeDefined();
    expect(info?.name).toBe("JediTek Main");
    expect(info?.url).toBe("https://jeditek.com.au");
  });

  it("should get all portals", () => {
    const portals = portalHealthMonitorService.getAllPortals();
    expect(portals).toHaveProperty("main");
    expect(portals).toHaveProperty("wongi");
  });

  it("should check portal health", async () => {
    const check = await portalHealthMonitorService.checkPortal("main");
    expect(check).toHaveProperty("id");
    expect(check).toHaveProperty("portalId");
    expect(check).toHaveProperty("status");
    expect(check).toHaveProperty("responseTime");
  });

  it("should get recent checks", async () => {
    const checks = await portalHealthMonitorService.getRecentChecks();
    expect(Array.isArray(checks)).toBe(true);
  });

  it("should get alerts", async () => {
    const alerts = await portalHealthMonitorService.getAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should get monitoring config", async () => {
    const config = await portalHealthMonitorService.getConfig();
    expect(config).toHaveProperty("enabled");
    expect(config).toHaveProperty("checkInterval");
    expect(config).toHaveProperty("timeoutMs");
  });

  it("should get health analytics", async () => {
    const analytics = await portalHealthMonitorService.getAnalytics();
    expect(analytics).toHaveProperty("totalChecks");
    expect(analytics).toHaveProperty("healthyChecks");
    expect(analytics).toHaveProperty("uptimeByPortal");
  });

  it("should get overall health summary", async () => {
    const health = await portalHealthMonitorService.getOverallHealth();
    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("healthyCount");
    expect(health).toHaveProperty("totalCount");
    expect(health).toHaveProperty("averageUptime");
  });

  it("should get health statuses by category", async () => {
    const primaryStatuses = await portalHealthMonitorService.getHealthStatusesByCategory("primary");
    expect(Array.isArray(primaryStatuses)).toBe(true);
  });
});

describe("App Store Distribution Service", () => {
  beforeEach(async () => {
    await appStoreDistributionService.initialize();
  });

  it("should get app metadata", async () => {
    const metadata = await appStoreDistributionService.getMetadata();
    expect(metadata.appName).toBe("MediVac WACHS");
    expect(metadata.developerName).toBe("JediTek Pty Ltd");
    expect(metadata.category).toBe("Medical");
  });

  it("should get app assets", async () => {
    const assets = await appStoreDistributionService.getAssets();
    expect(assets).toHaveProperty("icon");
    expect(assets).toHaveProperty("screenshots");
  });

  it("should get all store configs", async () => {
    const configs = await appStoreDistributionService.getAllStoreConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBe(3); // Google Play, Apple, Microsoft
  });

  it("should get specific store config", async () => {
    const config = await appStoreDistributionService.getStoreConfig("google_play");
    expect(config).toBeDefined();
    expect(config?.store).toBe("google_play");
  });

  it("should get store requirements", () => {
    const googleReqs = appStoreDistributionService.getStoreRequirements("google_play");
    expect(googleReqs.iconSize).toBe("512x512");
    expect(googleReqs.maxDescriptionLength).toBe(4000);

    const appleReqs = appStoreDistributionService.getStoreRequirements("apple_app_store");
    expect(appleReqs.iconSize).toBe("1024x1024");

    const msReqs = appStoreDistributionService.getStoreRequirements("microsoft_store");
    expect(msReqs.iconSize).toBe("1240x1240");
  });

  it("should validate metadata for each store", () => {
    const googleValidation = appStoreDistributionService.validateMetadata("google_play");
    expect(googleValidation).toHaveProperty("valid");
    expect(googleValidation).toHaveProperty("errors");

    const appleValidation = appStoreDistributionService.validateMetadata("apple_app_store");
    expect(appleValidation).toHaveProperty("valid");

    const msValidation = appStoreDistributionService.validateMetadata("microsoft_store");
    expect(msValidation).toHaveProperty("valid");
  });

  it("should create submission", async () => {
    const submission = await appStoreDistributionService.createSubmission("google_play");
    expect(submission.id).toBeDefined();
    expect(submission.store).toBe("google_play");
    expect(submission.status).toBe("draft");
    expect(submission.metadata.appName).toBe("MediVac WACHS");
  });

  it("should get submissions", async () => {
    const submissions = await appStoreDistributionService.getSubmissions();
    expect(Array.isArray(submissions)).toBe(true);
  });

  it("should get distribution analytics", async () => {
    const analytics = await appStoreDistributionService.getAnalytics();
    expect(analytics).toHaveProperty("totalSubmissions");
    expect(analytics).toHaveProperty("approvedSubmissions");
    expect(analytics).toHaveProperty("submissionsByStore");
  });

  it("should generate store listing preview", async () => {
    const preview = await appStoreDistributionService.generateStoreListingPreview("google_play");
    expect(preview).toContain("MediVac WACHS");
    expect(preview).toContain("JediTek");
  });

  it("should update metadata", async () => {
    const updated = await appStoreDistributionService.updateMetadata({
      version: "8.0.1",
    });
    expect(updated.version).toBe("8.0.1");
  });
});

describe("MediVac WACHS Branding", () => {
  it("should have correct app name in metadata", async () => {
    const metadata = await appStoreDistributionService.getMetadata();
    expect(metadata.appName).toBe("MediVac WACHS");
  });

  it("should have WACHS-specific description", async () => {
    const metadata = await appStoreDistributionService.getMetadata();
    expect(metadata.fullDescription).toContain("Western Australian Country Health Service");
    expect(metadata.fullDescription).toContain("WACHS");
  });

  it("should have correct keywords for healthcare", async () => {
    const metadata = await appStoreDistributionService.getMetadata();
    expect(metadata.keywords).toContain("healthcare");
    expect(metadata.keywords).toContain("WACHS");
    expect(metadata.keywords).toContain("Western Australia");
    expect(metadata.keywords).toContain("medical");
  });

  it("should have JediTek developer information", async () => {
    const metadata = await appStoreDistributionService.getMetadata();
    expect(metadata.developerName).toBe("JediTek Pty Ltd");
    expect(metadata.developerWebsite).toBe("https://jeditek.com.au");
  });
});
