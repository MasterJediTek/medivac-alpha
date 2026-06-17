/**
 * Microsoft Account Authorization Service
 * Centralized OAuth management for all Microsoft services
 * MediVac One v6.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'medivac_microsoft_accounts',
  CONNECTIONS: 'medivac_microsoft_connections',
  CONFIG: 'medivac_microsoft_auth_config',
};

// Types
export type MicrosoftService = 'teams' | 'sharepoint' | 'onedrive' | 'outlook' | 'graph' | 'azure_ad';
export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';
export type AccountType = 'work' | 'school' | 'personal';

export interface MicrosoftAccount {
  id: string;
  email: string;
  displayName: string;
  accountType: AccountType;
  tenantId?: string;
  tenantName?: string;
  profilePicture?: string;
  isPrimary: boolean;
  addedAt: string;
  lastUsed: string;
  connections: ServiceConnection[];
}

export interface ServiceConnection {
  service: MicrosoftService;
  status: ConnectionStatus;
  scopes: string[];
  connectedAt?: string;
  expiresAt?: string;
  lastRefreshed?: string;
  error?: string;
}

export interface AuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  authority: string;
  scopes: Record<MicrosoftService, string[]>;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
}

export interface AuthResult {
  success: boolean;
  account?: MicrosoftAccount;
  error?: string;
}

// Service configuration
export const MICROSOFT_SERVICES: Record<MicrosoftService, {
  label: string;
  description: string;
  icon: string;
  color: string;
  requiredScopes: string[];
}> = {
  teams: {
    label: 'Microsoft Teams',
    description: 'Send notifications and manage channels',
    icon: 'message.fill',
    color: '#6264A7',
    requiredScopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All', 'Chat.ReadWrite'],
  },
  sharepoint: {
    label: 'SharePoint',
    description: 'Sync documents and manage libraries',
    icon: 'doc.fill',
    color: '#038387',
    requiredScopes: ['Sites.ReadWrite.All', 'Files.ReadWrite.All'],
  },
  onedrive: {
    label: 'OneDrive',
    description: 'Personal file sync and storage',
    icon: 'cloud.fill',
    color: '#0078D4',
    requiredScopes: ['Files.ReadWrite', 'offline_access'],
  },
  outlook: {
    label: 'Outlook',
    description: 'Email and calendar integration',
    icon: 'envelope.fill',
    color: '#0072C6',
    requiredScopes: ['Mail.ReadWrite', 'Calendars.ReadWrite'],
  },
  graph: {
    label: 'Microsoft Graph',
    description: 'Core API access for all services',
    icon: 'network',
    color: '#00BCF2',
    requiredScopes: ['User.Read', 'Directory.Read.All'],
  },
  azure_ad: {
    label: 'Azure AD',
    description: 'Identity and access management',
    icon: 'shield.fill',
    color: '#0089D6',
    requiredScopes: ['User.Read.All', 'Group.Read.All'],
  },
};

// Default auth config
const DEFAULT_CONFIG: AuthConfig = {
  clientId: '',
  tenantId: 'common',
  redirectUri: 'medivac://auth/callback',
  authority: 'https://login.microsoftonline.com',
  scopes: {
    teams: ['Team.ReadBasic.All', 'Channel.ReadBasic.All', 'Chat.ReadWrite'],
    sharepoint: ['Sites.ReadWrite.All', 'Files.ReadWrite.All'],
    onedrive: ['Files.ReadWrite', 'offline_access'],
    outlook: ['Mail.ReadWrite', 'Calendars.ReadWrite'],
    graph: ['User.Read', 'Directory.Read.All'],
    azure_ad: ['User.Read.All', 'Group.Read.All'],
  },
};

// Sample accounts
const SAMPLE_ACCOUNTS: MicrosoftAccount[] = [
  {
    id: 'acc_1',
    email: 'admin@wachs.health.wa.gov.au',
    displayName: 'WACHS Admin',
    accountType: 'work',
    tenantId: 'wachs-tenant-id',
    tenantName: 'WA Country Health Service',
    isPrimary: true,
    addedAt: '2025-01-15T10:00:00Z',
    lastUsed: '2025-01-28T14:30:00Z',
    connections: [
      { service: 'teams', status: 'connected', scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All'], connectedAt: '2025-01-15T10:05:00Z', expiresAt: '2025-02-15T10:05:00Z' },
      { service: 'sharepoint', status: 'connected', scopes: ['Sites.ReadWrite.All', 'Files.ReadWrite.All'], connectedAt: '2025-01-15T10:10:00Z', expiresAt: '2025-02-15T10:10:00Z' },
      { service: 'graph', status: 'connected', scopes: ['User.Read', 'Directory.Read.All'], connectedAt: '2025-01-15T10:00:00Z', expiresAt: '2025-02-15T10:00:00Z' },
      { service: 'onedrive', status: 'disconnected', scopes: [] },
      { service: 'outlook', status: 'disconnected', scopes: [] },
      { service: 'azure_ad', status: 'disconnected', scopes: [] },
    ],
  },
  {
    id: 'acc_2',
    email: 'james.wilson@medivac.health',
    displayName: 'James Wilson',
    accountType: 'work',
    tenantId: 'medivac-tenant-id',
    tenantName: 'MediVac Health',
    isPrimary: false,
    addedAt: '2025-01-20T09:00:00Z',
    lastUsed: '2025-01-27T16:00:00Z',
    connections: [
      { service: 'teams', status: 'connected', scopes: ['Team.ReadBasic.All'], connectedAt: '2025-01-20T09:05:00Z', expiresAt: '2025-02-20T09:05:00Z' },
      { service: 'onedrive', status: 'connected', scopes: ['Files.ReadWrite'], connectedAt: '2025-01-20T09:10:00Z', expiresAt: '2025-02-20T09:10:00Z' },
      { service: 'sharepoint', status: 'expired', scopes: ['Sites.ReadWrite.All'], connectedAt: '2024-12-20T09:00:00Z', expiresAt: '2025-01-20T09:00:00Z', error: 'Token expired' },
      { service: 'graph', status: 'connected', scopes: ['User.Read'], connectedAt: '2025-01-20T09:00:00Z', expiresAt: '2025-02-20T09:00:00Z' },
      { service: 'outlook', status: 'disconnected', scopes: [] },
      { service: 'azure_ad', status: 'disconnected', scopes: [] },
    ],
  },
];

class MicrosoftAuthService {
  private accounts: MicrosoftAccount[] = [];
  private config: AuthConfig = DEFAULT_CONFIG;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [accountsData, configData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS),
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
      ]);

      this.accounts = accountsData ? JSON.parse(accountsData) : SAMPLE_ACCOUNTS;
      this.config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Microsoft auth service:', error);
      this.accounts = SAMPLE_ACCOUNTS;
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  private async saveAccounts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
    } catch (error) {
      console.error('Failed to save accounts:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // Accounts
  getAccounts(): MicrosoftAccount[] {
    return [...this.accounts];
  }

  getAccount(id: string): MicrosoftAccount | undefined {
    return this.accounts.find(a => a.id === id);
  }

  getPrimaryAccount(): MicrosoftAccount | undefined {
    return this.accounts.find(a => a.isPrimary);
  }

  async addAccount(input: {
    email: string;
    displayName: string;
    accountType: AccountType;
    tenantId?: string;
    tenantName?: string;
  }): Promise<MicrosoftAccount> {
    const account: MicrosoftAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: input.email,
      displayName: input.displayName,
      accountType: input.accountType,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      isPrimary: this.accounts.length === 0,
      addedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      connections: Object.keys(MICROSOFT_SERVICES).map(service => ({
        service: service as MicrosoftService,
        status: 'disconnected' as ConnectionStatus,
        scopes: [],
      })),
    };

    this.accounts.push(account);
    await this.saveAccounts();
    return account;
  }

  async removeAccount(id: string): Promise<boolean> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return false;

    const wasPrimary = this.accounts[index].isPrimary;
    this.accounts.splice(index, 1);

    // If removed account was primary, set first remaining as primary
    if (wasPrimary && this.accounts.length > 0) {
      this.accounts[0].isPrimary = true;
    }

    await this.saveAccounts();
    return true;
  }

  async setPrimaryAccount(id: string): Promise<MicrosoftAccount | null> {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;

    this.accounts.forEach(a => a.isPrimary = false);
    account.isPrimary = true;
    await this.saveAccounts();
    return account;
  }

  // Service connections
  async connectService(accountId: string, service: MicrosoftService): Promise<AuthResult> {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const connection = account.connections.find(c => c.service === service);
    if (!connection) {
      return { success: false, error: 'Service not found' };
    }

    // Simulate OAuth flow
    const serviceConfig = MICROSOFT_SERVICES[service];
    connection.status = 'connected';
    connection.scopes = serviceConfig.requiredScopes;
    connection.connectedAt = new Date().toISOString();
    connection.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    connection.lastRefreshed = new Date().toISOString();
    connection.error = undefined;

    account.lastUsed = new Date().toISOString();
    await this.saveAccounts();

    return { success: true, account };
  }

  async disconnectService(accountId: string, service: MicrosoftService): Promise<AuthResult> {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const connection = account.connections.find(c => c.service === service);
    if (!connection) {
      return { success: false, error: 'Service not found' };
    }

    connection.status = 'disconnected';
    connection.scopes = [];
    connection.connectedAt = undefined;
    connection.expiresAt = undefined;
    connection.lastRefreshed = undefined;
    connection.error = undefined;

    await this.saveAccounts();
    return { success: true, account };
  }

  async refreshService(accountId: string, service: MicrosoftService): Promise<AuthResult> {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const connection = account.connections.find(c => c.service === service);
    if (!connection || connection.status === 'disconnected') {
      return { success: false, error: 'Service not connected' };
    }

    // Simulate token refresh
    connection.status = 'connected';
    connection.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    connection.lastRefreshed = new Date().toISOString();
    connection.error = undefined;

    account.lastUsed = new Date().toISOString();
    await this.saveAccounts();

    return { success: true, account };
  }

  getServiceStatus(accountId: string, service: MicrosoftService): ServiceConnection | undefined {
    const account = this.accounts.find(a => a.id === accountId);
    return account?.connections.find(c => c.service === service);
  }

  // Config
  getConfig(): AuthConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<AuthConfig>): Promise<AuthConfig> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    return this.config;
  }

  // Analytics
  getAnalytics(): {
    totalAccounts: number;
    workAccounts: number;
    personalAccounts: number;
    connectedServices: number;
    expiredConnections: number;
    byService: Record<MicrosoftService, { connected: number; total: number }>;
  } {
    const byService: Record<MicrosoftService, { connected: number; total: number }> = {} as any;
    
    Object.keys(MICROSOFT_SERVICES).forEach(service => {
      byService[service as MicrosoftService] = { connected: 0, total: this.accounts.length };
    });

    let connectedServices = 0;
    let expiredConnections = 0;

    this.accounts.forEach(account => {
      account.connections.forEach(conn => {
        if (conn.status === 'connected') {
          byService[conn.service].connected++;
          connectedServices++;
        }
        if (conn.status === 'expired') {
          expiredConnections++;
        }
      });
    });

    return {
      totalAccounts: this.accounts.length,
      workAccounts: this.accounts.filter(a => a.accountType === 'work').length,
      personalAccounts: this.accounts.filter(a => a.accountType === 'personal').length,
      connectedServices,
      expiredConnections,
      byService,
    };
  }

  // Validation
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.clientId) {
      errors.push('Client ID is required');
    }
    if (!this.config.redirectUri) {
      errors.push('Redirect URI is required');
    }

    return { valid: errors.length === 0, errors };
  }

  // Export
  exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      accounts: this.accounts.map(a => ({
        email: a.email,
        displayName: a.displayName,
        accountType: a.accountType,
        tenantName: a.tenantName,
        connections: a.connections.filter(c => c.status === 'connected').map(c => c.service),
      })),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

export const microsoftAuthService = new MicrosoftAuthService();
