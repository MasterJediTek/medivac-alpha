/**
 * MediVac One - Real-time API Connection Service
 * WebSocket connections, live sync, and offline queue processing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  requiresAuth: boolean;
  rateLimit?: number;
  cacheTTL?: number;
}

export interface WebSocketMessage {
  type: 'sync' | 'notification' | 'alert' | 'heartbeat' | 'command' | 'ack';
  channel?: string;
  payload?: unknown;
  timestamp: string;
  messageId: string;
}

export interface SyncOperation {
  id: string;
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  retryCount: number;
  error?: string;
  conflictResolution?: 'server-wins' | 'client-wins' | 'manual';
}

export interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';
  lastConnected?: string;
  lastDisconnected?: string;
  reconnectAttempts: number;
  latency?: number;
}

export interface SyncState {
  lastSyncTime?: string;
  pendingOperations: number;
  failedOperations: number;
  conflictCount: number;
  isSyncing: boolean;
}

export interface APIConfig {
  baseUrl: string;
  wsUrl: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableOfflineQueue: boolean;
  maxOfflineQueueSize: number;
  syncInterval: number;
  heartbeatInterval: number;
}

// ==========================================
// API Endpoints Configuration
// ==========================================

export const API_ENDPOINTS: Record<string, APIEndpoint> = {
  // Authentication
  'auth.login': { path: '/auth/login', method: 'POST', requiresAuth: false },
  'auth.logout': { path: '/auth/logout', method: 'POST', requiresAuth: true },
  'auth.refresh': { path: '/auth/refresh', method: 'POST', requiresAuth: false },
  'auth.me': { path: '/auth/me', method: 'GET', requiresAuth: true, cacheTTL: 300 },

  // Patients
  'patients.list': { path: '/patients', method: 'GET', requiresAuth: true, rateLimit: 100, cacheTTL: 60 },
  'patients.get': { path: '/patients/:id', method: 'GET', requiresAuth: true, cacheTTL: 60 },
  'patients.create': { path: '/patients', method: 'POST', requiresAuth: true },
  'patients.update': { path: '/patients/:id', method: 'PUT', requiresAuth: true },
  'patients.delete': { path: '/patients/:id', method: 'DELETE', requiresAuth: true },
  'patients.search': { path: '/patients/search', method: 'POST', requiresAuth: true, rateLimit: 50 },

  // Vitals
  'vitals.list': { path: '/patients/:patientId/vitals', method: 'GET', requiresAuth: true, cacheTTL: 30 },
  'vitals.create': { path: '/patients/:patientId/vitals', method: 'POST', requiresAuth: true },
  'vitals.latest': { path: '/patients/:patientId/vitals/latest', method: 'GET', requiresAuth: true, cacheTTL: 10 },

  // Orders (CPOE)
  'orders.list': { path: '/orders', method: 'GET', requiresAuth: true, cacheTTL: 30 },
  'orders.get': { path: '/orders/:id', method: 'GET', requiresAuth: true, cacheTTL: 30 },
  'orders.create': { path: '/orders', method: 'POST', requiresAuth: true },
  'orders.update': { path: '/orders/:id', method: 'PUT', requiresAuth: true },
  'orders.verify': { path: '/orders/:id/verify', method: 'POST', requiresAuth: true },
  'orders.cancel': { path: '/orders/:id/cancel', method: 'POST', requiresAuth: true },

  // Medications
  'medications.list': { path: '/medications', method: 'GET', requiresAuth: true, cacheTTL: 300 },
  'medications.patient': { path: '/patients/:patientId/medications', method: 'GET', requiresAuth: true, cacheTTL: 60 },
  'medications.interactions': { path: '/medications/interactions', method: 'POST', requiresAuth: true },

  // Labs/Pathology
  'labs.list': { path: '/labs', method: 'GET', requiresAuth: true, cacheTTL: 60 },
  'labs.patient': { path: '/patients/:patientId/labs', method: 'GET', requiresAuth: true, cacheTTL: 60 },
  'labs.get': { path: '/labs/:id', method: 'GET', requiresAuth: true, cacheTTL: 60 },

  // Appointments
  'appointments.list': { path: '/appointments', method: 'GET', requiresAuth: true, cacheTTL: 30 },
  'appointments.create': { path: '/appointments', method: 'POST', requiresAuth: true },
  'appointments.update': { path: '/appointments/:id', method: 'PUT', requiresAuth: true },
  'appointments.cancel': { path: '/appointments/:id/cancel', method: 'POST', requiresAuth: true },

  // Staff
  'staff.list': { path: '/staff', method: 'GET', requiresAuth: true, cacheTTL: 300 },
  'staff.get': { path: '/staff/:id', method: 'GET', requiresAuth: true, cacheTTL: 300 },
  'staff.schedule': { path: '/staff/:id/schedule', method: 'GET', requiresAuth: true, cacheTTL: 60 },

  // Rooms
  'rooms.list': { path: '/rooms', method: 'GET', requiresAuth: true, cacheTTL: 30 },
  'rooms.status': { path: '/rooms/status', method: 'GET', requiresAuth: true, cacheTTL: 10 },

  // Notifications
  'notifications.list': { path: '/notifications', method: 'GET', requiresAuth: true, cacheTTL: 10 },
  'notifications.markRead': { path: '/notifications/:id/read', method: 'POST', requiresAuth: true },
  'notifications.markAllRead': { path: '/notifications/read-all', method: 'POST', requiresAuth: true },

  // Sync
  'sync.status': { path: '/sync/status', method: 'GET', requiresAuth: true },
  'sync.push': { path: '/sync/push', method: 'POST', requiresAuth: true },
  'sync.pull': { path: '/sync/pull', method: 'POST', requiresAuth: true },
  'sync.conflicts': { path: '/sync/conflicts', method: 'GET', requiresAuth: true },
  'sync.resolve': { path: '/sync/conflicts/:id/resolve', method: 'POST', requiresAuth: true },

  // GP Integration
  'gp.practices': { path: '/gp/practices', method: 'GET', requiresAuth: true, cacheTTL: 300 },
  'gp.import': { path: '/gp/import', method: 'POST', requiresAuth: true },
  'gp.export': { path: '/gp/export', method: 'POST', requiresAuth: true },
  'gp.transfers': { path: '/gp/transfers', method: 'GET', requiresAuth: true, cacheTTL: 30 },

  // Analytics
  'analytics.dashboard': { path: '/analytics/dashboard', method: 'GET', requiresAuth: true, cacheTTL: 60 },
  'analytics.reports': { path: '/analytics/reports', method: 'GET', requiresAuth: true, cacheTTL: 300 },

  // System
  'system.health': { path: '/system/health', method: 'GET', requiresAuth: false, cacheTTL: 10 },
  'system.config': { path: '/system/config', method: 'GET', requiresAuth: true, cacheTTL: 300 },
};

// ==========================================
// Real-time API Service
// ==========================================

class RealtimeAPIService {
  private config: APIConfig = {
    baseUrl: 'https://api.medivac.one/v1',
    wsUrl: 'wss://api.medivac.one/ws',
    version: 'v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableOfflineQueue: true,
    maxOfflineQueueSize: 1000,
    syncInterval: 30000,
    heartbeatInterval: 15000,
  };

  private connectionState: ConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0,
  };

  private syncState: SyncState = {
    pendingOperations: 0,
    failedOperations: 0,
    conflictCount: 0,
    isSyncing: false,
  };

  private offlineQueue: SyncOperation[] = [];
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const [queueData, tokenData] = await Promise.all([
        AsyncStorage.getItem('offline_queue'),
        AsyncStorage.getItem('auth_tokens'),
      ]);

      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        this.syncState.pendingOperations = this.offlineQueue.filter(o => o.status === 'pending').length;
        this.syncState.failedOperations = this.offlineQueue.filter(o => o.status === 'failed').length;
      }

      if (tokenData) {
        const tokens = JSON.parse(tokenData);
        this.authToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
      }
    } catch (error) {
      console.error('Failed to load API state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save API state:', error);
    }
  }

  // ==========================================
  // Connection Management
  // ==========================================

  async connect(): Promise<boolean> {
    if (this.connectionState.status === 'connected') {
      return true;
    }

    this.connectionState.status = 'connecting';
    this.emit('connection:status', this.connectionState);

    try {
      // Simulate WebSocket connection
      await new Promise(resolve => setTimeout(resolve, 500));

      this.connectionState.status = 'connected';
      this.connectionState.lastConnected = new Date().toISOString();
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.latency = Math.floor(Math.random() * 50) + 10;

      this.startHeartbeat();
      this.startSyncTimer();
      this.emit('connection:status', this.connectionState);

      // Process offline queue
      if (this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }

      return true;
    } catch (error) {
      this.connectionState.status = 'error';
      this.emit('connection:status', this.connectionState);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.stopSyncTimer();

    this.connectionState.status = 'disconnected';
    this.connectionState.lastDisconnected = new Date().toISOString();
    this.emit('connection:status', this.connectionState);
  }

  async reconnect(): Promise<boolean> {
    if (this.connectionState.reconnectAttempts >= this.config.retryAttempts) {
      this.connectionState.status = 'error';
      this.emit('connection:status', this.connectionState);
      return false;
    }

    this.connectionState.status = 'reconnecting';
    this.connectionState.reconnectAttempts++;
    this.emit('connection:status', this.connectionState);

    await new Promise(resolve => 
      setTimeout(resolve, this.config.retryDelay * this.connectionState.reconnectAttempts)
    );

    return this.connect();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(): void {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      messageId: `hb_${Date.now()}`,
    };
    this.emit('ws:message', message);
  }

  private startSyncTimer(): void {
    this.stopSyncTimer();
    this.syncTimer = setInterval(() => {
      this.syncAll();
    }, this.config.syncInterval);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  // ==========================================
  // API Request Methods
  // ==========================================

  async request<T>(
    endpointKey: string,
    params?: Record<string, string>,
    body?: unknown,
    options?: { skipCache?: boolean; skipAuth?: boolean }
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const endpoint = API_ENDPOINTS[endpointKey];
    if (!endpoint) {
      return { success: false, error: `Unknown endpoint: ${endpointKey}` };
    }

    // Build URL with params
    let url = `${this.config.baseUrl}${endpoint.path}`;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
      });
    }

    // Check cache
    const cacheKey = `${endpoint.method}:${url}:${JSON.stringify(body || {})}`;
    if (!options?.skipCache && endpoint.cacheTTL && endpoint.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return { success: true, data: cached.data as T };
      }
    }

    // Check if offline
    if (this.connectionState.status !== 'connected') {
      if (endpoint.method !== 'GET' && this.config.enableOfflineQueue) {
        return this.queueOperation(endpointKey, params, body);
      }
      return { success: false, error: 'No connection available' };
    }

    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      // Generate mock response based on endpoint
      const mockData = this.generateMockResponse(endpointKey, params, body);

      // Cache response
      if (endpoint.cacheTTL && endpoint.method === 'GET') {
        this.cache.set(cacheKey, {
          data: mockData,
          expiry: Date.now() + endpoint.cacheTTL * 1000,
        });
      }

      return { success: true, data: mockData as T };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
    }
  }

  private generateMockResponse(
    endpointKey: string,
    params?: Record<string, string>,
    _body?: unknown
  ): unknown {
    switch (endpointKey) {
      case 'system.health':
        return {
          status: 'healthy',
          version: '4.1.0',
          uptime: 86400,
          services: {
            database: 'healthy',
            cache: 'healthy',
            queue: 'healthy',
          },
        };

      case 'sync.status':
        return {
          lastSync: this.syncState.lastSyncTime,
          pendingChanges: this.syncState.pendingOperations,
          conflicts: this.syncState.conflictCount,
        };

      case 'patients.list':
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
        };

      case 'patients.get':
        return {
          id: params?.id,
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-15',
          gender: 'male',
        };

      default:
        return { success: true };
    }
  }

  // ==========================================
  // Offline Queue Management
  // ==========================================

  private queueOperation<T>(
    endpointKey: string,
    params?: Record<string, string>,
    body?: unknown
  ): { success: boolean; data?: T; error?: string } {
    if (this.offlineQueue.length >= this.config.maxOfflineQueueSize) {
      return { success: false, error: 'Offline queue is full' };
    }

    const operation: SyncOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity: endpointKey,
      operation: 'create',
      data: { params, body },
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    this.offlineQueue.push(operation);
    this.syncState.pendingOperations++;
    this.saveState();
    this.emit('queue:updated', this.offlineQueue.length);

    return { success: true, data: { queued: true, operationId: operation.id } as unknown as T };
  }

  async processOfflineQueue(): Promise<{ processed: number; failed: number }> {
    if (this.connectionState.status !== 'connected') {
      return { processed: 0, failed: 0 };
    }

    const pendingOps = this.offlineQueue.filter(o => o.status === 'pending');
    let processed = 0;
    let failed = 0;

    for (const op of pendingOps) {
      op.status = 'syncing';
      this.emit('queue:processing', op.id);

      try {
        const data = op.data as { params?: Record<string, string>; body?: unknown };
        const result = await this.request(op.entity, data.params, data.body, { skipCache: true });

        if (result.success) {
          op.status = 'completed';
          processed++;
        } else {
          op.retryCount++;
          if (op.retryCount >= this.config.retryAttempts) {
            op.status = 'failed';
            op.error = result.error;
            failed++;
          } else {
            op.status = 'pending';
          }
        }
      } catch (error) {
        op.retryCount++;
        op.status = op.retryCount >= this.config.retryAttempts ? 'failed' : 'pending';
        op.error = error instanceof Error ? error.message : 'Unknown error';
        if (op.status === 'failed') failed++;
      }
    }

    // Clean up completed operations
    this.offlineQueue = this.offlineQueue.filter(o => o.status !== 'completed');
    this.syncState.pendingOperations = this.offlineQueue.filter(o => o.status === 'pending').length;
    this.syncState.failedOperations = this.offlineQueue.filter(o => o.status === 'failed').length;
    await this.saveState();

    this.emit('queue:processed', { processed, failed });
    return { processed, failed };
  }

  getOfflineQueue(): SyncOperation[] {
    return [...this.offlineQueue];
  }

  async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    this.syncState.pendingOperations = 0;
    this.syncState.failedOperations = 0;
    await this.saveState();
    this.emit('queue:cleared', null);
  }

  async retryFailedOperations(): Promise<{ processed: number; failed: number }> {
    const failedOps = this.offlineQueue.filter(o => o.status === 'failed');
    failedOps.forEach(op => {
      op.status = 'pending';
      op.retryCount = 0;
      op.error = undefined;
    });
    await this.saveState();
    return this.processOfflineQueue();
  }

  // ==========================================
  // Sync Operations
  // ==========================================

  async syncAll(): Promise<{ success: boolean; changes: number }> {
    if (this.syncState.isSyncing) {
      return { success: false, changes: 0 };
    }

    this.syncState.isSyncing = true;
    this.emit('sync:started', null);

    try {
      // Process offline queue first
      const queueResult = await this.processOfflineQueue();

      // Pull changes from server
      const pullResult = await this.request<{ changes: unknown[] }>('sync.pull', undefined, {
        lastSync: this.syncState.lastSyncTime,
        entities: ['patients', 'vitals', 'orders', 'medications', 'appointments'],
      });

      const changes = (pullResult.data?.changes?.length || 0) + queueResult.processed;

      this.syncState.lastSyncTime = new Date().toISOString();
      this.syncState.isSyncing = false;
      this.emit('sync:completed', { changes });

      return { success: true, changes };
    } catch (error) {
      this.syncState.isSyncing = false;
      this.emit('sync:failed', error);
      return { success: false, changes: 0 };
    }
  }

  async syncEntity(entity: string): Promise<{ success: boolean; changes: number }> {
    const result = await this.request<{ changes: unknown[] }>('sync.pull', undefined, {
      lastSync: this.syncState.lastSyncTime,
      entities: [entity],
    });

    return {
      success: result.success,
      changes: result.data?.changes?.length || 0,
    };
  }

  // ==========================================
  // Conflict Resolution
  // ==========================================

  async getConflicts(): Promise<SyncOperation[]> {
    return this.offlineQueue.filter(o => o.status === 'conflict');
  }

  async resolveConflict(
    operationId: string,
    resolution: 'server-wins' | 'client-wins' | 'manual',
    manualData?: unknown
  ): Promise<boolean> {
    const operation = this.offlineQueue.find(o => o.id === operationId);
    if (!operation || operation.status !== 'conflict') {
      return false;
    }

    operation.conflictResolution = resolution;
    if (resolution === 'manual' && manualData) {
      operation.data = manualData as Record<string, unknown>;
    }
    operation.status = 'pending';
    operation.retryCount = 0;

    this.syncState.conflictCount--;
    await this.saveState();
    this.emit('conflict:resolved', operationId);

    return true;
  }

  // ==========================================
  // Event Emitter
  // ==========================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // ==========================================
  // Authentication
  // ==========================================

  async setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.authToken = accessToken;
    this.refreshToken = refreshToken;
    await AsyncStorage.setItem('auth_tokens', JSON.stringify({ accessToken, refreshToken }));
  }

  async clearAuthTokens(): Promise<void> {
    this.authToken = null;
    this.refreshToken = null;
    await AsyncStorage.removeItem('auth_tokens');
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // ==========================================
  // Configuration
  // ==========================================

  getConfig(): APIConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<APIConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart timers if intervals changed
    if (updates.heartbeatInterval && this.connectionState.status === 'connected') {
      this.startHeartbeat();
    }
    if (updates.syncInterval && this.connectionState.status === 'connected') {
      this.startSyncTimer();
    }
  }

  // ==========================================
  // Cache Management
  // ==========================================

  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared', null);
  }

  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).filter(v => v.expiry > Date.now()).length,
    };
  }
}

export const realtimeAPI = new RealtimeAPIService();
