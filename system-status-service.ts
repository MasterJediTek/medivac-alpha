/**
 * System Operational Status Dashboard Service
 * Manages system health with color-coded status indicators
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'medivac_system_status';

export type SystemHealth = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
export type ServiceCategory = 'core' | 'integration' | 'security' | 'network' | 'database' | 'api';

export interface SystemService {
  id: string;
  name: string;
  category: ServiceCategory;
  health: SystemHealth;
  uptime: number; // percentage
  responseTime: number; // ms
  lastChecked: string;
  incidents?: ServiceIncident[];
  dependencies?: string[];
}

export interface ServiceIncident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: string;
  message: string;
}

export const HEALTH_COLORS: Record<SystemHealth, { primary: string; background: string; text: string; icon: string }> = {
  operational: { primary: '#22C55E', background: '#F0FDF4', text: '#166534', icon: '●' },
  degraded: { primary: '#F59E0B', background: '#FFFBEB', text: '#B45309', icon: '◐' },
  partial_outage: { primary: '#EA580C', background: '#FFF7ED', text: '#9A3412', icon: '◑' },
  major_outage: { primary: '#DC2626', background: '#FEF2F2', text: '#991B1B', icon: '○' },
  maintenance: { primary: '#3B82F6', background: '#EFF6FF', text: '#1E40AF', icon: '◉' },
};

export const CATEGORY_COLORS: Record<ServiceCategory, { primary: string; background: string }> = {
  core: { primary: '#8B5CF6', background: '#F5F3FF' },
  integration: { primary: '#3B82F6', background: '#EFF6FF' },
  security: { primary: '#EF4444', background: '#FEF2F2' },
  network: { primary: '#22C55E', background: '#F0FDF4' },
  database: { primary: '#F59E0B', background: '#FFFBEB' },
  api: { primary: '#EC4899', background: '#FDF2F8' },
};

class SystemStatusService {
  private services: SystemService[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.services = JSON.parse(stored);
      } else {
        this.generateSampleServices();
        await this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize system status:', error);
      this.generateSampleServices();
      this.initialized = true;
    }
  }

  private generateSampleServices(): void {
    const now = new Date();
    
    this.services = [
      {
        id: 'svc_1',
        name: 'MediVac Core Platform',
        category: 'core',
        health: 'operational',
        uptime: 99.98,
        responseTime: 45,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_2',
        name: 'Patient Management System',
        category: 'core',
        health: 'operational',
        uptime: 99.95,
        responseTime: 62,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_3',
        name: 'Homing Beacon Service',
        category: 'core',
        health: 'operational',
        uptime: 99.99,
        responseTime: 28,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_4',
        name: 'Microsoft Teams Integration',
        category: 'integration',
        health: 'operational',
        uptime: 99.85,
        responseTime: 120,
        lastChecked: now.toISOString(),
        dependencies: ['svc_1', 'svc_8'],
      },
      {
        id: 'svc_5',
        name: 'SharePoint Sync',
        category: 'integration',
        health: 'degraded',
        uptime: 98.50,
        responseTime: 450,
        lastChecked: now.toISOString(),
        incidents: [{
          id: 'inc_1',
          title: 'Elevated sync latency',
          status: 'monitoring',
          severity: 'minor',
          startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          updates: [
            { timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), message: 'Investigating elevated latency in document sync operations.' },
            { timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), message: 'Root cause identified: Microsoft Graph API rate limiting. Implementing backoff strategy.' },
            { timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), message: 'Mitigation deployed. Monitoring for improvement.' },
          ],
        }],
      },
      {
        id: 'svc_6',
        name: 'WACHS WAN Gateway',
        category: 'network',
        health: 'operational',
        uptime: 99.92,
        responseTime: 85,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_7',
        name: 'WACHS Perth Site',
        category: 'network',
        health: 'operational',
        uptime: 99.88,
        responseTime: 42,
        lastChecked: now.toISOString(),
        dependencies: ['svc_6'],
      },
      {
        id: 'svc_8',
        name: 'WACHS Kimberley Site',
        category: 'network',
        health: 'partial_outage',
        uptime: 95.20,
        responseTime: 890,
        lastChecked: now.toISOString(),
        dependencies: ['svc_6'],
        incidents: [{
          id: 'inc_2',
          title: 'Intermittent connectivity issues',
          status: 'identified',
          severity: 'major',
          startedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          updates: [
            { timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), message: 'Reports of intermittent connectivity from Kimberley region.' },
            { timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), message: 'Issue identified: Satellite uplink experiencing interference. Telstra notified.' },
          ],
        }],
      },
      {
        id: 'svc_9',
        name: 'Authentication Service',
        category: 'security',
        health: 'operational',
        uptime: 99.99,
        responseTime: 35,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_10',
        name: 'MFA Gateway',
        category: 'security',
        health: 'operational',
        uptime: 99.97,
        responseTime: 48,
        lastChecked: now.toISOString(),
        dependencies: ['svc_9'],
      },
      {
        id: 'svc_11',
        name: 'Primary Database',
        category: 'database',
        health: 'operational',
        uptime: 99.99,
        responseTime: 12,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_12',
        name: 'Replica Database',
        category: 'database',
        health: 'operational',
        uptime: 99.98,
        responseTime: 15,
        lastChecked: now.toISOString(),
        dependencies: ['svc_11'],
      },
      {
        id: 'svc_13',
        name: 'REST API Gateway',
        category: 'api',
        health: 'operational',
        uptime: 99.95,
        responseTime: 52,
        lastChecked: now.toISOString(),
      },
      {
        id: 'svc_14',
        name: 'GraphQL API',
        category: 'api',
        health: 'maintenance',
        uptime: 99.80,
        responseTime: 0,
        lastChecked: now.toISOString(),
        incidents: [{
          id: 'inc_3',
          title: 'Scheduled maintenance',
          status: 'monitoring',
          severity: 'minor',
          startedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          updates: [
            { timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), message: 'Beginning scheduled maintenance for GraphQL API optimization.' },
          ],
        }],
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.services));
    } catch (error) {
      console.error('Failed to save system status:', error);
    }
  }

  getServices(): SystemService[] {
    return [...this.services].sort((a, b) => {
      const healthOrder: Record<SystemHealth, number> = {
        major_outage: 0, partial_outage: 1, degraded: 2, maintenance: 3, operational: 4
      };
      return healthOrder[a.health] - healthOrder[b.health];
    });
  }

  getServicesByCategory(category: ServiceCategory): SystemService[] {
    return this.services.filter(s => s.category === category);
  }

  getOverallHealth(): SystemHealth {
    const hasOutage = this.services.some(s => s.health === 'major_outage');
    if (hasOutage) return 'major_outage';
    
    const hasPartialOutage = this.services.some(s => s.health === 'partial_outage');
    if (hasPartialOutage) return 'partial_outage';
    
    const hasDegraded = this.services.some(s => s.health === 'degraded');
    if (hasDegraded) return 'degraded';
    
    const hasMaintenance = this.services.some(s => s.health === 'maintenance');
    if (hasMaintenance) return 'maintenance';
    
    return 'operational';
  }

  getStats(): { total: number; byHealth: Record<SystemHealth, number>; byCategory: Record<ServiceCategory, number>; avgUptime: number; avgResponseTime: number } {
    const byHealth: Record<SystemHealth, number> = {
      operational: 0, degraded: 0, partial_outage: 0, major_outage: 0, maintenance: 0
    };
    const byCategory: Record<ServiceCategory, number> = {
      core: 0, integration: 0, security: 0, network: 0, database: 0, api: 0
    };
    
    let totalUptime = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    
    this.services.forEach(s => {
      byHealth[s.health]++;
      byCategory[s.category]++;
      totalUptime += s.uptime;
      if (s.responseTime > 0) {
        totalResponseTime += s.responseTime;
        responseCount++;
      }
    });
    
    return {
      total: this.services.length,
      byHealth,
      byCategory,
      avgUptime: totalUptime / this.services.length,
      avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
    };
  }

  getActiveIncidents(): { service: SystemService; incident: ServiceIncident }[] {
    const incidents: { service: SystemService; incident: ServiceIncident }[] = [];
    
    this.services.forEach(service => {
      service.incidents?.forEach(incident => {
        if (incident.status !== 'resolved') {
          incidents.push({ service, incident });
        }
      });
    });
    
    return incidents.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      return severityOrder[a.incident.severity] - severityOrder[b.incident.severity];
    });
  }
}

export const systemStatusService = new SystemStatusService();
