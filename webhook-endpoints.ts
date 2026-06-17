/**
 * Webhook Endpoints Service
 * Connects MediVac One to JEDI systems, SMPO.ink, and WONGI servers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Webhook Event Types
export type WebhookEventType =
  | 'patient.created'
  | 'patient.updated'
  | 'patient.discharged'
  | 'appointment.scheduled'
  | 'appointment.cancelled'
  | 'medication.prescribed'
  | 'medication.administered'
  | 'lab.ordered'
  | 'lab.results'
  | 'alert.critical'
  | 'alert.warning'
  | 'task.created'
  | 'task.completed'
  | 'handover.initiated'
  | 'handover.completed'
  | 'sync.requested'
  | 'sync.completed';

// Webhook Endpoint Configuration
export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  system: 'jedi' | 'smpo' | 'wongi' | 'custom';
  events: WebhookEventType[];
  enabled: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  status: 'active' | 'inactive' | 'error';
  lastPing?: string;
  lastError?: string;
  successCount: number;
  errorCount: number;
}

// Webhook Delivery Log
export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEventType;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  responseCode?: number;
  responseBody?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Default JEDI System Endpoints
const JEDI_ENDPOINTS: Partial<WebhookEndpoint>[] = [
  {
    id: 'jedi-core',
    name: 'JEDI Core Systems',
    url: 'https://api.jeditek.com.au/webhooks/medivac',
    system: 'jedi',
    events: ['patient.created', 'patient.updated', 'patient.discharged', 'sync.requested', 'sync.completed'],
  },
  {
    id: 'jedi-nexus',
    name: 'Nexus Beacon',
    url: 'https://nexus.jeditek.net/api/webhooks',
    system: 'jedi',
    events: ['alert.critical', 'alert.warning', 'handover.initiated', 'handover.completed'],
  },
  {
    id: 'jedi-alphaprime',
    name: 'AlphaPrime Systems',
    url: 'https://alphaprime.jeditek.com.au/api/webhooks',
    system: 'jedi',
    events: ['task.created', 'task.completed'],
  },
];

// SMPO.ink Endpoints
const SMPO_ENDPOINTS: Partial<WebhookEndpoint>[] = [
  {
    id: 'smpo-protocol',
    name: 'SMPO.ink Protocol Server',
    url: 'https://api.smpo.ink/v1/webhooks',
    system: 'smpo',
    events: ['patient.created', 'patient.updated', 'medication.prescribed', 'lab.results'],
  },
  {
    id: 'smpo-knowledge',
    name: 'SMPO Knowledge Base',
    url: 'https://smpo-ink.manus.space/api/webhooks',
    system: 'smpo',
    events: ['sync.requested', 'sync.completed'],
  },
];

// WONGI Endpoints
const WONGI_ENDPOINTS: Partial<WebhookEndpoint>[] = [
  {
    id: 'wongi-health',
    name: 'WONGI Health Tracker',
    url: 'https://wongi.com.au/api/webhooks',
    system: 'wongi',
    events: ['patient.created', 'patient.updated', 'medication.administered', 'lab.results'],
  },
  {
    id: 'wongi-comms',
    name: 'WONGI Communications',
    url: 'https://jeditek.net/api/webhooks',
    system: 'wongi',
    events: ['alert.critical', 'alert.warning', 'handover.initiated'],
  },
];

// Storage Keys
const ENDPOINTS_STORAGE_KEY = 'medivac_webhook_endpoints';
const DELIVERIES_STORAGE_KEY = 'medivac_webhook_deliveries';

// Default Retry Policy
const DEFAULT_RETRY_POLICY = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
};

/**
 * Initialize default webhook endpoints
 */
export async function initializeWebhookEndpoints(): Promise<void> {
  const existing = await getWebhookEndpoints();
  if (existing.length === 0) {
    const allDefaults = [...JEDI_ENDPOINTS, ...SMPO_ENDPOINTS, ...WONGI_ENDPOINTS];
    const endpoints: WebhookEndpoint[] = allDefaults.map(ep => ({
      ...ep,
      enabled: false,
      retryPolicy: DEFAULT_RETRY_POLICY,
      status: 'inactive' as const,
      successCount: 0,
      errorCount: 0,
    } as WebhookEndpoint));
    
    await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
  }
}

/**
 * Get all webhook endpoints
 */
export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  try {
    const stored = await AsyncStorage.getItem(ENDPOINTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading webhook endpoints:', error);
    return [];
  }
}

/**
 * Get endpoints by system
 */
export async function getEndpointsBySystem(system: WebhookEndpoint['system']): Promise<WebhookEndpoint[]> {
  const endpoints = await getWebhookEndpoints();
  return endpoints.filter(ep => ep.system === system);
}

/**
 * Save webhook endpoint
 */
export async function saveWebhookEndpoint(endpoint: WebhookEndpoint): Promise<void> {
  const endpoints = await getWebhookEndpoints();
  const index = endpoints.findIndex(ep => ep.id === endpoint.id);
  
  if (index >= 0) {
    endpoints[index] = endpoint;
  } else {
    endpoints.push(endpoint);
  }
  
  await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
}

/**
 * Delete webhook endpoint
 */
export async function deleteWebhookEndpoint(endpointId: string): Promise<void> {
  const endpoints = await getWebhookEndpoints();
  const filtered = endpoints.filter(ep => ep.id !== endpointId);
  await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Enable/disable webhook endpoint
 */
export async function setEndpointEnabled(endpointId: string, enabled: boolean): Promise<void> {
  const endpoints = await getWebhookEndpoints();
  const endpoint = endpoints.find(ep => ep.id === endpointId);
  
  if (endpoint) {
    endpoint.enabled = enabled;
    endpoint.status = enabled ? 'active' : 'inactive';
    await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
  }
}

/**
 * Test webhook endpoint connectivity
 */
export async function testWebhookEndpoint(endpointId: string): Promise<{
  success: boolean;
  latency: number;
  statusCode?: number;
  error?: string;
}> {
  const endpoints = await getWebhookEndpoints();
  const endpoint = endpoints.find(ep => ep.id === endpointId);
  
  if (!endpoint) {
    return { success: false, latency: 0, error: 'Endpoint not found' };
  }
  
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-MediVac-Signature': 'test-ping',
      ...endpoint.headers,
    };
    
    if (endpoint.secret) {
      headers['X-Webhook-Secret'] = endpoint.secret;
    }
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'ping',
        timestamp: new Date().toISOString(),
        source: 'medivac-one',
      }),
    });
    
    const latency = Date.now() - startTime;
    
    // Update endpoint status
    endpoint.lastPing = new Date().toISOString();
    if (response.ok) {
      endpoint.status = 'active';
      endpoint.lastError = undefined;
    } else {
      endpoint.status = 'error';
      endpoint.lastError = `HTTP ${response.status}`;
    }
    await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
    
    return {
      success: response.ok,
      latency,
      statusCode: response.status,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // Update endpoint status
    endpoint.status = 'error';
    endpoint.lastError = String(error);
    await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
    
    return {
      success: false,
      latency,
      error: String(error),
    };
  }
}

/**
 * Send webhook event to all enabled endpoints
 */
export async function sendWebhookEvent(
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<WebhookDelivery[]> {
  const endpoints = await getWebhookEndpoints();
  const enabledEndpoints = endpoints.filter(ep => ep.enabled && ep.events.includes(event));
  
  const deliveries: WebhookDelivery[] = [];
  
  for (const endpoint of enabledEndpoints) {
    const delivery = await deliverWebhook(endpoint, event, payload);
    deliveries.push(delivery);
  }
  
  return deliveries;
}

/**
 * Deliver webhook to a specific endpoint
 */
async function deliverWebhook(
  endpoint: WebhookEndpoint,
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<WebhookDelivery> {
  const delivery: WebhookDelivery = {
    id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    endpointId: endpoint.id,
    event,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  
  const webhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    source: 'medivac-one',
    data: payload,
  };
  
  let lastError: string | undefined;
  
  for (let attempt = 0; attempt <= endpoint.retryPolicy.maxRetries; attempt++) {
    delivery.attempts = attempt + 1;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-MediVac-Event': event,
        'X-MediVac-Delivery': delivery.id,
        'X-MediVac-Attempt': String(attempt + 1),
        ...endpoint.headers,
      };
      
      if (endpoint.secret) {
        // In production, this would be HMAC signature
        headers['X-Webhook-Signature'] = `sha256=${endpoint.secret}`;
      }
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
      });
      
      delivery.responseCode = response.status;
      
      if (response.ok) {
        delivery.status = 'success';
        delivery.completedAt = new Date().toISOString();
        
        // Update endpoint success count
        const endpoints = await getWebhookEndpoints();
        const ep = endpoints.find(e => e.id === endpoint.id);
        if (ep) {
          ep.successCount++;
          await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
        }
        
        break;
      } else {
        lastError = `HTTP ${response.status}`;
        delivery.status = 'retrying';
      }
    } catch (error) {
      lastError = String(error);
      delivery.status = 'retrying';
    }
    
    // Wait before retry with exponential backoff
    if (attempt < endpoint.retryPolicy.maxRetries) {
      const delay = endpoint.retryPolicy.retryDelay * Math.pow(endpoint.retryPolicy.backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (delivery.status === 'retrying') {
    delivery.status = 'failed';
    delivery.error = lastError;
    
    // Update endpoint error count
    const endpoints = await getWebhookEndpoints();
    const ep = endpoints.find(e => e.id === endpoint.id);
    if (ep) {
      ep.errorCount++;
      ep.lastError = lastError;
      await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
    }
  }
  
  // Save delivery log
  await saveDeliveryLog(delivery);
  
  return delivery;
}

/**
 * Save delivery log
 */
async function saveDeliveryLog(delivery: WebhookDelivery): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(DELIVERIES_STORAGE_KEY);
    const deliveries: WebhookDelivery[] = stored ? JSON.parse(stored) : [];
    
    deliveries.unshift(delivery);
    
    // Keep only last 100 deliveries
    const trimmed = deliveries.slice(0, 100);
    
    await AsyncStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving delivery log:', error);
  }
}

/**
 * Get delivery logs
 */
export async function getDeliveryLogs(limit = 50): Promise<WebhookDelivery[]> {
  try {
    const stored = await AsyncStorage.getItem(DELIVERIES_STORAGE_KEY);
    const deliveries: WebhookDelivery[] = stored ? JSON.parse(stored) : [];
    return deliveries.slice(0, limit);
  } catch (error) {
    console.error('Error loading delivery logs:', error);
    return [];
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(): Promise<{
  totalEndpoints: number;
  activeEndpoints: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  bySystem: Record<string, { count: number; active: number }>;
}> {
  const endpoints = await getWebhookEndpoints();
  const deliveries = await getDeliveryLogs(100);
  
  const bySystem: Record<string, { count: number; active: number }> = {};
  
  for (const ep of endpoints) {
    if (!bySystem[ep.system]) {
      bySystem[ep.system] = { count: 0, active: 0 };
    }
    bySystem[ep.system].count++;
    if (ep.enabled) {
      bySystem[ep.system].active++;
    }
  }
  
  return {
    totalEndpoints: endpoints.length,
    activeEndpoints: endpoints.filter(ep => ep.enabled).length,
    totalDeliveries: deliveries.length,
    successfulDeliveries: deliveries.filter(d => d.status === 'success').length,
    failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
    bySystem,
  };
}

/**
 * Bulk enable endpoints by system
 */
export async function enableSystemEndpoints(system: WebhookEndpoint['system']): Promise<void> {
  const endpoints = await getWebhookEndpoints();
  
  for (const ep of endpoints) {
    if (ep.system === system) {
      ep.enabled = true;
      ep.status = 'active';
    }
  }
  
  await AsyncStorage.setItem(ENDPOINTS_STORAGE_KEY, JSON.stringify(endpoints));
}

/**
 * Create custom webhook endpoint
 */
export async function createCustomEndpoint(
  name: string,
  url: string,
  events: WebhookEventType[],
  secret?: string
): Promise<WebhookEndpoint> {
  const endpoint: WebhookEndpoint = {
    id: `custom_${Date.now()}`,
    name,
    url,
    system: 'custom',
    events,
    enabled: false,
    secret,
    retryPolicy: DEFAULT_RETRY_POLICY,
    status: 'inactive',
    successCount: 0,
    errorCount: 0,
  };
  
  await saveWebhookEndpoint(endpoint);
  return endpoint;
}
