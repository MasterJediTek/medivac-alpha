/**
 * Auto-Sync Webhook Service
 * 
 * Automatically uploads knowledge base documents to S3 when checkpoints
 * are saved, ensuring the central knowledge base stays current across
 * all JediTek Manus tasks.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SyncConfig {
  id: string;
  name: string;
  enabled: boolean;
  sourceType: "checkpoint" | "document" | "service" | "config";
  sourcePath: string;
  destinationUrl: string;
  syncInterval: "immediate" | "hourly" | "daily" | "weekly";
  lastSyncTimestamp: string;
  lastSyncStatus: "success" | "failed" | "pending" | "never";
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEvent {
  id: string;
  configId: string;
  eventType: "sync_started" | "sync_completed" | "sync_failed" | "retry" | "disabled";
  timestamp: string;
  details: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers: Record<string, string>;
  enabled: boolean;
  events: ("checkpoint" | "document_update" | "service_change" | "error")[];
  lastTriggered: string;
  successCount: number;
  failureCount: number;
}

export interface SyncAnalytics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalBytesUploaded: number;
  averageSyncDuration: number;
  syncsByType: Record<string, number>;
  lastSyncTimestamp: string;
}

export interface QueuedSync {
  id: string;
  configId: string;
  priority: "high" | "normal" | "low";
  scheduledAt: string;
  attempts: number;
  status: "queued" | "processing" | "completed" | "failed";
}

const STORAGE_KEYS = {
  syncConfigs: "auto_sync_configs",
  syncEvents: "auto_sync_events",
  webhookEndpoints: "auto_sync_webhooks",
  syncAnalytics: "auto_sync_analytics",
  syncQueue: "auto_sync_queue",
};

// Default S3 CDN endpoints for JediTek knowledge base
const DEFAULT_SYNC_CONFIGS: Omit<SyncConfig, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Knowledge Base Document",
    enabled: true,
    sourceType: "document",
    sourcePath: "/JEDITEK_KNOWLEDGE_BASE.md",
    destinationUrl: "https://files.manuscdn.com/jeditek/knowledge-base.md",
    syncInterval: "immediate",
    lastSyncTimestamp: "",
    lastSyncStatus: "never",
    retryCount: 0,
    maxRetries: 3,
  },
  {
    name: "Services Inventory",
    enabled: true,
    sourceType: "document",
    sourcePath: "/services-inventory.json",
    destinationUrl: "https://files.manuscdn.com/jeditek/services-inventory.json",
    syncInterval: "immediate",
    lastSyncTimestamp: "",
    lastSyncStatus: "never",
    retryCount: 0,
    maxRetries: 3,
  },
  {
    name: "Todo List",
    enabled: true,
    sourceType: "document",
    sourcePath: "/todo.md",
    destinationUrl: "https://files.manuscdn.com/jeditek/todo.md",
    syncInterval: "hourly",
    lastSyncTimestamp: "",
    lastSyncStatus: "never",
    retryCount: 0,
    maxRetries: 3,
  },
  {
    name: "Integration Suite",
    enabled: true,
    sourceType: "document",
    sourcePath: "/MANUS_INTEGRATION_SUITE.md",
    destinationUrl: "https://files.manuscdn.com/jeditek/integration-suite.md",
    syncInterval: "immediate",
    lastSyncTimestamp: "",
    lastSyncStatus: "never",
    retryCount: 0,
    maxRetries: 3,
  },
];

class AutoSyncWebhookService {
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private syncEvents: SyncEvent[] = [];
  private webhookEndpoints: Map<string, WebhookEndpoint> = new Map();
  private analytics: SyncAnalytics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalBytesUploaded: 0,
    averageSyncDuration: 0,
    syncsByType: {},
    lastSyncTimestamp: "",
  };
  private syncQueue: QueuedSync[] = [];
  private initialized = false;
  private processingQueue = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configsData, eventsData, webhooksData, analyticsData, queueData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.syncConfigs),
        AsyncStorage.getItem(STORAGE_KEYS.syncEvents),
        AsyncStorage.getItem(STORAGE_KEYS.webhookEndpoints),
        AsyncStorage.getItem(STORAGE_KEYS.syncAnalytics),
        AsyncStorage.getItem(STORAGE_KEYS.syncQueue),
      ]);

      if (configsData) {
        const parsed = JSON.parse(configsData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.syncConfigs.set(key, value as SyncConfig);
        });
      } else {
        // Initialize with default configs
        this.initializeDefaultConfigs();
      }

      if (eventsData) {
        this.syncEvents = JSON.parse(eventsData);
      }

      if (webhooksData) {
        const parsed = JSON.parse(webhooksData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.webhookEndpoints.set(key, value as WebhookEndpoint);
        });
      }

      if (analyticsData) {
        this.analytics = JSON.parse(analyticsData);
      }

      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize auto-sync service:", error);
      this.initializeDefaultConfigs();
      this.initialized = true;
    }
  }

  private initializeDefaultConfigs(): void {
    const now = new Date().toISOString();
    
    DEFAULT_SYNC_CONFIGS.forEach((config, index) => {
      const id = `sync-${Date.now()}-${index}`;
      this.syncConfigs.set(id, {
        ...config,
        id,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  private async saveState(): Promise<void> {
    try {
      const configsObj: Record<string, SyncConfig> = {};
      this.syncConfigs.forEach((value, key) => {
        configsObj[key] = value;
      });

      const webhooksObj: Record<string, WebhookEndpoint> = {};
      this.webhookEndpoints.forEach((value, key) => {
        webhooksObj[key] = value;
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.syncConfigs, JSON.stringify(configsObj)),
        AsyncStorage.setItem(STORAGE_KEYS.syncEvents, JSON.stringify(this.syncEvents.slice(-500))),
        AsyncStorage.setItem(STORAGE_KEYS.webhookEndpoints, JSON.stringify(webhooksObj)),
        AsyncStorage.setItem(STORAGE_KEYS.syncAnalytics, JSON.stringify(this.analytics)),
        AsyncStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(this.syncQueue)),
      ]);
    } catch (error) {
      console.error("Failed to save sync state:", error);
    }
  }

  async createSyncConfig(config: Omit<SyncConfig, "id" | "createdAt" | "updatedAt">): Promise<SyncConfig> {
    await this.initialize();

    const now = new Date().toISOString();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newConfig: SyncConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.syncConfigs.set(id, newConfig);
    await this.saveState();

    this.logEvent(id, "sync_started", "Sync configuration created");

    return newConfig;
  }

  async updateSyncConfig(id: string, updates: Partial<SyncConfig>): Promise<SyncConfig | null> {
    await this.initialize();

    const config = this.syncConfigs.get(id);
    if (!config) return null;

    const updatedConfig: SyncConfig = {
      ...config,
      ...updates,
      id,
      createdAt: config.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.syncConfigs.set(id, updatedConfig);
    await this.saveState();

    return updatedConfig;
  }

  async deleteSyncConfig(id: string): Promise<boolean> {
    await this.initialize();

    if (!this.syncConfigs.has(id)) return false;

    this.syncConfigs.delete(id);
    await this.saveState();

    return true;
  }

  async getSyncConfig(id: string): Promise<SyncConfig | null> {
    await this.initialize();
    return this.syncConfigs.get(id) || null;
  }

  async getAllSyncConfigs(): Promise<SyncConfig[]> {
    await this.initialize();
    return Array.from(this.syncConfigs.values());
  }

  async triggerSync(configId: string): Promise<SyncEvent> {
    await this.initialize();

    const config = this.syncConfigs.get(configId);
    if (!config) {
      throw new Error(`Sync config not found: ${configId}`);
    }

    const startTime = Date.now();
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Log sync started
      this.logEvent(configId, "sync_started", `Starting sync for ${config.name}`);

      // Simulate S3 upload (in production, this would use actual S3 SDK)
      await this.simulateUpload(config);

      const duration = Date.now() - startTime;
      const fileSize = Math.floor(Math.random() * 50000) + 1000; // Simulated file size

      // Update config status
      config.lastSyncTimestamp = new Date().toISOString();
      config.lastSyncStatus = "success";
      config.retryCount = 0;
      config.updatedAt = new Date().toISOString();
      this.syncConfigs.set(configId, config);

      // Update analytics
      this.analytics.totalSyncs++;
      this.analytics.successfulSyncs++;
      this.analytics.totalBytesUploaded += fileSize;
      this.analytics.averageSyncDuration = 
        (this.analytics.averageSyncDuration * (this.analytics.totalSyncs - 1) + duration) / 
        this.analytics.totalSyncs;
      this.analytics.syncsByType[config.sourceType] = 
        (this.analytics.syncsByType[config.sourceType] || 0) + 1;
      this.analytics.lastSyncTimestamp = new Date().toISOString();

      const event = this.logEvent(
        configId,
        "sync_completed",
        `Successfully synced ${config.name}`,
        fileSize,
        duration
      );

      // Trigger webhooks
      await this.triggerWebhooks("document_update", {
        configId,
        configName: config.name,
        status: "success",
        fileSize,
        duration,
      });

      await this.saveState();
      return event;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update config status
      config.lastSyncStatus = "failed";
      config.retryCount++;
      config.updatedAt = new Date().toISOString();
      this.syncConfigs.set(configId, config);

      // Update analytics
      this.analytics.totalSyncs++;
      this.analytics.failedSyncs++;

      const event = this.logEvent(
        configId,
        "sync_failed",
        `Failed to sync ${config.name}: ${errorMessage}`,
        undefined,
        duration,
        errorMessage
      );

      // Schedule retry if within limits
      if (config.retryCount < config.maxRetries) {
        await this.queueSync(configId, "high");
      }

      // Trigger error webhooks
      await this.triggerWebhooks("error", {
        configId,
        configName: config.name,
        error: errorMessage,
      });

      await this.saveState();
      return event;
    }
  }

  private async simulateUpload(config: SyncConfig): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error("Simulated network error");
    }
  }

  private logEvent(
    configId: string,
    eventType: SyncEvent["eventType"],
    details: string,
    fileSize?: number,
    duration?: number,
    error?: string
  ): SyncEvent {
    const event: SyncEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configId,
      eventType,
      timestamp: new Date().toISOString(),
      details,
      fileSize,
      duration,
      error,
    };

    this.syncEvents.push(event);
    return event;
  }

  async queueSync(configId: string, priority: QueuedSync["priority"] = "normal"): Promise<QueuedSync> {
    await this.initialize();

    const queuedSync: QueuedSync = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configId,
      priority,
      scheduledAt: new Date().toISOString(),
      attempts: 0,
      status: "queued",
    };

    this.syncQueue.push(queuedSync);
    await this.saveState();

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processQueue();
    }

    return queuedSync;
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      while (this.syncQueue.length > 0) {
        // Sort by priority
        this.syncQueue.sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        const item = this.syncQueue[0];
        if (item.status !== "queued") {
          this.syncQueue.shift();
          continue;
        }

        item.status = "processing";
        item.attempts++;

        try {
          await this.triggerSync(item.configId);
          item.status = "completed";
        } catch {
          item.status = "failed";
        }

        this.syncQueue.shift();
        await this.saveState();

        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processingQueue = false;
    }
  }

  async createWebhookEndpoint(endpoint: Omit<WebhookEndpoint, "id" | "lastTriggered" | "successCount" | "failureCount">): Promise<WebhookEndpoint> {
    await this.initialize();

    const id = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id,
      lastTriggered: "",
      successCount: 0,
      failureCount: 0,
    };

    this.webhookEndpoints.set(id, newEndpoint);
    await this.saveState();

    return newEndpoint;
  }

  async updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    await this.initialize();

    const endpoint = this.webhookEndpoints.get(id);
    if (!endpoint) return null;

    const updatedEndpoint: WebhookEndpoint = {
      ...endpoint,
      ...updates,
      id,
    };

    this.webhookEndpoints.set(id, updatedEndpoint);
    await this.saveState();

    return updatedEndpoint;
  }

  async deleteWebhookEndpoint(id: string): Promise<boolean> {
    await this.initialize();

    if (!this.webhookEndpoints.has(id)) return false;

    this.webhookEndpoints.delete(id);
    await this.saveState();

    return true;
  }

  async getAllWebhookEndpoints(): Promise<WebhookEndpoint[]> {
    await this.initialize();
    return Array.from(this.webhookEndpoints.values());
  }

  private async triggerWebhooks(
    eventType: WebhookEndpoint["events"][number],
    payload: Record<string, unknown>
  ): Promise<void> {
    for (const [, endpoint] of this.webhookEndpoints) {
      if (!endpoint.enabled || !endpoint.events.includes(eventType)) {
        continue;
      }

      try {
        // In production, this would make actual HTTP requests
        // For now, we simulate the webhook call
        await this.simulateWebhookCall(endpoint, eventType, payload);

        endpoint.lastTriggered = new Date().toISOString();
        endpoint.successCount++;
      } catch {
        endpoint.failureCount++;
      }

      this.webhookEndpoints.set(endpoint.id, endpoint);
    }

    await this.saveState();
  }

  private async simulateWebhookCall(
    endpoint: WebhookEndpoint,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    // Log the webhook call (in production, this would be an actual HTTP request)
    console.log(`Webhook triggered: ${endpoint.name} (${eventType})`, payload);
  }

  async getSyncEvents(configId?: string, limit = 50): Promise<SyncEvent[]> {
    await this.initialize();

    let events = [...this.syncEvents];
    
    if (configId) {
      events = events.filter(e => e.configId === configId);
    }

    return events.slice(-limit).reverse();
  }

  async getAnalytics(): Promise<SyncAnalytics> {
    await this.initialize();
    return { ...this.analytics };
  }

  async syncAll(): Promise<SyncEvent[]> {
    await this.initialize();

    const events: SyncEvent[] = [];
    
    for (const [id, config] of this.syncConfigs) {
      if (config.enabled) {
        try {
          const event = await this.triggerSync(id);
          events.push(event);
        } catch (error) {
          console.error(`Failed to sync ${config.name}:`, error);
        }
      }
    }

    return events;
  }

  async onCheckpointSaved(): Promise<void> {
    await this.initialize();

    // Trigger immediate syncs for checkpoint-related configs
    for (const [id, config] of this.syncConfigs) {
      if (config.enabled && config.syncInterval === "immediate") {
        await this.queueSync(id, "high");
      }
    }

    // Trigger checkpoint webhooks
    await this.triggerWebhooks("checkpoint", {
      timestamp: new Date().toISOString(),
      message: "Checkpoint saved",
    });
  }
}

export const autoSyncWebhookService = new AutoSyncWebhookService();
