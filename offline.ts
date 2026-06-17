/**
 * MediVac One - Offline Mode Service
 * Network detection, action queue, and automatic sync on reconnection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
// Simple event emitter implementation for React Native compatibility
class SimpleEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Types
export type ActionType = 
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'CREATE_APPOINTMENT'
  | 'UPDATE_APPOINTMENT'
  | 'DELETE_APPOINTMENT'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'CREATE_NOTE'
  | 'UPDATE_VITALS'
  | 'SEND_MESSAGE'
  | 'SYNC_JEDI'
  | 'SYNC_O365';

export type ActionStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';

export interface QueuedAction {
  id: string;
  type: ActionType;
  payload: Record<string, any>;
  timestamp: string;
  status: ActionStatus;
  retryCount: number;
  maxRetries: number;
  error?: string;
  conflictData?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  lastOnlineAt: string | null;
  pendingActionsCount: number;
  isSyncing: boolean;
  syncProgress: number;
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictResolution {
  actionId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: Record<string, any>;
}

// Storage Keys
const STORAGE_KEYS = {
  ACTION_QUEUE: 'medivac_offline_action_queue',
  OFFLINE_STATE: 'medivac_offline_state',
  SYNC_LOG: 'medivac_sync_log',
  CACHED_DATA: 'medivac_cached_data',
};

// Event Emitter for state changes
const offlineEvents = new SimpleEventEmitter();

// Current state
let currentState: OfflineState = {
  isOnline: true,
  isConnected: true,
  connectionType: null,
  lastOnlineAt: null,
  pendingActionsCount: 0,
  isSyncing: false,
  syncProgress: 0,
};

let netInfoSubscription: NetInfoSubscription | null = null;
let syncInProgress = false;

/**
 * Initialize offline mode service
 */
export async function initializeOfflineMode(): Promise<void> {
  // Load saved state
  try {
    const savedState = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_STATE);
    if (savedState) {
      currentState = { ...currentState, ...JSON.parse(savedState) };
    }
  } catch (error) {
    console.error('Error loading offline state:', error);
  }

  // Get initial network state
  const netState = await NetInfo.fetch();
  updateNetworkState(netState);

  // Subscribe to network changes
  netInfoSubscription = NetInfo.addEventListener(handleNetworkChange);

  // Count pending actions
  await updatePendingCount();
}

/**
 * Cleanup offline mode service
 */
export function cleanupOfflineMode(): void {
  if (netInfoSubscription) {
    netInfoSubscription();
    netInfoSubscription = null;
  }
}

/**
 * Handle network state changes
 */
function handleNetworkChange(state: NetInfoState): void {
  const wasOnline = currentState.isOnline;
  updateNetworkState(state);

  // Emit events
  offlineEvents.emit('networkChange', currentState);

  // If coming back online, trigger sync
  if (!wasOnline && currentState.isOnline) {
    offlineEvents.emit('online');
    triggerSync();
  } else if (wasOnline && !currentState.isOnline) {
    offlineEvents.emit('offline');
  }
}

/**
 * Update network state
 */
function updateNetworkState(netState: NetInfoState): void {
  const isOnline = netState.isConnected === true && netState.isInternetReachable === true;
  
  currentState = {
    ...currentState,
    isOnline,
    isConnected: netState.isConnected === true,
    connectionType: netState.type,
    lastOnlineAt: isOnline ? new Date().toISOString() : currentState.lastOnlineAt,
  };

  // Save state
  AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_STATE, JSON.stringify(currentState)).catch(console.error);
}

/**
 * Get current offline state
 */
export function getOfflineState(): OfflineState {
  return { ...currentState };
}

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return currentState.isOnline;
}

/**
 * Add action to queue
 */
export async function queueAction(
  type: ActionType,
  payload: Record<string, any>,
  priority: QueuedAction['priority'] = 'normal'
): Promise<string> {
  const action: QueuedAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    maxRetries: 3,
    priority,
  };

  const queue = await getActionQueue();
  queue.push(action);
  
  // Sort by priority and timestamp
  queue.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  await saveActionQueue(queue);
  await updatePendingCount();

  offlineEvents.emit('actionQueued', action);

  // If online, trigger immediate sync
  if (currentState.isOnline && !syncInProgress) {
    triggerSync();
  }

  return action.id;
}

/**
 * Get action queue
 */
export async function getActionQueue(): Promise<QueuedAction[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTION_QUEUE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading action queue:', error);
  }
  return [];
}

/**
 * Save action queue
 */
async function saveActionQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTION_QUEUE, JSON.stringify(queue));
}

/**
 * Update pending actions count
 */
async function updatePendingCount(): Promise<void> {
  const queue = await getActionQueue();
  currentState.pendingActionsCount = queue.filter(
    a => a.status === 'pending' || a.status === 'failed'
  ).length;
  offlineEvents.emit('pendingCountChange', currentState.pendingActionsCount);
}

/**
 * Trigger sync process
 */
export async function triggerSync(): Promise<SyncResult> {
  if (syncInProgress) {
    return { total: 0, synced: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
  }

  if (!currentState.isOnline) {
    return { total: 0, synced: 0, failed: 0, conflicts: 0, errors: ['Device is offline'] };
  }

  syncInProgress = true;
  currentState.isSyncing = true;
  currentState.syncProgress = 0;
  offlineEvents.emit('syncStart');

  const result: SyncResult = {
    total: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    const queue = await getActionQueue();
    const pendingActions = queue.filter(a => a.status === 'pending' || a.status === 'failed');
    result.total = pendingActions.length;

    for (let i = 0; i < pendingActions.length; i++) {
      const action = pendingActions[i];
      
      // Update progress
      currentState.syncProgress = Math.round(((i + 1) / pendingActions.length) * 100);
      offlineEvents.emit('syncProgress', currentState.syncProgress);

      try {
        // Process action
        const syncResult = await processAction(action);
        
        if (syncResult.success) {
          action.status = 'completed';
          result.synced++;
        } else if (syncResult.conflict) {
          action.status = 'conflict';
          action.conflictData = syncResult.conflictData;
          result.conflicts++;
        } else {
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            action.status = 'failed';
            action.error = syncResult.error;
            result.failed++;
            result.errors.push(`${action.type}: ${syncResult.error}`);
          }
        }
      } catch (error: any) {
        action.retryCount++;
        if (action.retryCount >= action.maxRetries) {
          action.status = 'failed';
          action.error = error.message;
          result.failed++;
          result.errors.push(`${action.type}: ${error.message}`);
        }
      }
    }

    // Save updated queue (remove completed actions)
    const updatedQueue = queue.filter(a => a.status !== 'completed');
    await saveActionQueue(updatedQueue);
    await updatePendingCount();

    // Log sync result
    await logSyncResult(result);

  } finally {
    syncInProgress = false;
    currentState.isSyncing = false;
    currentState.syncProgress = 100;
    offlineEvents.emit('syncComplete', result);
  }

  return result;
}

/**
 * Process a single queued action
 */
async function processAction(action: QueuedAction): Promise<{
  success: boolean;
  conflict?: boolean;
  conflictData?: Record<string, any>;
  error?: string;
}> {
  // Simulate API call - in real implementation, this would call the actual APIs
  // For now, we'll implement the structure and return success
  
  switch (action.type) {
    case 'CREATE_PATIENT':
    case 'UPDATE_PATIENT':
      // Call patient API
      return { success: true };
      
    case 'CREATE_APPOINTMENT':
    case 'UPDATE_APPOINTMENT':
    case 'DELETE_APPOINTMENT':
      // Call appointment API and sync with Office 365
      return { success: true };
      
    case 'CREATE_TASK':
    case 'UPDATE_TASK':
      // Call task API
      return { success: true };
      
    case 'CREATE_NOTE':
      // Call notes API
      return { success: true };
      
    case 'UPDATE_VITALS':
      // Call vitals API
      return { success: true };
      
    case 'SEND_MESSAGE':
      // Call messaging API
      return { success: true };
      
    case 'SYNC_JEDI':
      // Sync with JEDI systems
      return { success: true };
      
    case 'SYNC_O365':
      // Sync with Office 365
      return { success: true };
      
    default:
      return { success: false, error: `Unknown action type: ${action.type}` };
  }
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(resolution: ConflictResolution): Promise<void> {
  const queue = await getActionQueue();
  const actionIndex = queue.findIndex(a => a.id === resolution.actionId);
  
  if (actionIndex === -1) {
    throw new Error('Action not found');
  }

  const action = queue[actionIndex];
  
  switch (resolution.resolution) {
    case 'local':
      // Keep local changes, retry sync
      action.status = 'pending';
      action.retryCount = 0;
      break;
      
    case 'remote':
      // Discard local changes
      queue.splice(actionIndex, 1);
      break;
      
    case 'merge':
      // Use merged data
      if (resolution.mergedData) {
        action.payload = resolution.mergedData;
        action.status = 'pending';
        action.retryCount = 0;
      }
      break;
  }

  await saveActionQueue(queue);
  await updatePendingCount();
  
  // Trigger sync if online
  if (currentState.isOnline) {
    triggerSync();
  }
}

/**
 * Get conflicts
 */
export async function getConflicts(): Promise<QueuedAction[]> {
  const queue = await getActionQueue();
  return queue.filter(a => a.status === 'conflict');
}

/**
 * Clear completed actions
 */
export async function clearCompletedActions(): Promise<void> {
  const queue = await getActionQueue();
  const filtered = queue.filter(a => a.status !== 'completed');
  await saveActionQueue(filtered);
}

/**
 * Clear all queued actions
 */
export async function clearAllActions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ACTION_QUEUE);
  await updatePendingCount();
}

/**
 * Log sync result
 */
async function logSyncResult(result: SyncResult): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...result,
    };
    
    const existingLog = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_LOG);
    const log = existingLog ? JSON.parse(existingLog) : [];
    log.unshift(logEntry);
    
    // Keep only last 50 entries
    const trimmed = log.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error logging sync result:', error);
  }
}

/**
 * Get sync log
 */
export async function getSyncLog(): Promise<Array<SyncResult & { timestamp: string }>> {
  try {
    const log = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_LOG);
    if (log) {
      return JSON.parse(log);
    }
  } catch (error) {
    console.error('Error getting sync log:', error);
  }
  return [];
}

/**
 * Cache data for offline access
 */
export async function cacheData(key: string, data: any): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
    const cacheMap = cached ? JSON.parse(cached) : {};
    cacheMap[key] = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cacheMap));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string, maxAge?: number): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
    if (cached) {
      const cacheMap = JSON.parse(cached);
      const entry = cacheMap[key];
      if (entry) {
        // Check if cache is still valid
        if (!maxAge || Date.now() - entry.timestamp < maxAge) {
          return entry.data as T;
        }
      }
    }
  } catch (error) {
    console.error('Error getting cached data:', error);
  }
  return null;
}

/**
 * Clear cached data
 */
export async function clearCachedData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_DATA);
}

// Event subscription helpers
export function onNetworkChange(callback: (state: OfflineState) => void): () => void {
  offlineEvents.on('networkChange', callback);
  return () => offlineEvents.off('networkChange', callback);
}

export function onOnline(callback: () => void): () => void {
  offlineEvents.on('online', callback);
  return () => offlineEvents.off('online', callback);
}

export function onOffline(callback: () => void): () => void {
  offlineEvents.on('offline', callback);
  return () => offlineEvents.off('offline', callback);
}

export function onSyncStart(callback: () => void): () => void {
  offlineEvents.on('syncStart', callback);
  return () => offlineEvents.off('syncStart', callback);
}

export function onSyncProgress(callback: (progress: number) => void): () => void {
  offlineEvents.on('syncProgress', callback);
  return () => offlineEvents.off('syncProgress', callback);
}

export function onSyncComplete(callback: (result: SyncResult) => void): () => void {
  offlineEvents.on('syncComplete', callback);
  return () => offlineEvents.off('syncComplete', callback);
}

export function onActionQueued(callback: (action: QueuedAction) => void): () => void {
  offlineEvents.on('actionQueued', callback);
  return () => offlineEvents.off('actionQueued', callback);
}

export function onPendingCountChange(callback: (count: number) => void): () => void {
  offlineEvents.on('pendingCountChange', callback);
  return () => offlineEvents.off('pendingCountChange', callback);
}

export default {
  initializeOfflineMode,
  cleanupOfflineMode,
  getOfflineState,
  isOnline,
  queueAction,
  getActionQueue,
  triggerSync,
  resolveConflict,
  getConflicts,
  clearCompletedActions,
  clearAllActions,
  getSyncLog,
  cacheData,
  getCachedData,
  clearCachedData,
  // Event subscriptions
  onNetworkChange,
  onOnline,
  onOffline,
  onSyncStart,
  onSyncProgress,
  onSyncComplete,
  onActionQueued,
  onPendingCountChange,
};
