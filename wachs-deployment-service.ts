  checksum: string;
  requirements: string[];
  changelog: string[];
  createdAt: string;
  createdBy: string;
  tested: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface DeploymentSchedule {
  id: string;
  deploymentId: string;
  scheduledFor: string;
  timezone: string;
  recurring: boolean;
  recurrencePattern?: string;
  maintenanceWindow: {
    start: string; // HH:mm
    end: string;
    daysOfWeek: number[]; // 0-6
  };
  notifyBefore: number; // minutes
  autoRollback: boolean;
  createdAt: string;
}

// Package types config
export const PACKAGE_TYPES: Record<PackageType, { label: string; icon: string; color: string }> = {
  application: { label: 'Application', icon: 'app.fill', color: '#3B82F6' },
  configuration: { label: 'Configuration', icon: 'gearshape.fill', color: '#8B5CF6' },
  security: { label: 'Security Patch', icon: 'shield.fill', color: '#EF4444' },
  firmware: { label: 'Firmware', icon: 'cpu.fill', color: '#F59E0B' },
  database: { label: 'Database', icon: 'server.rack', color: '#10B981' },
  full_system: { label: 'Full System', icon: 'desktopcomputer', color: '#6366F1' },
};

// Sample packages
const SAMPLE_PACKAGES: DeploymentPackage[] = [
  {
    id: 'pkg_1',
    name: 'MediVac Core',
    version: '6.0.0',
    type: 'application',
    description: 'Core MediVac One application with v6.0 features',
    size: 125000000,
    checksum: 'sha256:abc123...',
    requirements: ['Node.js 18+', 'PostgreSQL 14+', 'Min 4GB RAM'],
    changelog: ['Added WACHS integration', 'Microsoft Teams support', 'Recording highlights'],
    createdAt: '2025-01-28T10:00:00Z',
    createdBy: 'System',
    tested: true,
    approved: true,
    approvedBy: 'James Wilson',
    approvedAt: '2025-01-28T14:00:00Z',
  },
  {
    id: 'pkg_2',
    name: 'Security Patch 2025-01',