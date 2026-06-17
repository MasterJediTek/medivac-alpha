/**
 * WACHS WAN Integration Service
 * WA Country Health Service Wide Area Network connectivity
 * MediVac One v5.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'medivac_wachs_config',
  SITES: 'medivac_wachs_sites',
  CONNECTIONS: 'medivac_wachs_connections',
  LOGS: 'medivac_wachs_logs',
};

// Types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'degraded' | 'error';
export type SiteType = 'hospital' | 'clinic' | 'aged_care' | 'community_health' | 'admin' | 'data_center';
export type AuthMethod = 'certificate' | 'radius' | 'ldap' | 'oauth2' | 'api_key';
export type NetworkProtocol = 'mpls' | 'vpn' | 'sd_wan' | 'direct';

export interface WACHSConfig {
  organizationId: string;
  organizationName: string;
  region: WACHSRegion;
  primaryGateway: string;
  secondaryGateway?: string;
  authMethod: AuthMethod;
  certificatePath?: string;
  apiKey?: string;
  ldapServer?: string;
  ldapBaseDn?: string;
  radiusServer?: string;
  radiusSecret?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthTokenUrl?: string;
  networkProtocol: NetworkProtocol;
  encryptionLevel: 'standard' | 'high' | 'maximum';
  mtu: number;
  timeout: number;
  retryAttempts: number;
  status: ConnectionStatus;
  lastConnected?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export type WACHSRegion = 
  | 'goldfields'
  | 'great_southern'
  | 'kimberley'
  | 'midwest'
  | 'pilbara'
  | 'south_west'
  | 'wheatbelt';

export interface WACHSSite {
  id: string;
  name: string;
  code: string;
  type: SiteType;
  region: WACHSRegion;
  address: string;
  ipRange: string;
  gateway: string;
  vlanId: number;
  status: ConnectionStatus;
  latency?: number;
  bandwidth?: number;
  lastSeen?: string;
  contacts: SiteContact[];
  services: string[];
  createdAt: string;
}

export interface SiteContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface WANConnection {
  id: string;
  siteId: string;
  siteName: string;
  protocol: NetworkProtocol;
  status: ConnectionStatus;
  latency: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  uptime: number;
  lastCheck: string;
  errors: string[];
}

export interface ConnectionLog {
  id: string;
  siteId?: string;
  siteName?: string;
  event: 'connect' | 'disconnect' | 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// WACHS Region configurations
export const WACHS_REGIONS: Record<WACHSRegion, {
  label: string;
  headquarters: string;
  color: string;
  sites: number;
}> = {
  goldfields: {
    label: 'Goldfields',
    headquarters: 'Kalgoorlie',
    color: '#F59E0B',
    sites: 12,
  },
  great_southern: {
    label: 'Great Southern',
    headquarters: 'Albany',
    color: '#10B981',
    sites: 15,
  },
  kimberley: {
    label: 'Kimberley',
    headquarters: 'Broome',
    color: '#EF4444',
    sites: 18,
  },
  midwest: {
    label: 'Midwest',
    headquarters: 'Geraldton',
    color: '#3B82F6',
    sites: 14,
  },
  pilbara: {
    label: 'Pilbara',
    headquarters: 'Port Hedland',
    color: '#8B5CF6',
    sites: 10,
  },
  south_west: {
    label: 'South West',
    headquarters: 'Bunbury',
    color: '#06B6D4',
    sites: 20,
  },
  wheatbelt: {
    label: 'Wheatbelt',
    headquarters: 'Northam',
    color: '#84CC16',
    sites: 25,
  },
};

// Authentication method configurations
export const AUTH_METHODS: Record<AuthMethod, {
  label: string;
  description: string;
  requiredFields: string[];
}> = {
  certificate: {
    label: 'X.509 Certificate',
    description: 'PKI-based authentication using digital certificates',
    requiredFields: ['certificatePath'],
  },
  radius: {
    label: 'RADIUS',
    description: 'Remote Authentication Dial-In User Service',
    requiredFields: ['radiusServer', 'radiusSecret'],
  },
  ldap: {
    label: 'LDAP/Active Directory',
    description: 'Lightweight Directory Access Protocol authentication',
    requiredFields: ['ldapServer', 'ldapBaseDn'],
  },
  oauth2: {
    label: 'OAuth 2.0',
    description: 'Modern token-based authentication',
    requiredFields: ['oauthClientId', 'oauthClientSecret', 'oauthTokenUrl'],
  },
  api_key: {
    label: 'API Key',
    description: 'Simple API key authentication',
    requiredFields: ['apiKey'],
  },
};

// Default configuration
const DEFAULT_CONFIG: WACHSConfig = {
  organizationId: '',
  organizationName: '',
  region: 'south_west',
  primaryGateway: '',
  authMethod: 'certificate',
  networkProtocol: 'mpls',
  encryptionLevel: 'high',
  mtu: 1500,
  timeout: 30,
  retryAttempts: 3,
  status: 'disconnected',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Sample sites for demo
const SAMPLE_SITES: WACHSSite[] = [
  {
    id: 'site_bunbury',
    name: 'Bunbury Regional Hospital',
    code: 'BRH',
    type: 'hospital',
    region: 'south_west',
    address: '1 Bussell Hwy, Bunbury WA 6230',
    ipRange: '10.100.1.0/24',
    gateway: '10.100.1.1',
    vlanId: 100,
    status: 'connected',
    latency: 12,
    bandwidth: 1000,
    lastSeen: new Date().toISOString(),
    contacts: [
      { name: 'John Smith', role: 'IT Manager', phone: '08 9722 1000', email: 'john.smith@health.wa.gov.au' },
    ],
    services: ['EMR', 'PACS', 'Pathology', 'Pharmacy'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site_albany',
    name: 'Albany Health Campus',
    code: 'AHC',
    type: 'hospital',
    region: 'great_southern',
    address: '30 Warden Ave, Spencer Park WA 6330',
    ipRange: '10.100.2.0/24',
    gateway: '10.100.2.1',
    vlanId: 101,
    status: 'connected',
    latency: 18,
    bandwidth: 500,
    lastSeen: new Date().toISOString(),
    contacts: [
      { name: 'Sarah Johnson', role: 'Network Admin', phone: '08 9892 2222', email: 'sarah.johnson@health.wa.gov.au' },
    ],
    services: ['EMR', 'PACS', 'Telehealth'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'site_geraldton',
    name: 'Geraldton Regional Hospital',
    code: 'GRH',
    type: 'hospital',
    region: 'midwest',
    address: '51 Shenton St, Geraldton WA 6530',
    ipRange: '10.100.3.0/24',
    gateway: '10.100.3.1',
    vlanId: 102,
    status: 'degraded',
    latency: 45,
    bandwidth: 250,
    lastSeen: new Date().toISOString(),
    contacts: [
      { name: 'Mike Brown', role: 'IT Coordinator', phone: '08 9956 2222', email: 'mike.brown@health.wa.gov.au' },
    ],
    services: ['EMR', 'Telehealth'],
    createdAt: new Date().toISOString(),
  },
];

class WACHSWANService {
  private config: WACHSConfig = DEFAULT_CONFIG;
  private sites: WACHSSite[] = [];
  private connections: WANConnection[] = [];
  private logs: ConnectionLog[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configData, sitesData, connectionsData, logsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.SITES),
        AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
      ]);

      this.config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;
      this.sites = sitesData ? JSON.parse(sitesData) : SAMPLE_SITES;
      this.connections = connectionsData ? JSON.parse(connectionsData) : [];
      this.logs = logsData ? JSON.parse(logsData) : [];

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WACHS WAN service:', error);
      this.config = DEFAULT_CONFIG;
      this.sites = SAMPLE_SITES;
      this.initialized = true;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save WACHS config:', error);
    }
  }

  private async saveSites(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(this.sites));
    } catch (error) {
      console.error('Failed to save WACHS sites:', error);
    }
  }

  private async saveConnections(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(this.connections));
    } catch (error) {
      console.error('Failed to save WACHS connections:', error);
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      // Keep only last 500 logs
      if (this.logs.length > 500) {
        this.logs = this.logs.slice(-500);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save WACHS logs:', error);
    }
  }

  private addLog(event: ConnectionLog['event'], message: string, siteId?: string, details?: Record<string, unknown>): void {
    const site = siteId ? this.sites.find(s => s.id === siteId) : undefined;
    
    this.logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      siteId,
      siteName: site?.name,
      event,
      message,
      details,
      timestamp: new Date().toISOString(),
    });

    this.saveLogs();
  }

  // Configuration
  getConfig(): WACHSConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<WACHSConfig>): Promise<WACHSConfig> {
    await this.initialize();

    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveConfig();
    this.addLog('info', 'Configuration updated', undefined, updates);

    return this.config;
  }

  // Connection management
  async connect(): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    if (!this.config.primaryGateway) {
      return { success: false, message: 'Primary gateway not configured' };
    }

    // Validate auth configuration
    const authConfig = AUTH_METHODS[this.config.authMethod];
    for (const field of authConfig.requiredFields) {
      if (!this.config[field as keyof WACHSConfig]) {
        return { success: false, message: `Missing required field: ${field}` };
      }
    }

    this.config.status = 'connecting';
    await this.saveConfig();
    this.addLog('info', 'Initiating WAN connection');

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (Math.random() > 0.1) {
      this.config.status = 'connected';
      this.config.lastConnected = new Date().toISOString();
      this.config.lastError = undefined;
      await this.saveConfig();
      this.addLog('connect', 'Successfully connected to WACHS WAN');

      // Update site connections
      await this.refreshSiteConnections();

      return { success: true, message: 'Successfully connected to WACHS WAN' };
    } else {
      this.config.status = 'error';
      this.config.lastError = 'Connection timeout';
      await this.saveConfig();
      this.addLog('error', 'Failed to connect to WACHS WAN', undefined, { error: 'Connection timeout' });

      return { success: false, message: 'Connection timeout' };
    }
  }

  async disconnect(): Promise<void> {
    this.config.status = 'disconnected';
    this.connections = [];
    
    for (const site of this.sites) {
      site.status = 'disconnected';
      site.lastSeen = undefined;
    }

    await Promise.all([
      this.saveConfig(),
      this.saveSites(),
      this.saveConnections(),
    ]);

    this.addLog('disconnect', 'Disconnected from WACHS WAN');
  }

  async testConnection(): Promise<{ success: boolean; latency: number; message: string }> {
    if (this.config.status !== 'connected') {
      return { success: false, latency: 0, message: 'Not connected to WACHS WAN' };
    }

    // Simulate ping test
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    const latency = Math.floor(10 + Math.random() * 40);

    this.addLog('info', `Connection test completed: ${latency}ms latency`);

    return { success: true, latency, message: `Connection healthy. Latency: ${latency}ms` };
  }

  // Site management
  getSites(): WACHSSite[] {
    return [...this.sites];
  }

  getSitesByRegion(region: WACHSRegion): WACHSSite[] {
    return this.sites.filter(s => s.region === region);
  }

  getSite(id: string): WACHSSite | undefined {
    return this.sites.find(s => s.id === id);
  }

  async addSite(site: Omit<WACHSSite, 'id' | 'status' | 'createdAt'>): Promise<WACHSSite> {
    await this.initialize();

    const newSite: WACHSSite = {
      ...site,
      id: `site_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'disconnected',
      createdAt: new Date().toISOString(),
    };

    this.sites.push(newSite);
    await this.saveSites();
    this.addLog('info', `Site added: ${newSite.name}`, newSite.id);

    return newSite;
  }

  async updateSite(id: string, updates: Partial<WACHSSite>): Promise<WACHSSite | null> {
    const index = this.sites.findIndex(s => s.id === id);
    if (index === -1) return null;

    this.sites[index] = {
      ...this.sites[index],
      ...updates,
    };

    await this.saveSites();
    return this.sites[index];
  }

  async removeSite(id: string): Promise<boolean> {
    const index = this.sites.findIndex(s => s.id === id);
    if (index === -1) return false;

    const site = this.sites[index];
    this.sites.splice(index, 1);
    this.connections = this.connections.filter(c => c.siteId !== id);

    await Promise.all([
      this.saveSites(),
      this.saveConnections(),
    ]);

    this.addLog('info', `Site removed: ${site.name}`, id);
    return true;
  }

  // Connection monitoring
  async refreshSiteConnections(): Promise<void> {
    if (this.config.status !== 'connected') return;

    this.connections = [];

    for (const site of this.sites) {
      // Simulate connection check
      const isConnected = Math.random() > 0.1;
      const latency = Math.floor(10 + Math.random() * 50);
      const packetLoss = Math.random() * 2;

      site.status = isConnected ? (latency > 40 ? 'degraded' : 'connected') : 'error';
      site.latency = latency;
      site.lastSeen = new Date().toISOString();

      const connection: WANConnection = {
        id: `conn_${site.id}`,
        siteId: site.id,
        siteName: site.name,
        protocol: this.config.networkProtocol,
        status: site.status,
        latency,
        packetLoss,
        bandwidth: {
          upload: site.bandwidth ? site.bandwidth * 0.8 : 100,
          download: site.bandwidth || 100,
        },
        uptime: Math.random() * 100,
        lastCheck: new Date().toISOString(),
        errors: site.status === 'error' ? ['Connection timeout'] : [],
      };

      this.connections.push(connection);
    }

    await Promise.all([
      this.saveSites(),
      this.saveConnections(),
    ]);
  }

  getConnections(): WANConnection[] {
    return [...this.connections];
  }

  getSiteConnection(siteId: string): WANConnection | undefined {
    return this.connections.find(c => c.siteId === siteId);
  }

  // Logs
  getLogs(siteId?: string): ConnectionLog[] {
    let logs = [...this.logs];
    if (siteId) {
      logs = logs.filter(l => l.siteId === siteId);
    }
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async clearLogs(siteId?: string): Promise<void> {
    if (siteId) {
      this.logs = this.logs.filter(l => l.siteId !== siteId);
    } else {
      this.logs = [];
    }
    await this.saveLogs();
  }

  // Statistics
  getStatistics(): {
    isConnected: boolean;
    totalSites: number;
    connectedSites: number;
    degradedSites: number;
    errorSites: number;
    averageLatency: number;
    byRegion: Record<WACHSRegion, number>;
    byType: Record<SiteType, number>;
  } {
    const stats = {
      isConnected: this.config.status === 'connected',
      totalSites: this.sites.length,
      connectedSites: this.sites.filter(s => s.status === 'connected').length,
      degradedSites: this.sites.filter(s => s.status === 'degraded').length,
      errorSites: this.sites.filter(s => s.status === 'error').length,
      averageLatency: 0,
      byRegion: {} as Record<WACHSRegion, number>,
      byType: {} as Record<SiteType, number>,
    };

    // Calculate average latency
    const connectedSites = this.sites.filter(s => s.latency !== undefined);
    if (connectedSites.length > 0) {
      stats.averageLatency = Math.round(
        connectedSites.reduce((sum, s) => sum + (s.latency || 0), 0) / connectedSites.length
      );
    }

    // Count by region
    for (const region of Object.keys(WACHS_REGIONS) as WACHSRegion[]) {
      stats.byRegion[region] = this.sites.filter(s => s.region === region).length;
    }

    // Count by type
    const types: SiteType[] = ['hospital', 'clinic', 'aged_care', 'community_health', 'admin', 'data_center'];
    for (const type of types) {
      stats.byType[type] = this.sites.filter(s => s.type === type).length;
    }

    return stats;
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify({
      config: { 
        ...this.config, 
        apiKey: undefined,
        radiusSecret: undefined,
        oauthClientSecret: undefined,
      },
      sites: this.sites,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const wachsWANService = new WACHSWANService();
