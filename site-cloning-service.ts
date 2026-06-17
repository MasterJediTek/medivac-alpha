/**
 * WACHS Site Cloning Service
 * Duplicate existing site configurations for new site provisioning
 * MediVac One v5.9
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CLONE_HISTORY: 'medivac_clone_history',
  CLONE_TEMPLATES: 'medivac_clone_templates',
};

// Types
export type CloneStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type CloneOption = 'network' | 'services' | 'contacts' | 'authentication' | 'policies' | 'integrations';

export interface SiteConfiguration {
  id: string;
  name: string;
  code: string;
  region: string;
  type: 'hospital' | 'clinic' | 'health_center' | 'nursing_post' | 'remote_clinic';
  network: NetworkConfig;
  services: ServiceConfig[];
  contacts: ContactInfo[];
  authentication: AuthConfig;
  policies: PolicyConfig[];
  integrations: IntegrationConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface NetworkConfig {
  primaryVlan: number;
  secondaryVlan?: number;
  ipRange: string;
  gateway: string;
  dnsServers: string[];
  vpnEndpoint: string;
  bandwidth: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  enabled: boolean;
  endpoint?: string;
  port?: number;
}

export interface ContactInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface AuthConfig {
  method: 'certificate' | 'radius' | 'ldap' | 'oauth2';
  serverUrl: string;
  domain?: string;
  certificateExpiry?: string;
}

export interface PolicyConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  endpoint?: string;
}

export interface CloneRequest {
  id: string;
  sourceSiteId: string;
  sourceSiteName: string;
  targetSiteName: string;
  targetSiteCode: string;
  targetRegion: string;
  selectedOptions: CloneOption[];
  adjustments: CloneAdjustments;
  status: CloneStatus;
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  resultSiteId?: string;
}

export interface CloneAdjustments {
  network?: Partial<NetworkConfig>;
  contacts?: ContactInfo[];
  newName?: string;
  newCode?: string;
}

export interface CloneComparison {
  option: CloneOption;
  sourceValue: string;
  targetValue: string;
  willChange: boolean;
}

// Sample existing sites
const EXISTING_SITES: SiteConfiguration[] = [
  {
    id: 'site_geraldton',
    name: 'Geraldton Regional Hospital',
    code: 'GRH',
    region: 'midwest',
    type: 'hospital',
    network: {
      primaryVlan: 100,
      secondaryVlan: 101,
      ipRange: '10.50.0.0/16',
      gateway: '10.50.0.1',
      dnsServers: ['10.50.0.10', '10.50.0.11'],
      vpnEndpoint: 'vpn-grh.wachs.health.wa.gov.au',
      bandwidth: '1Gbps',
    },
    services: [
      { id: 'svc_ehr', name: 'Electronic Health Records', enabled: true, endpoint: 'ehr.grh.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_pacs', name: 'PACS Imaging', enabled: true, endpoint: 'pacs.grh.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_lab', name: 'Laboratory System', enabled: true, endpoint: 'lab.grh.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_pharmacy', name: 'Pharmacy System', enabled: true, endpoint: 'pharmacy.grh.wachs.health.wa.gov.au', port: 443 },
    ],
    contacts: [
      { id: 'contact_1', name: 'Dr. Sarah Mitchell', role: 'Clinical Director', email: 'sarah.mitchell@health.wa.gov.au', phone: '08 9956 2222', isPrimary: true },
      { id: 'contact_2', name: 'James Wilson', role: 'IT Manager', email: 'james.wilson@health.wa.gov.au', phone: '08 9956 2223', isPrimary: false },
    ],
    authentication: {
      method: 'certificate',
      serverUrl: 'https://auth.wachs.health.wa.gov.au',
      domain: 'WACHS',
      certificateExpiry: '2026-12-31',
    },
    policies: [
      { id: 'pol_1', name: 'Data Retention Policy', type: 'compliance', enabled: true },
      { id: 'pol_2', name: 'Access Control Policy', type: 'security', enabled: true },
    ],
    integrations: [
      { id: 'int_1', name: 'Medicare Online', type: 'billing', enabled: true, endpoint: 'https://eclipse.health.gov.au' },
      { id: 'int_2', name: 'PathWest', type: 'laboratory', enabled: true, endpoint: 'https://pathwest.health.wa.gov.au' },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: 'site_kalgoorlie',
    name: 'Kalgoorlie Health Campus',
    code: 'KHC',
    region: 'goldfields',
    type: 'hospital',
    network: {
      primaryVlan: 200,
      secondaryVlan: 201,
      ipRange: '10.60.0.0/16',
      gateway: '10.60.0.1',
      dnsServers: ['10.60.0.10', '10.60.0.11'],
      vpnEndpoint: 'vpn-khc.wachs.health.wa.gov.au',
      bandwidth: '500Mbps',
    },
    services: [
      { id: 'svc_ehr', name: 'Electronic Health Records', enabled: true, endpoint: 'ehr.khc.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_pacs', name: 'PACS Imaging', enabled: true, endpoint: 'pacs.khc.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_lab', name: 'Laboratory System', enabled: true, endpoint: 'lab.khc.wachs.health.wa.gov.au', port: 443 },
    ],
    contacts: [
      { id: 'contact_1', name: 'Dr. Michael Brown', role: 'Clinical Director', email: 'michael.brown@health.wa.gov.au', phone: '08 9080 5888', isPrimary: true },
    ],
    authentication: {
      method: 'radius',
      serverUrl: 'https://radius.wachs.health.wa.gov.au',
      domain: 'WACHS',
    },
    policies: [
      { id: 'pol_1', name: 'Data Retention Policy', type: 'compliance', enabled: true },
      { id: 'pol_2', name: 'Access Control Policy', type: 'security', enabled: true },
    ],
    integrations: [
      { id: 'int_1', name: 'Medicare Online', type: 'billing', enabled: true, endpoint: 'https://eclipse.health.gov.au' },
    ],
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
  },
  {
    id: 'site_broome',
    name: 'Broome Hospital',
    code: 'BRH',
    region: 'kimberley',
    type: 'hospital',
    network: {
      primaryVlan: 300,
      ipRange: '10.70.0.0/16',
      gateway: '10.70.0.1',
      dnsServers: ['10.70.0.10'],
      vpnEndpoint: 'vpn-brh.wachs.health.wa.gov.au',
      bandwidth: '200Mbps',
    },
    services: [
      { id: 'svc_ehr', name: 'Electronic Health Records', enabled: true, endpoint: 'ehr.brh.wachs.health.wa.gov.au', port: 443 },
      { id: 'svc_telehealth', name: 'Telehealth', enabled: true, endpoint: 'telehealth.brh.wachs.health.wa.gov.au', port: 443 },
    ],
    contacts: [
      { id: 'contact_1', name: 'Dr. Emily Chen', role: 'Clinical Director', email: 'emily.chen@health.wa.gov.au', phone: '08 9194 2222', isPrimary: true },
    ],
    authentication: {
      method: 'ldap',
      serverUrl: 'ldap://ldap.wachs.health.wa.gov.au',
      domain: 'WACHS',
    },
    policies: [
      { id: 'pol_1', name: 'Remote Access Policy', type: 'security', enabled: true },
    ],
    integrations: [
      { id: 'int_1', name: 'Medicare Online', type: 'billing', enabled: true, endpoint: 'https://eclipse.health.gov.au' },
    ],
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2025-01-15T16:00:00Z',
  },
];

// Clone options configuration
export const CLONE_OPTIONS: { id: CloneOption; label: string; description: string; icon: string }[] = [
  { id: 'network', label: 'Network Configuration', description: 'VLAN, IP ranges, VPN settings', icon: 'network' },
  { id: 'services', label: 'Services', description: 'EHR, PACS, Lab systems', icon: 'server.rack' },
  { id: 'contacts', label: 'Contact Information', description: 'Staff contacts and roles', icon: 'person.2.fill' },
  { id: 'authentication', label: 'Authentication', description: 'Auth method and credentials', icon: 'key.fill' },
  { id: 'policies', label: 'Policies', description: 'Compliance and security policies', icon: 'doc.text.fill' },
  { id: 'integrations', label: 'Integrations', description: 'External system connections', icon: 'link' },
];

class SiteCloningService {
  private cloneHistory: CloneRequest[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.CLONE_HISTORY);
      this.cloneHistory = historyData ? JSON.parse(historyData) : [];
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize site cloning service:', error);
      this.initialized = true;
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLONE_HISTORY, JSON.stringify(this.cloneHistory));
    } catch (error) {
      console.error('Failed to save clone history:', error);
    }
  }

  // Get available sites for cloning
  getAvailableSites(): SiteConfiguration[] {
    return [...EXISTING_SITES];
  }

  getSite(siteId: string): SiteConfiguration | undefined {
    return EXISTING_SITES.find(s => s.id === siteId);
  }

  getSitesByRegion(region: string): SiteConfiguration[] {
    return EXISTING_SITES.filter(s => s.region === region);
  }

  getRegions(): string[] {
    return [...new Set(EXISTING_SITES.map(s => s.region))];
  }

  // Clone operations
  async createCloneRequest(input: {
    sourceSiteId: string;
    targetSiteName: string;
    targetSiteCode: string;
    targetRegion: string;
    selectedOptions: CloneOption[];
    adjustments?: CloneAdjustments;
  }): Promise<CloneRequest> {
    await this.initialize();

    const sourceSite = this.getSite(input.sourceSiteId);
    if (!sourceSite) {
      throw new Error('Source site not found');
    }

    const request: CloneRequest = {
      id: `clone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sourceSiteId: input.sourceSiteId,
      sourceSiteName: sourceSite.name,
      targetSiteName: input.targetSiteName,
      targetSiteCode: input.targetSiteCode,
      targetRegion: input.targetRegion,
      selectedOptions: input.selectedOptions,
      adjustments: input.adjustments || {},
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this.cloneHistory.unshift(request);
    await this.saveHistory();

    return request;
  }

  async executeClone(requestId: string): Promise<CloneRequest> {
    const request = this.cloneHistory.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Clone request not found');
    }

    request.status = 'in_progress';
    request.progress = 0;
    await this.saveHistory();

    // Simulate cloning process
    const steps = request.selectedOptions.length;
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      request.progress = Math.round(((i + 1) / steps) * 100);
      await this.saveHistory();
    }

    // Complete the clone
    request.status = 'completed';
    request.progress = 100;
    request.completedAt = new Date().toISOString();
    request.resultSiteId = `site_${request.targetSiteCode.toLowerCase()}_${Date.now()}`;
    await this.saveHistory();

    return request;
  }

  async cancelClone(requestId: string): Promise<boolean> {
    const request = this.cloneHistory.find(r => r.id === requestId);
    if (!request || request.status === 'completed') return false;

    request.status = 'cancelled';
    await this.saveHistory();
    return true;
  }

  // Comparison
  generateComparison(sourceSiteId: string, targetConfig: Partial<SiteConfiguration>): CloneComparison[] {
    const sourceSite = this.getSite(sourceSiteId);
    if (!sourceSite) return [];

    const comparisons: CloneComparison[] = [];

    // Network comparison
    if (targetConfig.network) {
      comparisons.push({
        option: 'network',
        sourceValue: `VLAN ${sourceSite.network.primaryVlan}, ${sourceSite.network.ipRange}`,
        targetValue: `VLAN ${targetConfig.network.primaryVlan || 'TBD'}, ${targetConfig.network.ipRange || 'TBD'}`,
        willChange: true,
      });
    } else {
      comparisons.push({
        option: 'network',
        sourceValue: `VLAN ${sourceSite.network.primaryVlan}, ${sourceSite.network.ipRange}`,
        targetValue: `VLAN ${sourceSite.network.primaryVlan}, ${sourceSite.network.ipRange}`,
        willChange: false,
      });
    }

    // Services comparison
    comparisons.push({
      option: 'services',
      sourceValue: `${sourceSite.services.filter(s => s.enabled).length} active services`,
      targetValue: `${sourceSite.services.filter(s => s.enabled).length} active services`,
      willChange: false,
    });

    // Contacts comparison
    comparisons.push({
      option: 'contacts',
      sourceValue: `${sourceSite.contacts.length} contacts`,
      targetValue: targetConfig.contacts ? `${targetConfig.contacts.length} contacts` : 'To be configured',
      willChange: true,
    });

    // Authentication comparison
    comparisons.push({
      option: 'authentication',
      sourceValue: sourceSite.authentication.method.toUpperCase(),
      targetValue: sourceSite.authentication.method.toUpperCase(),
      willChange: false,
    });

    // Policies comparison
    comparisons.push({
      option: 'policies',
      sourceValue: `${sourceSite.policies.length} policies`,
      targetValue: `${sourceSite.policies.length} policies`,
      willChange: false,
    });

    // Integrations comparison
    comparisons.push({
      option: 'integrations',
      sourceValue: `${sourceSite.integrations.filter(i => i.enabled).length} integrations`,
      targetValue: `${sourceSite.integrations.filter(i => i.enabled).length} integrations`,
      willChange: false,
    });

    return comparisons;
  }

  // History
  getCloneHistory(): CloneRequest[] {
    return [...this.cloneHistory];
  }

  getCloneRequest(requestId: string): CloneRequest | undefined {
    return this.cloneHistory.find(r => r.id === requestId);
  }

  async deleteCloneRequest(requestId: string): Promise<boolean> {
    const index = this.cloneHistory.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    this.cloneHistory.splice(index, 1);
    await this.saveHistory();
    return true;
  }

  // Statistics
  getStatistics(): {
    totalSites: number;
    totalClones: number;
    successfulClones: number;
    failedClones: number;
    pendingClones: number;
    byRegion: Record<string, number>;
  } {
    const byRegion: Record<string, number> = {};
    EXISTING_SITES.forEach(site => {
      byRegion[site.region] = (byRegion[site.region] || 0) + 1;
    });

    return {
      totalSites: EXISTING_SITES.length,
      totalClones: this.cloneHistory.length,
      successfulClones: this.cloneHistory.filter(c => c.status === 'completed').length,
      failedClones: this.cloneHistory.filter(c => c.status === 'failed').length,
      pendingClones: this.cloneHistory.filter(c => c.status === 'pending' || c.status === 'in_progress').length,
      byRegion,
    };
  }

  // Export
  exportSiteConfig(siteId: string): string {
    const site = this.getSite(siteId);
    if (!site) return '';

    return JSON.stringify({
      site,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const siteCloningService = new SiteCloningService();
