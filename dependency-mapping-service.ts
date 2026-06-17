/**
 * WACHS Site Dependency Mapping Service
 * Visualize service dependencies between sites to identify cascade failure risks
 * MediVac One v6.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  DEPENDENCIES: 'medivac_dependencies',
  SERVICES: 'medivac_dependency_services',
  ALERTS: 'medivac_dependency_alerts',
};

// Types
export type DependencyType = 'network' | 'data' | 'authentication' | 'api' | 'storage' | 'messaging';
export type DependencyCriticality = 'critical' | 'high' | 'medium' | 'low';
export type DependencyStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type ServiceType = 'database' | 'api' | 'auth' | 'storage' | 'messaging' | 'network' | 'application';

export interface WACHSSite {
  id: string;
  name: string;
  region: string;
  type: 'hospital' | 'clinic' | 'hub' | 'datacenter';
  location: string;
  status: DependencyStatus;
  services: string[]; // service IDs
}

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  hostSiteId: string;
  status: DependencyStatus;
  uptime: number; // percentage
  lastCheck: string;
  endpoints: string[];
}

export interface Dependency {
  id: string;
  sourceSiteId: string;
  targetSiteId: string;
  sourceServiceId: string;
  targetServiceId: string;
  type: DependencyType;
  criticality: DependencyCriticality;
  status: DependencyStatus;
  latency: number; // ms
  bandwidth: number; // Mbps
  description: string;
  failoverAvailable: boolean;
  failoverTargetId?: string;
  lastValidated: string;
}

export interface CascadeRisk {
  id: string;
  triggerSiteId: string;
  triggerServiceId: string;
  affectedSites: string[];
  affectedServices: string[];
  riskLevel: DependencyCriticality;
  estimatedImpact: number; // percentage of network affected
  mitigationSteps: string[];
  hasFailover: boolean;
}

export interface DependencyAlert {
  id: string;
  dependencyId: string;
  type: 'latency' | 'status' | 'cascade' | 'failover';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface DependencyStats {
  totalSites: number;
  totalServices: number;
  totalDependencies: number;
  healthyDependencies: number;
  degradedDependencies: number;
  downDependencies: number;
  criticalRisks: number;
  averageLatency: number;
  failoverCoverage: number;
}

// WACHS Regions
export const WACHS_REGIONS = {
  kimberley: { name: 'Kimberley', color: '#EF4444' },
  pilbara: { name: 'Pilbara', color: '#F59E0B' },
  midwest: { name: 'Midwest', color: '#10B981' },
  goldfields: { name: 'Goldfields', color: '#3B82F6' },
  wheatbelt: { name: 'Wheatbelt', color: '#8B5CF6' },
  southwest: { name: 'South West', color: '#EC4899' },
  greatSouthern: { name: 'Great Southern', color: '#06B6D4' },
};

export const DEPENDENCY_TYPES: Record<DependencyType, { label: string; color: string; icon: string }> = {
  network: { label: 'Network', color: '#3B82F6', icon: '🌐' },
  data: { label: 'Data Sync', color: '#10B981', icon: '📊' },
  authentication: { label: 'Authentication', color: '#8B5CF6', icon: '🔐' },
  api: { label: 'API', color: '#F59E0B', icon: '🔌' },
  storage: { label: 'Storage', color: '#EC4899', icon: '💾' },
  messaging: { label: 'Messaging', color: '#06B6D4', icon: '📨' },
};

export const SERVICE_TYPES: Record<ServiceType, { label: string; color: string }> = {
  database: { label: 'Database', color: '#3B82F6' },
  api: { label: 'API Gateway', color: '#10B981' },
  auth: { label: 'Authentication', color: '#8B5CF6' },
  storage: { label: 'File Storage', color: '#F59E0B' },
  messaging: { label: 'Message Queue', color: '#EC4899' },
  network: { label: 'Network', color: '#06B6D4' },
  application: { label: 'Application', color: '#6B7280' },
};

// Sample data
const SAMPLE_SITES: WACHSSite[] = [
  { id: 'site_perth_dc', name: 'Perth Data Center', region: 'southwest', type: 'datacenter', location: 'Perth CBD', status: 'healthy', services: ['svc_main_db', 'svc_auth', 'svc_storage'] },
  { id: 'site_broome', name: 'Broome Hospital', region: 'kimberley', type: 'hospital', location: 'Broome', status: 'healthy', services: ['svc_broome_app', 'svc_broome_cache'] },
  { id: 'site_kalgoorlie', name: 'Kalgoorlie Hospital', region: 'goldfields', type: 'hospital', location: 'Kalgoorlie', status: 'healthy', services: ['svc_kal_app'] },
  { id: 'site_geraldton', name: 'Geraldton Hospital', region: 'midwest', type: 'hospital', location: 'Geraldton', status: 'degraded', services: ['svc_gerald_app'] },
  { id: 'site_bunbury', name: 'Bunbury Hospital', region: 'southwest', type: 'hospital', location: 'Bunbury', status: 'healthy', services: ['svc_bunbury_app'] },
  { id: 'site_albany', name: 'Albany Hospital', region: 'greatSouthern', type: 'hospital', location: 'Albany', status: 'healthy', services: ['svc_albany_app'] },
  { id: 'site_karratha', name: 'Karratha Health Campus', region: 'pilbara', type: 'hospital', location: 'Karratha', status: 'healthy', services: ['svc_karratha_app'] },
  { id: 'site_northam', name: 'Northam Hospital', region: 'wheatbelt', type: 'hospital', location: 'Northam', status: 'healthy', services: ['svc_northam_app'] },
];

const SAMPLE_SERVICES: Service[] = [
  { id: 'svc_main_db', name: 'Primary Database', type: 'database', description: 'Central PostgreSQL cluster', hostSiteId: 'site_perth_dc', status: 'healthy', uptime: 99.99, lastCheck: new Date().toISOString(), endpoints: ['db.wachs.health.wa.gov.au:5432'] },
  { id: 'svc_auth', name: 'Authentication Service', type: 'auth', description: 'Azure AD integration', hostSiteId: 'site_perth_dc', status: 'healthy', uptime: 99.95, lastCheck: new Date().toISOString(), endpoints: ['auth.wachs.health.wa.gov.au'] },
  { id: 'svc_storage', name: 'Document Storage', type: 'storage', description: 'S3-compatible object storage', hostSiteId: 'site_perth_dc', status: 'healthy', uptime: 99.98, lastCheck: new Date().toISOString(), endpoints: ['storage.wachs.health.wa.gov.au'] },
  { id: 'svc_broome_app', name: 'Broome EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_broome', status: 'healthy', uptime: 99.5, lastCheck: new Date().toISOString(), endpoints: ['emr.broome.wachs.health.wa.gov.au'] },
  { id: 'svc_broome_cache', name: 'Broome Cache', type: 'database', description: 'Local Redis cache', hostSiteId: 'site_broome', status: 'healthy', uptime: 99.8, lastCheck: new Date().toISOString(), endpoints: ['cache.broome.wachs.health.wa.gov.au:6379'] },
  { id: 'svc_kal_app', name: 'Kalgoorlie EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_kalgoorlie', status: 'healthy', uptime: 99.3, lastCheck: new Date().toISOString(), endpoints: ['emr.kalgoorlie.wachs.health.wa.gov.au'] },
  { id: 'svc_gerald_app', name: 'Geraldton EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_geraldton', status: 'degraded', uptime: 97.5, lastCheck: new Date().toISOString(), endpoints: ['emr.geraldton.wachs.health.wa.gov.au'] },
  { id: 'svc_bunbury_app', name: 'Bunbury EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_bunbury', status: 'healthy', uptime: 99.7, lastCheck: new Date().toISOString(), endpoints: ['emr.bunbury.wachs.health.wa.gov.au'] },
  { id: 'svc_albany_app', name: 'Albany EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_albany', status: 'healthy', uptime: 99.6, lastCheck: new Date().toISOString(), endpoints: ['emr.albany.wachs.health.wa.gov.au'] },
  { id: 'svc_karratha_app', name: 'Karratha EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_karratha', status: 'healthy', uptime: 99.4, lastCheck: new Date().toISOString(), endpoints: ['emr.karratha.wachs.health.wa.gov.au'] },
  { id: 'svc_northam_app', name: 'Northam EMR', type: 'application', description: 'Electronic Medical Records', hostSiteId: 'site_northam', status: 'healthy', uptime: 99.5, lastCheck: new Date().toISOString(), endpoints: ['emr.northam.wachs.health.wa.gov.au'] },
];

const SAMPLE_DEPENDENCIES: Dependency[] = [
  // All sites depend on Perth DC for database
  { id: 'dep_1', sourceSiteId: 'site_broome', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_broome_app', targetServiceId: 'svc_main_db', type: 'data', criticality: 'critical', status: 'healthy', latency: 45, bandwidth: 100, description: 'Primary database connection', failoverAvailable: true, failoverTargetId: 'svc_broome_cache', lastValidated: new Date().toISOString() },
  { id: 'dep_2', sourceSiteId: 'site_kalgoorlie', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_kal_app', targetServiceId: 'svc_main_db', type: 'data', criticality: 'critical', status: 'healthy', latency: 25, bandwidth: 150, description: 'Primary database connection', failoverAvailable: false, lastValidated: new Date().toISOString() },
  { id: 'dep_3', sourceSiteId: 'site_geraldton', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_gerald_app', targetServiceId: 'svc_main_db', type: 'data', criticality: 'critical', status: 'degraded', latency: 120, bandwidth: 50, description: 'Primary database connection', failoverAvailable: false, lastValidated: new Date().toISOString() },
  { id: 'dep_4', sourceSiteId: 'site_bunbury', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_bunbury_app', targetServiceId: 'svc_main_db', type: 'data', criticality: 'critical', status: 'healthy', latency: 15, bandwidth: 200, description: 'Primary database connection', failoverAvailable: true, lastValidated: new Date().toISOString() },
  { id: 'dep_5', sourceSiteId: 'site_albany', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_albany_app', targetServiceId: 'svc_main_db', type: 'data', criticality: 'critical', status: 'healthy', latency: 35, bandwidth: 100, description: 'Primary database connection', failoverAvailable: false, lastValidated: new Date().toISOString() },
  // Authentication dependencies
  { id: 'dep_6', sourceSiteId: 'site_broome', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_broome_app', targetServiceId: 'svc_auth', type: 'authentication', criticality: 'critical', status: 'healthy', latency: 50, bandwidth: 10, description: 'SSO authentication', failoverAvailable: false, lastValidated: new Date().toISOString() },
  { id: 'dep_7', sourceSiteId: 'site_kalgoorlie', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_kal_app', targetServiceId: 'svc_auth', type: 'authentication', criticality: 'critical', status: 'healthy', latency: 30, bandwidth: 10, description: 'SSO authentication', failoverAvailable: false, lastValidated: new Date().toISOString() },
  // Storage dependencies
  { id: 'dep_8', sourceSiteId: 'site_broome', targetSiteId: 'site_perth_dc', sourceServiceId: 'svc_broome_app', targetServiceId: 'svc_storage', type: 'storage', criticality: 'high', status: 'healthy', latency: 60, bandwidth: 50, description: 'Document storage', failoverAvailable: true, lastValidated: new Date().toISOString() },
  // Inter-site dependencies
  { id: 'dep_9', sourceSiteId: 'site_karratha', targetSiteId: 'site_broome', sourceServiceId: 'svc_karratha_app', targetServiceId: 'svc_broome_cache', type: 'data', criticality: 'medium', status: 'healthy', latency: 80, bandwidth: 50, description: 'Regional cache sync', failoverAvailable: true, lastValidated: new Date().toISOString() },
  { id: 'dep_10', sourceSiteId: 'site_northam', targetSiteId: 'site_bunbury', sourceServiceId: 'svc_northam_app', targetServiceId: 'svc_bunbury_app', type: 'api', criticality: 'low', status: 'healthy', latency: 40, bandwidth: 25, description: 'Regional API fallback', failoverAvailable: true, lastValidated: new Date().toISOString() },
];

const SAMPLE_ALERTS: DependencyAlert[] = [
  { id: 'alert_1', dependencyId: 'dep_3', type: 'latency', severity: 'warning', message: 'High latency detected on Geraldton to Perth connection (120ms)', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'alert_2', dependencyId: 'dep_3', type: 'status', severity: 'critical', message: 'Geraldton EMR database connection degraded', createdAt: new Date(Date.now() - 1800000).toISOString() },
];

class DependencyMappingService {
  private sites: WACHSSite[] = [];
  private services: Service[] = [];
  private dependencies: Dependency[] = [];
  private alerts: DependencyAlert[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [depData, svcData, alertData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DEPENDENCIES),
        AsyncStorage.getItem(STORAGE_KEYS.SERVICES),
        AsyncStorage.getItem(STORAGE_KEYS.ALERTS),
      ]);

      this.dependencies = depData ? JSON.parse(depData) : SAMPLE_DEPENDENCIES;
      this.services = svcData ? JSON.parse(svcData) : SAMPLE_SERVICES;
      this.alerts = alertData ? JSON.parse(alertData) : SAMPLE_ALERTS;
      this.sites = SAMPLE_SITES;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize dependency mapping service:', error);
      this.dependencies = SAMPLE_DEPENDENCIES;
      this.services = SAMPLE_SERVICES;
      this.alerts = SAMPLE_ALERTS;
      this.sites = SAMPLE_SITES;
      this.initialized = true;
    }
  }

  private async saveDependencies(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEPENDENCIES, JSON.stringify(this.dependencies));
    } catch (error) {
      console.error('Failed to save dependencies:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  // Sites
  getSites(): WACHSSite[] {
    return [...this.sites];
  }

  getSite(id: string): WACHSSite | undefined {
    return this.sites.find(s => s.id === id);
  }

  getSitesByRegion(region: string): WACHSSite[] {
    return this.sites.filter(s => s.region === region);
  }

  // Services
  getServices(): Service[] {
    return [...this.services];
  }

  getService(id: string): Service | undefined {
    return this.services.find(s => s.id === id);
  }

  getServicesBySite(siteId: string): Service[] {
    return this.services.filter(s => s.hostSiteId === siteId);
  }

  // Dependencies
  getDependencies(): Dependency[] {
    return [...this.dependencies];
  }

  getDependency(id: string): Dependency | undefined {
    return this.dependencies.find(d => d.id === id);
  }

  getDependenciesBySite(siteId: string): Dependency[] {
    return this.dependencies.filter(d => d.sourceSiteId === siteId || d.targetSiteId === siteId);
  }

  getDependenciesByService(serviceId: string): Dependency[] {
    return this.dependencies.filter(d => d.sourceServiceId === serviceId || d.targetServiceId === serviceId);
  }

  getOutboundDependencies(siteId: string): Dependency[] {
    return this.dependencies.filter(d => d.sourceSiteId === siteId);
  }

  getInboundDependencies(siteId: string): Dependency[] {
    return this.dependencies.filter(d => d.targetSiteId === siteId);
  }

  // Cascade Risk Analysis
  analyzeCascadeRisk(siteId: string): CascadeRisk[] {
    const risks: CascadeRisk[] = [];
    const site = this.getSite(siteId);
    if (!site) return risks;

    // Find all services that depend on this site
    const inboundDeps = this.getInboundDependencies(siteId);
    
    for (const service of this.getServicesBySite(siteId)) {
      const dependentDeps = inboundDeps.filter(d => d.targetServiceId === service.id);
      if (dependentDeps.length === 0) continue;

      const affectedSites = [...new Set(dependentDeps.map(d => d.sourceSiteId))];
      const affectedServices = [...new Set(dependentDeps.map(d => d.sourceServiceId))];
      
      // Calculate risk level based on criticality and number of dependents
      const criticalCount = dependentDeps.filter(d => d.criticality === 'critical').length;
      const highCount = dependentDeps.filter(d => d.criticality === 'high').length;
      
      let riskLevel: DependencyCriticality = 'low';
      if (criticalCount > 2 || (criticalCount > 0 && affectedSites.length > 3)) {
        riskLevel = 'critical';
      } else if (criticalCount > 0 || highCount > 2) {
        riskLevel = 'high';
      } else if (highCount > 0 || affectedSites.length > 2) {
        riskLevel = 'medium';
      }

      const hasFailover = dependentDeps.every(d => d.failoverAvailable);
      const estimatedImpact = (affectedSites.length / this.sites.length) * 100;

      risks.push({
        id: `risk_${siteId}_${service.id}`,
        triggerSiteId: siteId,
        triggerServiceId: service.id,
        affectedSites,
        affectedServices,
        riskLevel,
        estimatedImpact,
        hasFailover,
        mitigationSteps: this.generateMitigationSteps(service, dependentDeps, hasFailover),
      });
    }

    return risks.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
  }

  private generateMitigationSteps(service: Service, deps: Dependency[], hasFailover: boolean): string[] {
    const steps: string[] = [];
    
    if (!hasFailover) {
      steps.push('Implement failover solution for dependent services');
    }
    
    steps.push(`Monitor ${service.name} health status closely`);
    steps.push('Ensure backup procedures are tested and documented');
    
    const criticalDeps = deps.filter(d => d.criticality === 'critical');
    if (criticalDeps.length > 0) {
      steps.push('Review and update disaster recovery procedures');
      steps.push('Consider implementing redundant connections');
    }
    
    return steps;
  }

  // Alerts
  getAlerts(): DependencyAlert[] {
    return [...this.alerts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getActiveAlerts(): DependencyAlert[] {
    return this.alerts.filter(a => !a.resolvedAt);
  }

  async acknowledgeAlert(id: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return false;

    alert.acknowledgedAt = new Date().toISOString();
    await this.saveAlerts();
    return true;
  }

  async resolveAlert(id: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return false;

    alert.resolvedAt = new Date().toISOString();
    await this.saveAlerts();
    return true;
  }

  // Statistics
  getStats(): DependencyStats {
    const healthyDeps = this.dependencies.filter(d => d.status === 'healthy').length;
    const degradedDeps = this.dependencies.filter(d => d.status === 'degraded').length;
    const downDeps = this.dependencies.filter(d => d.status === 'down').length;
    
    const avgLatency = this.dependencies.reduce((sum, d) => sum + d.latency, 0) / this.dependencies.length;
    const failoverCount = this.dependencies.filter(d => d.failoverAvailable).length;

    // Count critical risks across all sites
    let criticalRisks = 0;
    for (const site of this.sites) {
      const risks = this.analyzeCascadeRisk(site.id);
      criticalRisks += risks.filter(r => r.riskLevel === 'critical').length;
    }

    return {
      totalSites: this.sites.length,
      totalServices: this.services.length,
      totalDependencies: this.dependencies.length,
      healthyDependencies: healthyDeps,
      degradedDependencies: degradedDeps,
      downDependencies: downDeps,
      criticalRisks,
      averageLatency: Math.round(avgLatency),
      failoverCoverage: Math.round((failoverCount / this.dependencies.length) * 100),
    };
  }

  // Dependency Graph Data
  getGraphData(): { nodes: any[]; edges: any[] } {
    const nodes = this.sites.map(site => ({
      id: site.id,
      label: site.name,
      type: site.type,
      region: site.region,
      status: site.status,
      serviceCount: this.getServicesBySite(site.id).length,
    }));

    const edges = this.dependencies.map(dep => ({
      id: dep.id,
      source: dep.sourceSiteId,
      target: dep.targetSiteId,
      type: dep.type,
      criticality: dep.criticality,
      status: dep.status,
      latency: dep.latency,
    }));

    return { nodes, edges };
  }
}

export const dependencyMappingService = new DependencyMappingService();
