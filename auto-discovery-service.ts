/**
 * Dependency Auto-Discovery Service
 * Automatically detect new service connections using network traffic analysis
 * MediVac One v6.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  DISCOVERIES: 'medivac_discoveries',
  DISCOVERY_RULES: 'medivac_discovery_rules',
  DISCOVERY_HISTORY: 'medivac_discovery_history',
};

// Types
export type DiscoveryStatus = 'pending' | 'validated' | 'rejected' | 'false_positive';
export type ConnectionType = 'api' | 'database' | 'file_share' | 'authentication' | 'messaging' | 'monitoring' | 'backup';
export type DiscoveryMethod = 'traffic_analysis' | 'port_scan' | 'dns_lookup' | 'service_registry' | 'manual';

export interface DiscoveredConnection {
  id: string;
  sourceSiteId: string;
  sourceSiteName: string;
  targetSiteId: string;
  targetSiteName: string;
  connectionType: ConnectionType;
  protocol: string;
  port: number;
  discoveryMethod: DiscoveryMethod;
  status: DiscoveryStatus;
  firstSeen: string;
  lastSeen: string;
  trafficVolume: number; // bytes
  requestCount: number;
  latency: number; // ms
  isEncrypted: boolean;
  serviceName?: string;
  description?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export interface DiscoveryRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  method: DiscoveryMethod;
  schedule: string; // cron expression
  targetPorts: number[];
  excludedSites: string[];
  minTrafficThreshold: number; // bytes
  autoValidate: boolean;
  notifyOnDiscovery: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

export interface DiscoveryRun {
  id: string;
  ruleId: string;
  ruleName: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  sitesScanned: number;
  connectionsFound: number;
  newConnections: number;
  duration: number; // seconds
  errorMessage?: string;
}

export interface DiscoveryStats {
  totalDiscoveries: number;
  pendingValidation: number;
  validatedConnections: number;
  falsePositives: number;
  activeRules: number;
  lastDiscoveryRun?: string;
  averageLatency: number;
}

// Sample data
const SAMPLE_DISCOVERIES: DiscoveredConnection[] = [
  {
    id: 'disc_1',
    sourceSiteId: 'site_perth',
    sourceSiteName: 'Perth Metropolitan',
    targetSiteId: 'site_geraldton',
    targetSiteName: 'Geraldton Regional',
    connectionType: 'api',
    protocol: 'HTTPS',
    port: 443,
    discoveryMethod: 'traffic_analysis',
    status: 'pending',
    firstSeen: new Date(Date.now() - 3600000).toISOString(),
    lastSeen: new Date().toISOString(),
    trafficVolume: 52428800, // 50MB
    requestCount: 1250,
    latency: 45,
    isEncrypted: true,
    serviceName: 'Patient Records API',
    description: 'New API connection detected for patient record synchronization',
  },
  {
    id: 'disc_2',
    sourceSiteId: 'site_bunbury',
    sourceSiteName: 'Bunbury Regional',
    targetSiteId: 'site_perth',
    targetSiteName: 'Perth Metropolitan',
    connectionType: 'database',
    protocol: 'PostgreSQL',
    port: 5432,
    discoveryMethod: 'port_scan',
    status: 'validated',
    firstSeen: new Date(Date.now() - 604800000).toISOString(),
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    trafficVolume: 157286400, // 150MB
    requestCount: 8500,
    latency: 28,
    isEncrypted: true,
    serviceName: 'Central Database Replication',
    validatedBy: 'Sarah Mitchell',
    validatedAt: new Date(Date.now() - 518400000).toISOString(),
  },
  {
    id: 'disc_3',
    sourceSiteId: 'site_kalgoorlie',
    sourceSiteName: 'Kalgoorlie Regional',
    targetSiteId: 'site_albany',
    targetSiteName: 'Albany Regional',
    connectionType: 'file_share',
    protocol: 'SMB',
    port: 445,
    discoveryMethod: 'traffic_analysis',
    status: 'false_positive',
    firstSeen: new Date(Date.now() - 259200000).toISOString(),
    lastSeen: new Date(Date.now() - 172800000).toISOString(),
    trafficVolume: 1048576, // 1MB
    requestCount: 15,
    latency: 120,
    isEncrypted: false,
    rejectionReason: 'Temporary file transfer, not a persistent connection',
  },
  {
    id: 'disc_4',
    sourceSiteId: 'site_broome',
    sourceSiteName: 'Broome Regional',
    targetSiteId: 'site_perth',
    targetSiteName: 'Perth Metropolitan',
    connectionType: 'authentication',
    protocol: 'LDAPS',
    port: 636,
    discoveryMethod: 'dns_lookup',
    status: 'validated',
    firstSeen: new Date(Date.now() - 1209600000).toISOString(),
    lastSeen: new Date().toISOString(),
    trafficVolume: 10485760, // 10MB
    requestCount: 25000,
    latency: 85,
    isEncrypted: true,
    serviceName: 'Central Authentication',
    validatedBy: 'Dr. Emily Chen',
    validatedAt: new Date(Date.now() - 1123200000).toISOString(),
  },
  {
    id: 'disc_5',
    sourceSiteId: 'site_geraldton',
    sourceSiteName: 'Geraldton Regional',
    targetSiteId: 'site_perth',
    targetSiteName: 'Perth Metropolitan',
    connectionType: 'monitoring',
    protocol: 'HTTPS',
    port: 8443,
    discoveryMethod: 'service_registry',
    status: 'pending',
    firstSeen: new Date(Date.now() - 7200000).toISOString(),
    lastSeen: new Date().toISOString(),
    trafficVolume: 5242880, // 5MB
    requestCount: 500,
    latency: 35,
    isEncrypted: true,
    serviceName: 'Health Monitoring Agent',
    description: 'New monitoring connection for site health metrics',
  },
];

const SAMPLE_RULES: DiscoveryRule[] = [
  {
    id: 'rule_1',
    name: 'Daily Traffic Analysis',
    description: 'Analyze network traffic patterns to detect new service connections',
    isEnabled: true,
    method: 'traffic_analysis',
    schedule: '0 2 * * *',
    targetPorts: [80, 443, 8080, 8443, 5432, 3306, 1433],
    excludedSites: [],
    minTrafficThreshold: 1048576, // 1MB
    autoValidate: false,
    notifyOnDiscovery: true,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 43200000).toISOString(),
  },
  {
    id: 'rule_2',
    name: 'Weekly Port Scan',
    description: 'Scan for open ports and new services across all WACHS sites',
    isEnabled: true,
    method: 'port_scan',
    schedule: '0 3 * * 0',
    targetPorts: [22, 80, 443, 445, 636, 1433, 3306, 5432, 8080, 8443],
    excludedSites: [],
    minTrafficThreshold: 0,
    autoValidate: false,
    notifyOnDiscovery: true,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    lastRun: new Date(Date.now() - 432000000).toISOString(),
    nextRun: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: 'rule_3',
    name: 'Service Registry Sync',
    description: 'Sync with service registry to discover registered services',
    isEnabled: true,
    method: 'service_registry',
    schedule: '0 */6 * * *',
    targetPorts: [],
    excludedSites: [],
    minTrafficThreshold: 0,
    autoValidate: true,
    notifyOnDiscovery: false,
    createdAt: new Date(Date.now() - 1296000000).toISOString(),
    lastRun: new Date(Date.now() - 21600000).toISOString(),
    nextRun: new Date(Date.now() + 21600000).toISOString(),
  },
];

const SAMPLE_RUNS: DiscoveryRun[] = [
  {
    id: 'run_1',
    ruleId: 'rule_1',
    ruleName: 'Daily Traffic Analysis',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86100000).toISOString(),
    status: 'completed',
    sitesScanned: 7,
    connectionsFound: 45,
    newConnections: 2,
    duration: 300,
  },
  {
    id: 'run_2',
    ruleId: 'rule_2',
    ruleName: 'Weekly Port Scan',
    startedAt: new Date(Date.now() - 432000000).toISOString(),
    completedAt: new Date(Date.now() - 430800000).toISOString(),
    status: 'completed',
    sitesScanned: 7,
    connectionsFound: 128,
    newConnections: 5,
    duration: 1200,
  },
];

class AutoDiscoveryService {
  private discoveries: DiscoveredConnection[] = [];
  private rules: DiscoveryRule[] = [];
  private runs: DiscoveryRun[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [discoveriesData, rulesData, historyData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DISCOVERIES),
        AsyncStorage.getItem(STORAGE_KEYS.DISCOVERY_RULES),
        AsyncStorage.getItem(STORAGE_KEYS.DISCOVERY_HISTORY),
      ]);

      this.discoveries = discoveriesData ? JSON.parse(discoveriesData) : SAMPLE_DISCOVERIES;
      this.rules = rulesData ? JSON.parse(rulesData) : SAMPLE_RULES;
      this.runs = historyData ? JSON.parse(historyData) : SAMPLE_RUNS;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auto-discovery service:', error);
      this.discoveries = SAMPLE_DISCOVERIES;
      this.rules = SAMPLE_RULES;
      this.runs = SAMPLE_RUNS;
      this.initialized = true;
    }
  }

  private async saveDiscoveries(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISCOVERIES, JSON.stringify(this.discoveries));
    } catch (error) {
      console.error('Failed to save discoveries:', error);
    }
  }

  private async saveRules(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISCOVERY_RULES, JSON.stringify(this.rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  }

  private async saveRuns(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISCOVERY_HISTORY, JSON.stringify(this.runs));
    } catch (error) {
      console.error('Failed to save runs:', error);
    }
  }

  // Discoveries
  getDiscoveries(): DiscoveredConnection[] {
    return [...this.discoveries].sort((a, b) => 
      new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime()
    );
  }

  getDiscovery(id: string): DiscoveredConnection | undefined {
    return this.discoveries.find(d => d.id === id);
  }

  getPendingDiscoveries(): DiscoveredConnection[] {
    return this.discoveries.filter(d => d.status === 'pending');
  }

  getValidatedDiscoveries(): DiscoveredConnection[] {
    return this.discoveries.filter(d => d.status === 'validated');
  }

  async validateDiscovery(id: string, validatedBy: string, description?: string): Promise<DiscoveredConnection | null> {
    const discovery = this.discoveries.find(d => d.id === id);
    if (!discovery) return null;

    discovery.status = 'validated';
    discovery.validatedBy = validatedBy;
    discovery.validatedAt = new Date().toISOString();
    if (description) {
      discovery.description = description;
    }

    await this.saveDiscoveries();
    return discovery;
  }

  async rejectDiscovery(id: string, reason: string): Promise<DiscoveredConnection | null> {
    const discovery = this.discoveries.find(d => d.id === id);
    if (!discovery) return null;

    discovery.status = 'rejected';
    discovery.rejectionReason = reason;

    await this.saveDiscoveries();
    return discovery;
  }

  async markAsFalsePositive(id: string, reason: string): Promise<DiscoveredConnection | null> {
    const discovery = this.discoveries.find(d => d.id === id);
    if (!discovery) return null;

    discovery.status = 'false_positive';
    discovery.rejectionReason = reason;

    await this.saveDiscoveries();
    return discovery;
  }

  // Rules
  getRules(): DiscoveryRule[] {
    return [...this.rules];
  }

  getRule(id: string): DiscoveryRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  async toggleRule(id: string): Promise<DiscoveryRule | null> {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return null;

    rule.isEnabled = !rule.isEnabled;
    await this.saveRules();
    return rule;
  }

  async createRule(input: Omit<DiscoveryRule, 'id' | 'createdAt'>): Promise<DiscoveryRule> {
    const rule: DiscoveryRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...input,
      createdAt: new Date().toISOString(),
    };

    this.rules.push(rule);
    await this.saveRules();
    return rule;
  }

  async runDiscovery(ruleId: string): Promise<DiscoveryRun> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    const run: DiscoveryRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ruleId,
      ruleName: rule.name,
      startedAt: new Date().toISOString(),
      status: 'running',
      sitesScanned: 0,
      connectionsFound: 0,
      newConnections: 0,
      duration: 0,
    };

    this.runs.push(run);
    await this.saveRuns();

    // Simulate discovery run
    await new Promise(resolve => setTimeout(resolve, 1000));

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.sitesScanned = 7;
    run.connectionsFound = Math.floor(Math.random() * 50) + 20;
    run.newConnections = Math.floor(Math.random() * 3);
    run.duration = Math.floor(Math.random() * 300) + 60;

    rule.lastRun = new Date().toISOString();
    
    await Promise.all([this.saveRuns(), this.saveRules()]);
    return run;
  }

  // Runs
  getRuns(): DiscoveryRun[] {
    return [...this.runs].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  // Statistics
  getStats(): DiscoveryStats {
    const pending = this.discoveries.filter(d => d.status === 'pending').length;
    const validated = this.discoveries.filter(d => d.status === 'validated').length;
    const falsePositives = this.discoveries.filter(d => d.status === 'false_positive').length;
    const activeRules = this.rules.filter(r => r.isEnabled).length;
    
    const latencies = this.discoveries.map(d => d.latency);
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;

    const lastRun = this.runs.length > 0 
      ? this.runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0].startedAt
      : undefined;

    return {
      totalDiscoveries: this.discoveries.length,
      pendingValidation: pending,
      validatedConnections: validated,
      falsePositives,
      activeRules,
      lastDiscoveryRun: lastRun,
      averageLatency: Math.round(avgLatency),
    };
  }

  // Connection types
  getConnectionTypes(): ConnectionType[] {
    return ['api', 'database', 'file_share', 'authentication', 'messaging', 'monitoring', 'backup'];
  }

  getDiscoveryMethods(): DiscoveryMethod[] {
    return ['traffic_analysis', 'port_scan', 'dns_lookup', 'service_registry', 'manual'];
  }
}

export const autoDiscoveryService = new AutoDiscoveryService();
