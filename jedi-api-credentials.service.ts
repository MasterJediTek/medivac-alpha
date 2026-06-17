/**
 * JEDI API Credentials Service
 * Generates and manages JEDI API credentials from shared portals
 * Integrates with JEDI Systems, FileMaker Server, and WACHS portals
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface JEDIAPICredential {
  id: string;
  name: string;
  portalId: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  scope: string[];
  isActive: boolean;
  createdAt: number;
  expiresAt?: number;
  lastUsed?: number;
}

export interface PortalIntegration {
  id: string;
  name: string;
  type: 'jedi-hub' | 'jedi-agent' | 'wachs' | 'filemaker' | 'custom';
  endpoint: string;
  credentials: JEDIAPICredential;
  isConnected: boolean;
  lastSync: number;
  syncInterval: number;
  dataTypes: string[];
}

export interface JEDIAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId: string;
}

const JEDI_PORTALS = {
  'jedi-hub': {
    name: 'JEDI Hub',
    endpoint: 'https://jedi.manus.space/api',
    scopes: ['read', 'write', 'admin'],
    dataTypes: ['systems', 'users', 'sessions', 'logs'],
  },
  'jedi-agent': {
    name: 'JEDI Agent',
    endpoint: 'https://jedi.manus.space/agent/api',
    scopes: ['read', 'write', 'execute'],
    dataTypes: ['tasks', 'automations', 'workflows'],
  },
  'wachs': {
    name: 'WACHS Portal',
    endpoint: 'https://wachs.health.wa.gov.au/api',
    scopes: ['read', 'patient-data', 'clinical'],
    dataTypes: ['patients', 'appointments', 'clinical-notes'],
  },
  'filemaker': {
    name: 'FileMaker Server',
    endpoint: 'https://iskooledu.fmcloud.fm/fmi/data/v1',
    scopes: ['read', 'write', 'admin'],
    dataTypes: ['databases', 'records', 'layouts'],
  },
};

class JEDIAPICredentialsService {
  private credentials: Map<string, JEDIAPICredential> = new Map();
  private integrations: Map<string, PortalIntegration> = new Map();

  async initialize(): Promise<void> {
    await this.loadCredentials();
    await this.loadIntegrations();
  }

  /**
   * Generate JEDI API credentials for a portal
   */
  async generateCredentials(
    portalId: keyof typeof JEDI_PORTALS,
    name: string,
    scopes: string[] = []
  ): Promise<JEDIAPICredential> {
    const portal = JEDI_PORTALS[portalId];
    if (!portal) {
      throw new Error(`Portal ${portalId} not found`);
    }

    const credential: JEDIAPICredential = {
      id: `jedi_cred_${Date.now()}`,
      name,
      portalId,
      apiKey: `jedi_key_${this.generateRandomString(32)}`,
      apiSecret: `jedi_secret_${this.generateRandomString(64)}`,
      webhookUrl: `https://medivac.manus.space/webhooks/jedi/${portalId}`,
      scope: scopes.length > 0 ? scopes : portal.scopes,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    };

    this.credentials.set(credential.id, credential);
    await this.saveCredentials();

    console.log(`[JEDI Credentials] Generated credentials for ${portalId}:`, credential.id);
    return credential;
  }

  /**
   * Create portal integration with credentials
   */
  async createPortalIntegration(
    portalId: keyof typeof JEDI_PORTALS,
    credentialId: string,
    syncInterval: number = 300000 // 5 minutes
  ): Promise<PortalIntegration> {
    const portal = JEDI_PORTALS[portalId];
    const credential = this.credentials.get(credentialId);

    if (!portal || !credential) {
      throw new Error('Portal or credential not found');
    }

    const integration: PortalIntegration = {
      id: `integration_${Date.now()}`,
      name: portal.name,
      type: portalId as any,
      endpoint: portal.endpoint,
      credentials: credential,
      isConnected: false,
      lastSync: 0,
      syncInterval,
      dataTypes: portal.dataTypes,
    };

    this.integrations.set(integration.id, integration);
    await this.saveIntegrations();

    // Try to connect
    await this.connectPortal(integration.id);

    return integration;
  }

  /**
   * Connect to a portal
   */
  async connectPortal(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    try {
      // Simulate API call to verify credentials
      const response = await this.callPortalAPI(integration, '/auth/verify', 'GET', {});

      if (response.success) {
        integration.isConnected = true;
        integration.lastSync = Date.now();
        await this.saveIntegrations();
        console.log(`[JEDI Credentials] Connected to ${integration.name}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[JEDI Credentials] Error connecting to ${integration.name}:`, error);
      return false;
    }
  }

  /**
   * Call portal API
   */
  async callPortalAPI<T = unknown>(
    integration: PortalIntegration,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, unknown>
  ): Promise<JEDIAPIResponse<T>> {
    try {
      const url = `${integration.endpoint}${endpoint}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${integration.credentials.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Secret': integration.credentials.apiSecret,
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      // In production, this would make a real API call
      // For now, simulate successful response
      const response: JEDIAPIResponse<T> = {
        success: true,
        data: {} as T,
        timestamp: Date.now(),
        requestId: `req_${Date.now()}`,
      };

      // Update last used
      integration.credentials.lastUsed = Date.now();
      await this.saveCredentials();

      return response;
    } catch (error) {
      return {
        success: false,
        error: String(error),
        timestamp: Date.now(),
        requestId: `req_${Date.now()}`,
      };
    }
  }

  /**
   * Get all credentials
   */
  getCredentials(): JEDIAPICredential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Get credential by ID
   */
  getCredential(credentialId: string): JEDIAPICredential | undefined {
    return this.credentials.get(credentialId);
  }

  /**
   * Get all integrations
   */
  getIntegrations(): PortalIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integration by ID
   */
  getIntegration(integrationId: string): PortalIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * Get connected integrations
   */
  getConnectedIntegrations(): PortalIntegration[] {
    return Array.from(this.integrations.values()).filter(i => i.isConnected);
  }

  /**
   * Revoke credential
   */
  async revokeCredential(credentialId: string): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (credential) {
      credential.isActive = false;
      await this.saveCredentials();

      // Disconnect integrations using this credential
      for (const integration of this.integrations.values()) {
        if (integration.credentials.id === credentialId) {
          integration.isConnected = false;
        }
      }
      await this.saveIntegrations();
    }
  }

  /**
   * Get integration stats
   */
  getIntegrationStats() {
    const connected = Array.from(this.integrations.values()).filter(i => i.isConnected);
    return {
      totalCredentials: this.credentials.size,
      activeCredentials: Array.from(this.credentials.values()).filter(c => c.isActive).length,
      totalIntegrations: this.integrations.size,
      connectedIntegrations: connected.length,
      lastSync: Math.max(...connected.map(i => i.lastSync), 0),
    };
  }

  // Private methods

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async saveCredentials(): Promise<void> {
    try {
      const data = Array.from(this.credentials.values());
      await AsyncStorage.setItem('jedi_credentials', JSON.stringify(data));
    } catch (error) {
      console.error('[JEDI Credentials] Error saving credentials:', error);
    }
  }

  private async loadCredentials(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('jedi_credentials');
      if (stored) {
        const data = JSON.parse(stored) as JEDIAPICredential[];
        data.forEach(cred => this.credentials.set(cred.id, cred));
      }
    } catch (error) {
      console.error('[JEDI Credentials] Error loading credentials:', error);
    }
  }

  private async saveIntegrations(): Promise<void> {
    try {
      const data = Array.from(this.integrations.values());
      await AsyncStorage.setItem('jedi_integrations', JSON.stringify(data));
    } catch (error) {
      console.error('[JEDI Credentials] Error saving integrations:', error);
    }
  }

  private async loadIntegrations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('jedi_integrations');
      if (stored) {
        const data = JSON.parse(stored) as PortalIntegration[];
        data.forEach(integration => this.integrations.set(integration.id, integration));
      }
    } catch (error) {
      console.error('[JEDI Credentials] Error loading integrations:', error);
    }
  }
}

export const jediAPICredentialsService = new JEDIAPICredentialsService();
