/**
 * MediVac One Companion Control Service
 * Mobile companion app for remote control and monitoring via API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// API Types
// ==========================================

export interface APIConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  requiresAuth: boolean;
  rateLimit?: number;
  parameters?: APIParameter[];
  requestBody?: APISchema;
  responseBody?: APISchema;
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
}

export interface APISchema {
  type: string;
  properties?: Record<string, APISchemaProperty>;
  required?: string[];
}

export interface APISchemaProperty {
  type: string;
  description?: string;
  format?: string;
  enum?: string[];
  items?: APISchemaProperty;
}

// ==========================================
// Device Control Types
// ==========================================

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  platform: 'ios' | 'android' | 'web' | 'desktop' | 'tablet';
  status: DeviceStatus;
  lastSeen: string;
  ipAddress?: string;
  location?: DeviceLocation;
  capabilities: DeviceCapabilities;
  settings: DeviceSettings;
  metrics: DeviceMetrics;
}

export type DeviceType = 
  | 'mobile-app'
  | 'desktop-app'
  | 'web-client'
  | 'tablet-app'
  | 'kiosk'
  | 'medical-device'
  | 'iot-sensor';

export type DeviceStatus = 
  | 'online'
  | 'offline'
  | 'idle'
  | 'busy'
  | 'maintenance'
  | 'error';

export interface DeviceLocation {
  facility: string;
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeviceCapabilities {
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
  location: boolean;
  biometrics: boolean;
  nfc: boolean;
  bluetooth: boolean;
  printing: boolean;
  barcodeScan: boolean;
}

export interface DeviceSettings {
  autoSync: boolean;
  syncInterval: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: 'auto' | 'light' | 'dark';
  language: string;
  timezone: string;
  screenTimeout: number;
  kioskMode: boolean;
}

export interface DeviceMetrics {
  batteryLevel?: number;
  storageUsed?: number;
  storageTotal?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  cpuUsage?: number;
  networkType?: string;
  signalStrength?: number;
  uptime?: number;
}

// ==========================================
// Remote Command Types
// ==========================================

export interface RemoteCommand {
  id: string;
  type: CommandType;
  targetDevices: string[];
  payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: CommandStatus;
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
  results: CommandResult[];
}

export type CommandType =
  | 'sync'
  | 'refresh'
  | 'navigate'
  | 'notify'
  | 'alert'
  | 'lock'
  | 'unlock'
  | 'wipe'
  | 'update-settings'
  | 'restart'
  | 'screenshot'
  | 'log-collect'
  | 'execute-script'
  | 'broadcast-message';

export type CommandStatus =
  | 'pending'
  | 'sent'
  | 'acknowledged'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface CommandResult {
  deviceId: string;
  status: 'success' | 'failure' | 'timeout' | 'skipped';
  message?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ==========================================
// Monitoring Types
// ==========================================

export interface SystemHealth {
  overall: HealthStatus;
  components: ComponentHealth[];
  alerts: HealthAlert[];
  lastChecked: string;
}

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface ComponentHealth {
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'storage' | 'external';
  status: HealthStatus;
  latency?: number;
  errorRate?: number;
  details?: Record<string, unknown>;
}

export interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface SystemMetrics {
  timestamp: string;
  requests: {
    total: number;
    successful: number;
    failed: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  activeUsers: number;
  activeSessions: number;
  connectedDevices: number;
  queueDepth: number;
  cacheHitRate: number;
  errorRate: number;
}

// ==========================================
// Notification Types
// ==========================================

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  targetDevices: string[] | 'all';
  priority: 'default' | 'high';
  ttl?: number;
  badge?: number;
  sound?: string;
  image?: string;
  actions?: NotificationAction[];
  scheduledFor?: string;
  sentAt?: string;
  status: NotificationStatus;
  deliveryStats: DeliveryStats;
}

export type NotificationType =
  | 'alert'
  | 'message'
  | 'reminder'
  | 'update'
  | 'emergency'
  | 'system'
  | 'marketing';

export type NotificationStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  icon?: string;
}

export interface DeliveryStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

// ==========================================
// Sync Types
// ==========================================

export interface SyncConfig {
  enabled: boolean;
  interval: number;
  conflictResolution: 'server-wins' | 'client-wins' | 'latest-wins' | 'manual';
  entities: SyncEntity[];
  bandwidth: 'low' | 'normal' | 'high';
  wifiOnly: boolean;
  backgroundSync: boolean;
}

export interface SyncEntity {
  name: string;
  enabled: boolean;
  priority: number;
  direction: 'push' | 'pull' | 'bidirectional';
  batchSize: number;
  lastSync?: string;
}

export interface SyncStatus {
  inProgress: boolean;
  lastSync: string;
  nextSync: string;
  entities: SyncEntityStatus[];
  errors: SyncError[];
}

export interface SyncEntityStatus {
  name: string;
  status: 'synced' | 'syncing' | 'pending' | 'error';
  lastSync: string;
  pendingChanges: number;
  conflicts: number;
}

export interface SyncError {
  entity: string;
  recordId: string;
  error: string;
  timestamp: string;
  retryCount: number;
}

// ==========================================
// Default Configurations
// ==========================================

const DEFAULT_API_CONFIG: APIConfig = {
  baseUrl: 'https://api.medivac.one',
  version: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '4.0.0',
    'X-Platform': 'companion',
  },
};

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  interval: 300000,
  conflictResolution: 'latest-wins',
  entities: [
    { name: 'patients', enabled: true, priority: 1, direction: 'bidirectional', batchSize: 100 },
    { name: 'vitals', enabled: true, priority: 2, direction: 'bidirectional', batchSize: 500 },
    { name: 'orders', enabled: true, priority: 3, direction: 'bidirectional', batchSize: 200 },
    { name: 'medications', enabled: true, priority: 4, direction: 'pull', batchSize: 1000 },
    { name: 'staff', enabled: true, priority: 5, direction: 'pull', batchSize: 100 },
    { name: 'alerts', enabled: true, priority: 6, direction: 'bidirectional', batchSize: 100 },
    { name: 'messages', enabled: true, priority: 7, direction: 'bidirectional', batchSize: 200 },
    { name: 'settings', enabled: true, priority: 8, direction: 'bidirectional', batchSize: 50 },
  ],
  bandwidth: 'normal',
  wifiOnly: false,
  backgroundSync: true,
};

const API_ENDPOINTS: APIEndpoint[] = [
  // Authentication
  {
    path: '/auth/login',
    method: 'POST',
    description: 'Authenticate user and obtain access token',
    requiresAuth: false,
    requestBody: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        deviceId: { type: 'string' },
      },
      required: ['email', 'password'],
    },
  },
  {
    path: '/auth/refresh',
    method: 'POST',
    description: 'Refresh access token',
    requiresAuth: true,
  },
  {
    path: '/auth/logout',
    method: 'POST',
    description: 'Invalidate current session',
    requiresAuth: true,
  },

  // Devices
  {
    path: '/devices',
    method: 'GET',
    description: 'List all connected devices',
    requiresAuth: true,
    parameters: [
      { name: 'status', in: 'query', required: false, type: 'string', description: 'Filter by status' },
      { name: 'type', in: 'query', required: false, type: 'string', description: 'Filter by device type' },
    ],
  },
  {
    path: '/devices/{id}',
    method: 'GET',
    description: 'Get device details',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Device ID' },
    ],
  },
  {
    path: '/devices/{id}/command',
    method: 'POST',
    description: 'Send command to device',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Device ID' },
    ],
    requestBody: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['sync', 'refresh', 'navigate', 'notify', 'lock', 'wipe'] },
        payload: { type: 'object' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
      },
      required: ['type'],
    },
  },

  // Patients
  {
    path: '/patients',
    method: 'GET',
    description: 'List patients',
    requiresAuth: true,
    rateLimit: 100,
    parameters: [
      { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number' },
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Items per page' },
      { name: 'search', in: 'query', required: false, type: 'string', description: 'Search query' },
    ],
  },
  {
    path: '/patients/{id}',
    method: 'GET',
    description: 'Get patient details',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Patient ID' },
    ],
  },
  {
    path: '/patients/{id}/vitals',
    method: 'GET',
    description: 'Get patient vitals history',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Patient ID' },
      { name: 'from', in: 'query', required: false, type: 'string', description: 'Start date' },
      { name: 'to', in: 'query', required: false, type: 'string', description: 'End date' },
    ],
  },

  // Orders (CPOE)
  {
    path: '/orders',
    method: 'GET',
    description: 'List orders',
    requiresAuth: true,
    parameters: [
      { name: 'patientId', in: 'query', required: false, type: 'string', description: 'Filter by patient' },
      { name: 'status', in: 'query', required: false, type: 'string', description: 'Filter by status' },
    ],
  },
  {
    path: '/orders',
    method: 'POST',
    description: 'Create new order',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        patientId: { type: 'string' },
        type: { type: 'string' },
        details: { type: 'object' },
      },
      required: ['patientId', 'type', 'details'],
    },
  },
  {
    path: '/orders/{id}/verify',
    method: 'POST',
    description: 'Verify order',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Order ID' },
    ],
  },

  // Notifications
  {
    path: '/notifications',
    method: 'GET',
    description: 'List notifications',
    requiresAuth: true,
  },
  {
    path: '/notifications',
    method: 'POST',
    description: 'Send notification',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        targetDevices: { type: 'array', items: { type: 'string' } },
        priority: { type: 'string', enum: ['default', 'high'] },
      },
      required: ['type', 'title', 'body'],
    },
  },

  // Sync
  {
    path: '/sync/status',
    method: 'GET',
    description: 'Get sync status',
    requiresAuth: true,
  },
  {
    path: '/sync/push',
    method: 'POST',
    description: 'Push local changes to server',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        changes: { type: 'array' },
      },
      required: ['entity', 'changes'],
    },
  },
  {
    path: '/sync/pull',
    method: 'POST',
    description: 'Pull changes from server',
    requiresAuth: true,
    requestBody: {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        since: { type: 'string', format: 'date-time' },
      },
      required: ['entity'],
    },
  },

  // Health & Monitoring
  {
    path: '/health',
    method: 'GET',
    description: 'Get system health status',
    requiresAuth: false,
  },
  {
    path: '/metrics',
    method: 'GET',
    description: 'Get system metrics',
    requiresAuth: true,
    parameters: [
      { name: 'from', in: 'query', required: false, type: 'string', description: 'Start time' },
      { name: 'to', in: 'query', required: false, type: 'string', description: 'End time' },
      { name: 'interval', in: 'query', required: false, type: 'string', description: 'Aggregation interval' },
    ],
  },
];

// ==========================================
// Companion Control Service Class
// ==========================================

class CompanionControlService {
  private apiConfig: APIConfig;
  private syncConfig: SyncConfig;
  private connectedDevices: ConnectedDevice[] = [];
  private pendingCommands: RemoteCommand[] = [];
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.apiConfig = DEFAULT_API_CONFIG;
    this.syncConfig = DEFAULT_SYNC_CONFIG;
    this.loadConfigs();
  }

  async loadConfigs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medivac_companion_config');
      if (stored) {
        const configs = JSON.parse(stored);
        this.apiConfig = configs.api || this.apiConfig;
        this.syncConfig = configs.sync || this.syncConfig;
        this.authToken = configs.authToken || null;
        this.refreshToken = configs.refreshToken || null;
      }
    } catch (error) {
      console.error('Failed to load companion configs:', error);
    }
  }

  async saveConfigs(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_companion_config', JSON.stringify({
        api: this.apiConfig,
        sync: this.syncConfig,
        authToken: this.authToken,
        refreshToken: this.refreshToken,
      }));
    } catch (error) {
      console.error('Failed to save companion configs:', error);
    }
  }

  // ==========================================
  // API Configuration
  // ==========================================

  getAPIConfig(): APIConfig {
    return { ...this.apiConfig };
  }

  updateAPIConfig(config: Partial<APIConfig>): void {
    this.apiConfig = { ...this.apiConfig, ...config };
    this.saveConfigs();
  }

  getAPIEndpoints(): APIEndpoint[] {
    return [...API_ENDPOINTS];
  }

  getEndpoint(path: string, method: string): APIEndpoint | undefined {
    return API_ENDPOINTS.find(e => e.path === path && e.method === method);
  }

  // ==========================================
  // Authentication
  // ==========================================

  async login(email: string, password: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeRequest('/auth/login', 'POST', {
        email,
        password,
        deviceId,
      });

      if (response.success && response.data) {
        const data = response.data as { accessToken: string; refreshToken: string };
        this.authToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        await this.saveConfigs();
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', 'POST');
    } finally {
      this.authToken = null;
      this.refreshToken = null;
      await this.saveConfigs();
    }
  }

  async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await this.makeRequest('/auth/refresh', 'POST', {
        refreshToken: this.refreshToken,
      });

      if (response.success && response.data) {
        const data = response.data as { accessToken: string; refreshToken: string };
        this.authToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        await this.saveConfigs();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // ==========================================
  // API Request Helper
  // ==========================================

  private async makeRequest(
    path: string,
    method: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const url = new URL(`${this.apiConfig.baseUrl}/${this.apiConfig.version}${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      ...this.apiConfig.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      }

      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          return this.makeRequest(path, method, body, params);
        }
      }

      return { success: false, error: data.message || 'Request failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // ==========================================
  // Device Management
  // ==========================================

  async getConnectedDevices(): Promise<ConnectedDevice[]> {
    const response = await this.makeRequest('/devices', 'GET');
    if (response.success) {
      this.connectedDevices = response.data as ConnectedDevice[];
    }
    return this.connectedDevices;
  }

  async getDevice(id: string): Promise<ConnectedDevice | undefined> {
    const response = await this.makeRequest(`/devices/${id}`, 'GET');
    if (response.success) {
      return response.data as ConnectedDevice;
    }
    return undefined;
  }

  async sendCommand(
    deviceIds: string[],
    type: CommandType,
    payload: Record<string, unknown> = {},
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<RemoteCommand> {
    const command: RemoteCommand = {
      id: `cmd_${Date.now()}`,
      type,
      targetDevices: deviceIds,
      payload,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      results: [],
    };

    for (const deviceId of deviceIds) {
      const response = await this.makeRequest(`/devices/${deviceId}/command`, 'POST', {
        type,
        payload,
        priority,
      });

      command.results.push({
        deviceId,
        status: response.success ? 'success' : 'failure',
        message: response.error,
        timestamp: new Date().toISOString(),
      });
    }

    command.status = command.results.every(r => r.status === 'success') ? 'completed' : 'failed';
    command.completedAt = new Date().toISOString();

    this.pendingCommands.push(command);
    return command;
  }

  async broadcastCommand(
    type: CommandType,
    payload: Record<string, unknown> = {},
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<RemoteCommand> {
    const devices = await this.getConnectedDevices();
    const onlineDevices = devices.filter(d => d.status === 'online');
    return this.sendCommand(onlineDevices.map(d => d.id), type, payload, priority);
  }

  getCommandHistory(): RemoteCommand[] {
    return [...this.pendingCommands];
  }

  // ==========================================
  // Sync Management
  // ==========================================

  getSyncConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  updateSyncConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    this.saveConfigs();
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    const response = await this.makeRequest('/sync/status', 'GET');
    if (response.success) {
      return response.data as SyncStatus;
    }
    return null;
  }

  async syncEntity(entity: string, direction: 'push' | 'pull'): Promise<{ success: boolean; count: number }> {
    const endpoint = direction === 'push' ? '/sync/push' : '/sync/pull';
    const response = await this.makeRequest(endpoint, 'POST', {
      entity,
      since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    if (response.success) {
      const data = response.data as { count: number };
      return { success: true, count: data.count };
    }

    return { success: false, count: 0 };
  }

  async fullSync(): Promise<{ success: boolean; results: Record<string, { success: boolean; count: number }> }> {
    const results: Record<string, { success: boolean; count: number }> = {};

    for (const entity of this.syncConfig.entities) {
      if (!entity.enabled) continue;

      if (entity.direction === 'push' || entity.direction === 'bidirectional') {
        results[`${entity.name}_push`] = await this.syncEntity(entity.name, 'push');
      }

      if (entity.direction === 'pull' || entity.direction === 'bidirectional') {
        results[`${entity.name}_pull`] = await this.syncEntity(entity.name, 'pull');
      }
    }

    const allSuccess = Object.values(results).every(r => r.success);
    return { success: allSuccess, results };
  }

  // ==========================================
  // Notifications
  // ==========================================

  async sendNotification(notification: Omit<PushNotification, 'id' | 'status' | 'sentAt' | 'deliveryStats'>): Promise<PushNotification | null> {
    const response = await this.makeRequest('/notifications', 'POST', notification as Record<string, unknown>);
    if (response.success) {
      return response.data as PushNotification;
    }
    return null;
  }

  async getNotifications(): Promise<PushNotification[]> {
    const response = await this.makeRequest('/notifications', 'GET');
    if (response.success) {
      return response.data as PushNotification[];
    }
    return [];
  }

  // ==========================================
  // Health & Monitoring
  // ==========================================

  async getSystemHealth(): Promise<SystemHealth | null> {
    const response = await this.makeRequest('/health', 'GET');
    if (response.success) {
      return response.data as SystemHealth;
    }
    return null;
  }

  async getSystemMetrics(from?: string, to?: string): Promise<SystemMetrics[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await this.makeRequest('/metrics', 'GET', undefined, params);
    if (response.success) {
      return response.data as SystemMetrics[];
    }
    return [];
  }

  // ==========================================
  // OpenAPI Spec Generation
  // ==========================================

  generateOpenAPISpec(): string {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'MediVac One API',
        description: 'RESTful API for MediVac One Virtual Hospital Management System',
        version: '4.0.0',
        contact: {
          name: 'MediVac One Support',
          email: 'api@medivac.one',
          url: 'https://medivac.one/api-docs',
        },
        license: {
          name: 'Proprietary',
          url: 'https://medivac.one/license',
        },
      },
      servers: [
        {
          url: 'https://api.medivac.one/v1',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.medivac.one/v1',
          description: 'Staging server',
        },
      ],
      tags: [
        { name: 'Authentication', description: 'User authentication and session management' },
        { name: 'Devices', description: 'Connected device management' },
        { name: 'Patients', description: 'Patient records and vitals' },
        { name: 'Orders', description: 'Clinical orders (CPOE)' },
        { name: 'Notifications', description: 'Push notifications' },
        { name: 'Sync', description: 'Data synchronization' },
        { name: 'Health', description: 'System health and monitoring' },
      ],
      paths: this.generatePaths(),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: this.generateSchemas(),
      },
    };

    return JSON.stringify(spec, null, 2);
  }

  private generatePaths(): Record<string, unknown> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const endpoint of API_ENDPOINTS) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const operation: Record<string, unknown> = {
        summary: endpoint.description,
        operationId: this.generateOperationId(endpoint),
        tags: [this.getTagForPath(endpoint.path)],
      };

      if (endpoint.requiresAuth) {
        operation.security = [{ bearerAuth: [] }];
      }

      if (endpoint.parameters) {
        operation.parameters = endpoint.parameters.map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        }));
      }

      if (endpoint.requestBody) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: endpoint.requestBody,
            },
          },
        };
      }

      operation.responses = {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responseBody || { type: 'object' },
            },
          },
        },
        '400': { description: 'Bad request' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Not found' },
        '500': { description: 'Internal server error' },
      };

      paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
    }

    return paths;
  }

  private generateOperationId(endpoint: APIEndpoint): string {
    const parts = endpoint.path.split('/').filter(p => p && !p.startsWith('{'));
    const method = endpoint.method.toLowerCase();
    return `${method}${parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`;
  }

  private getTagForPath(path: string): string {
    const segment = path.split('/')[1];
    const tagMap: Record<string, string> = {
      auth: 'Authentication',
      devices: 'Devices',
      patients: 'Patients',
      orders: 'Orders',
      notifications: 'Notifications',
      sync: 'Sync',
      health: 'Health',
      metrics: 'Health',
    };
    return tagMap[segment] || 'General';
  }

  private generateSchemas(): Record<string, unknown> {
    return {
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          mrn: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          status: { type: 'string' },
        },
      },
      Device: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          platform: { type: 'string' },
          status: { type: 'string' },
          lastSeen: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientId: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          details: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          priority: { type: 'string' },
          status: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    };
  }
}

// Export singleton instance
export const companionControl = new CompanionControlService();

// Export class for custom instances
export { CompanionControlService };
