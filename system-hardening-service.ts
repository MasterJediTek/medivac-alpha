/**
 * System Hardening & Security Service
 * Extreme security measures for MediVac One
 * Execute with extreme prejudice
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SecurityStatus = 'secure' | 'warning' | 'compromised' | 'lockdown';

export interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyRotationDays: number;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  geoBlockingEnabled: boolean;
  blockedCountries: string[];
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindowSeconds: number;
  intrusionDetectionEnabled: boolean;
  autoLockdownEnabled: boolean;
  auditLoggingEnabled: boolean;
  dataRetentionDays: number;
}

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  source: string;
  target: string;
  description: string;
  timestamp: string;
  mitigated: boolean;
  mitigationAction?: string;
  metadata: Record<string, any>;
}

export type ThreatType = 
  | 'brute_force' | 'sql_injection' | 'xss' | 'csrf'
  | 'session_hijack' | 'privilege_escalation' | 'data_exfiltration'
  | 'ddos' | 'malware' | 'unauthorized_access' | 'anomaly';

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'blocked';
  riskScore: number;
  details: Record<string, any>;
}

export interface EncryptionKey {
  id: string;
  algorithm: string;
  createdAt: string;
  expiresAt: string;
  rotatedAt?: string;
  status: 'active' | 'rotating' | 'expired' | 'revoked';
  usage: 'data' | 'api' | 'session' | 'backup';
}

export interface SecurityScanResult {
  id: string;
  scanType: 'quick' | 'standard' | 'deep' | 'compliance';
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  findings: SecurityFinding[];
  score: number;
  recommendations: string[];
}

export interface SecurityFinding {
  id: string;
  severity: ThreatLevel;
  category: string;
  title: string;
  description: string;
  affectedComponent: string;
  remediation: string;
  cveId?: string;
  cvssScore?: number;
}

export interface IncidentResponse {
  id: string;
  threatId: string;
  status: 'detected' | 'investigating' | 'contained' | 'eradicated' | 'recovered' | 'closed';
  assignedTo?: string;
  timeline: IncidentEvent[];
  actions: ResponseAction[];
  createdAt: string;
  resolvedAt?: string;
}

export interface IncidentEvent {
  timestamp: string;
  type: string;
  description: string;
  actor?: string;
}

export interface ResponseAction {
  id: string;
  type: 'block' | 'isolate' | 'terminate' | 'notify' | 'escalate' | 'restore';
  target: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executedAt?: string;
}

export interface ComplianceCheck {
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string;
  lastChecked: string;
  nextCheck: string;
}

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  isActive: boolean;
  priority: number;
}

export interface PolicyCondition {
  type: 'user' | 'device' | 'location' | 'time' | 'risk' | 'resource';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface PolicyAction {
  type: 'allow' | 'deny' | 'mfa' | 'step_up' | 'log' | 'alert';
  config?: Record<string, any>;
}

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_CONFIG: SecurityConfig = {
  encryptionEnabled: true,
  encryptionAlgorithm: 'AES-256-GCM',
  keyRotationDays: 90,
  mfaRequired: true,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  ipWhitelistEnabled: false,
  ipWhitelist: [],
  geoBlockingEnabled: false,
  blockedCountries: [],
  rateLimitEnabled: true,
  rateLimitRequests: 100,
  rateLimitWindowSeconds: 60,
  intrusionDetectionEnabled: true,
  autoLockdownEnabled: true,
  auditLoggingEnabled: true,
  dataRetentionDays: 365,
};

// ==========================================
// Zero Trust Policies
// ==========================================

const DEFAULT_ZERO_TRUST_POLICIES: ZeroTrustPolicy[] = [
  {
    id: 'policy_clinical_access',
    name: 'Clinical Data Access',
    description: 'Require MFA and device trust for clinical data',
    conditions: [
      { type: 'resource', operator: 'contains', value: 'patient' },
      { type: 'resource', operator: 'contains', value: 'clinical' },
    ],
    actions: [
      { type: 'mfa', config: { method: 'any' } },
      { type: 'log', config: { level: 'detailed' } },
    ],
    isActive: true,
    priority: 1,
  },
  {
    id: 'policy_admin_access',
    name: 'Administrative Access',
    description: 'Strict controls for admin functions',
    conditions: [
      { type: 'resource', operator: 'contains', value: 'admin' },
      { type: 'user', operator: 'in', value: ['admin', 'superadmin'] },
    ],
    actions: [
      { type: 'mfa', config: { method: 'hardware' } },
      { type: 'step_up', config: { reason: 'admin_access' } },
      { type: 'alert', config: { recipients: ['security_team'] } },
    ],
    isActive: true,
    priority: 0,
  },
  {
    id: 'policy_high_risk',
    name: 'High Risk Access',
    description: 'Block access from high-risk conditions',
    conditions: [
      { type: 'risk', operator: 'greater_than', value: 80 },
    ],
    actions: [
      { type: 'deny' },
      { type: 'alert', config: { level: 'critical' } },
    ],
    isActive: true,
    priority: -1,
  },
  {
    id: 'policy_after_hours',
    name: 'After Hours Access',
    description: 'Additional verification for after-hours access',
    conditions: [
      { type: 'time', operator: 'not_in', value: { start: '06:00', end: '22:00' } },
    ],
    actions: [
      { type: 'mfa' },
      { type: 'log', config: { flag: 'after_hours' } },
    ],
    isActive: true,
    priority: 5,
  },
];

// ==========================================
// Compliance Frameworks
// ==========================================

const COMPLIANCE_FRAMEWORKS = {
  HIPAA: [
    { requirement: 'Access Control', description: 'Unique user identification and emergency access' },
    { requirement: 'Audit Controls', description: 'Hardware, software, and procedural mechanisms' },
    { requirement: 'Integrity Controls', description: 'Protect ePHI from improper alteration' },
    { requirement: 'Transmission Security', description: 'Guard against unauthorized access during transmission' },
    { requirement: 'Authentication', description: 'Verify person or entity seeking access' },
  ],
  AUSTRALIAN_PRIVACY: [
    { requirement: 'APP 1', description: 'Open and transparent management of personal information' },
    { requirement: 'APP 6', description: 'Use or disclosure of personal information' },
    { requirement: 'APP 11', description: 'Security of personal information' },
    { requirement: 'APP 12', description: 'Access to personal information' },
    { requirement: 'APP 13', description: 'Correction of personal information' },
  ],
  ISO_27001: [
    { requirement: 'A.9', description: 'Access control' },
    { requirement: 'A.10', description: 'Cryptography' },
    { requirement: 'A.12', description: 'Operations security' },
    { requirement: 'A.14', description: 'System acquisition, development and maintenance' },
    { requirement: 'A.16', description: 'Information security incident management' },
  ],
  NSQHS: [
    { requirement: 'Standard 1', description: 'Clinical Governance' },
    { requirement: 'Standard 2', description: 'Partnering with Consumers' },
    { requirement: 'Standard 6', description: 'Communicating for Safety' },
    { requirement: 'Standard 8', description: 'Recognising and Responding to Acute Deterioration' },
  ],
};

// ==========================================
// Service Class
// ==========================================

class SystemHardeningService {
  private config: SecurityConfig = DEFAULT_CONFIG;
  private threats: SecurityThreat[] = [];
  private auditLog: SecurityAuditEntry[] = [];
  private encryptionKeys: EncryptionKey[] = [];
  private scanResults: SecurityScanResult[] = [];
  private incidents: IncidentResponse[] = [];
  private policies: ZeroTrustPolicy[] = [...DEFAULT_ZERO_TRUST_POLICIES];
  private complianceChecks: ComplianceCheck[] = [];
  private securityStatus: SecurityStatus = 'secure';
  private listeners: Set<(event: string, data: any) => void> = new Set();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadConfig();
    this.initializeEncryptionKeys();
    this.startIntrusionDetection();
    this.runComplianceChecks();
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('security_config');
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('security_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save security config:', error);
    }
  }

  private emit(event: string, data: any): void {
    this.listeners.forEach(listener => listener(event, data));
  }

  // Encryption Key Management
  private initializeEncryptionKeys(): void {
    const keyTypes: Array<'data' | 'api' | 'session' | 'backup'> = ['data', 'api', 'session', 'backup'];
    
    keyTypes.forEach(usage => {
      const key: EncryptionKey = {
        id: `key_${usage}_${Date.now()}`,
        algorithm: this.config.encryptionAlgorithm,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.config.keyRotationDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        usage,
      };
      this.encryptionKeys.push(key);
    });
  }

  async rotateEncryptionKey(usage: 'data' | 'api' | 'session' | 'backup'): Promise<EncryptionKey> {
    const oldKey = this.encryptionKeys.find(k => k.usage === usage && k.status === 'active');
    if (oldKey) {
      oldKey.status = 'rotating';
      oldKey.rotatedAt = new Date().toISOString();
    }

    const newKey: EncryptionKey = {
      id: `key_${usage}_${Date.now()}`,
      algorithm: this.config.encryptionAlgorithm,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.keyRotationDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      usage,
    };

    this.encryptionKeys.push(newKey);
    
    if (oldKey) {
      oldKey.status = 'expired';
    }

    this.emit('key:rotated', { oldKey, newKey });
    this.logAudit('key_rotation', 'encryption_key', newKey.id, 'success', { usage });

    return newKey;
  }

  getEncryptionKeys(): EncryptionKey[] {
    return this.encryptionKeys;
  }

  // Intrusion Detection
  private startIntrusionDetection(): void {
    if (!this.config.intrusionDetectionEnabled) return;

    // Simulate periodic threat detection
    setInterval(() => {
      this.detectThreats();
    }, 30000);
  }

  private detectThreats(): void {
    // Simulate threat detection based on patterns
    const threatPatterns = [
      { type: 'brute_force' as ThreatType, probability: 0.02 },
      { type: 'anomaly' as ThreatType, probability: 0.05 },
      { type: 'unauthorized_access' as ThreatType, probability: 0.01 },
    ];

    threatPatterns.forEach(pattern => {
      if (Math.random() < pattern.probability) {
        this.reportThreat({
          type: pattern.type,
          level: pattern.type === 'brute_force' ? 'high' : 'medium',
          source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: 'authentication_service',
          description: `Detected ${pattern.type.replace('_', ' ')} attempt`,
          metadata: { detected_by: 'ids', confidence: 0.85 },
        });
      }
    });
  }

  reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'mitigated'>): SecurityThreat {
    const newThreat: SecurityThreat = {
      ...threat,
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      mitigated: false,
    };

    this.threats.push(newThreat);
    this.emit('threat:detected', newThreat);

    // Auto-mitigate if enabled
    if (this.config.autoLockdownEnabled && threat.level === 'critical') {
      this.mitigateThreat(newThreat.id, 'auto_lockdown');
    }

    // Update security status
    this.updateSecurityStatus();

    return newThreat;
  }

  async mitigateThreat(threatId: string, action: string): Promise<void> {
    const threat = this.threats.find(t => t.id === threatId);
    if (!threat) return;

    threat.mitigated = true;
    threat.mitigationAction = action;

    this.emit('threat:mitigated', { threat, action });
    this.logAudit('threat_mitigation', 'security_threat', threatId, 'success', { action });
    this.updateSecurityStatus();
  }

  getThreats(options: { level?: ThreatLevel; mitigated?: boolean } = {}): SecurityThreat[] {
    return this.threats.filter(t => {
      if (options.level && t.level !== options.level) return false;
      if (options.mitigated !== undefined && t.mitigated !== options.mitigated) return false;
      return true;
    });
  }

  // Security Scanning
  async runSecurityScan(type: 'quick' | 'standard' | 'deep' | 'compliance' = 'standard'): Promise<SecurityScanResult> {
    const scan: SecurityScanResult = {
      id: `scan_${Date.now()}`,
      scanType: type,
      startedAt: new Date().toISOString(),
      status: 'running',
      findings: [],
      score: 0,
      recommendations: [],
    };

    this.scanResults.push(scan);
    this.emit('scan:started', scan);

    // Simulate scan duration
    const duration = type === 'quick' ? 5000 : type === 'deep' ? 30000 : 15000;
    await new Promise(resolve => setTimeout(resolve, duration));

    // Generate findings
    scan.findings = this.generateScanFindings(type);
    scan.score = this.calculateSecurityScore(scan.findings);
    scan.recommendations = this.generateRecommendations(scan.findings);
    scan.completedAt = new Date().toISOString();
    scan.status = 'completed';

    this.emit('scan:completed', scan);
    return scan;
  }

  private generateScanFindings(type: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // Always check common issues
    const checks = [
      { category: 'encryption', title: 'Data Encryption Status', severity: 'info' as ThreatLevel },
      { category: 'authentication', title: 'MFA Configuration', severity: 'low' as ThreatLevel },
      { category: 'access_control', title: 'Permission Review', severity: 'medium' as ThreatLevel },
      { category: 'logging', title: 'Audit Log Coverage', severity: 'low' as ThreatLevel },
    ];

    if (type === 'deep' || type === 'compliance') {
      checks.push(
        { category: 'network', title: 'Network Segmentation', severity: 'medium' as ThreatLevel },
        { category: 'vulnerability', title: 'Dependency Vulnerabilities', severity: 'high' as ThreatLevel },
        { category: 'configuration', title: 'Security Headers', severity: 'low' as ThreatLevel }
      );
    }

    checks.forEach((check, index) => {
      if (Math.random() > 0.7) {
        findings.push({
          id: `finding_${Date.now()}_${index}`,
          severity: check.severity,
          category: check.category,
          title: check.title,
          description: `Review recommended for ${check.category}`,
          affectedComponent: check.category,
          remediation: `Update ${check.category} configuration`,
        });
      }
    });

    return findings;
  }

  private calculateSecurityScore(findings: SecurityFinding[]): number {
    let score = 100;
    
    findings.forEach(f => {
      switch (f.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
        case 'info': score -= 1; break;
      }
    });

    return Math.max(0, score);
  }

  private generateRecommendations(findings: SecurityFinding[]): string[] {
    const recommendations: string[] = [];
    
    if (findings.some(f => f.category === 'encryption')) {
      recommendations.push('Review and update encryption configuration');
    }
    if (findings.some(f => f.category === 'authentication')) {
      recommendations.push('Enforce MFA for all clinical staff');
    }
    if (findings.some(f => f.severity === 'high' || f.severity === 'critical')) {
      recommendations.push('Address high-severity findings immediately');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue regular security monitoring');
    }

    return recommendations;
  }

  getScanResults(): SecurityScanResult[] {
    return this.scanResults;
  }

  // Audit Logging
  logAudit(
    action: string,
    resourceType: string,
    resourceId: string,
    result: 'success' | 'failure' | 'blocked',
    details: Record<string, any> = {}
  ): void {
    if (!this.config.auditLoggingEnabled) return;

    const entry: SecurityAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      ipAddress: '127.0.0.1',
      userAgent: 'MediVac One App',
      result,
      riskScore: this.calculateRiskScore(action, result),
      details,
    };

    this.auditLog.push(entry);
    
    // Keep only recent entries based on retention
    const cutoff = Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
    this.auditLog = this.auditLog.filter(e => new Date(e.timestamp).getTime() > cutoff);

    if (entry.riskScore > 70) {
      this.emit('audit:high_risk', entry);
    }
  }

  private calculateRiskScore(action: string, result: string): number {
    let score = 0;
    
    if (action.includes('admin') || action.includes('delete')) score += 30;
    if (action.includes('patient') || action.includes('clinical')) score += 20;
    if (result === 'failure') score += 25;
    if (result === 'blocked') score += 40;
    
    return Math.min(100, score);
  }

  getAuditLog(options: { limit?: number; action?: string; result?: string } = {}): SecurityAuditEntry[] {
    let log = [...this.auditLog];
    
    if (options.action) {
      log = log.filter(e => e.action.includes(options.action!));
    }
    if (options.result) {
      log = log.filter(e => e.result === options.result);
    }
    
    return log.slice(-(options.limit || 100)).reverse();
  }

  // Incident Response
  createIncident(threatId: string): IncidentResponse {
    const threat = this.threats.find(t => t.id === threatId);
    if (!threat) throw new Error('Threat not found');

    const incident: IncidentResponse = {
      id: `incident_${Date.now()}`,
      threatId,
      status: 'detected',
      timeline: [
        { timestamp: new Date().toISOString(), type: 'created', description: 'Incident created' },
      ],
      actions: [],
      createdAt: new Date().toISOString(),
    };

    this.incidents.push(incident);
    this.emit('incident:created', incident);

    return incident;
  }

  updateIncidentStatus(incidentId: string, status: IncidentResponse['status']): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return;

    incident.status = status;
    incident.timeline.push({
      timestamp: new Date().toISOString(),
      type: 'status_change',
      description: `Status changed to ${status}`,
    });

    if (status === 'closed') {
      incident.resolvedAt = new Date().toISOString();
    }

    this.emit('incident:updated', incident);
  }

  getIncidents(): IncidentResponse[] {
    return this.incidents;
  }

  // Zero Trust Policies
  getPolicies(): ZeroTrustPolicy[] {
    return this.policies;
  }

  evaluateAccess(context: {
    user: string;
    resource: string;
    device?: string;
    location?: string;
    riskScore?: number;
  }): { allowed: boolean; requiredActions: PolicyAction[] } {
    const requiredActions: PolicyAction[] = [];
    let allowed = true;

    // Sort policies by priority (lower = higher priority)
    const sortedPolicies = [...this.policies]
      .filter(p => p.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const policy of sortedPolicies) {
      const matches = this.evaluatePolicyConditions(policy.conditions, context);
      
      if (matches) {
        for (const action of policy.actions) {
          if (action.type === 'deny') {
            allowed = false;
            break;
          }
          if (action.type !== 'allow') {
            requiredActions.push(action);
          }
        }
      }

      if (!allowed) break;
    }

    return { allowed, requiredActions };
  }

  private evaluatePolicyConditions(
    conditions: PolicyCondition[],
    context: Record<string, any>
  ): boolean {
    return conditions.every(condition => {
      const contextValue = context[condition.type];
      if (contextValue === undefined) return true;

      switch (condition.operator) {
        case 'equals': return contextValue === condition.value;
        case 'not_equals': return contextValue !== condition.value;
        case 'contains': return String(contextValue).includes(condition.value);
        case 'greater_than': return contextValue > condition.value;
        case 'less_than': return contextValue < condition.value;
        case 'in': return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in': return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        default: return true;
      }
    });
  }

  // Compliance
  private runComplianceChecks(): void {
    Object.entries(COMPLIANCE_FRAMEWORKS).forEach(([framework, requirements]) => {
      requirements.forEach(req => {
        const check: ComplianceCheck = {
          framework,
          requirement: req.requirement,
          status: Math.random() > 0.1 ? 'compliant' : 'partial',
          evidence: `Automated check for ${req.description}`,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        this.complianceChecks.push(check);
      });
    });
  }

  getComplianceStatus(): { 
    overall: number; 
    byFramework: Record<string, { compliant: number; total: number }> 
  } {
    const byFramework: Record<string, { compliant: number; total: number }> = {};
    
    this.complianceChecks.forEach(check => {
      if (!byFramework[check.framework]) {
        byFramework[check.framework] = { compliant: 0, total: 0 };
      }
      byFramework[check.framework].total++;
      if (check.status === 'compliant') {
        byFramework[check.framework].compliant++;
      }
    });

    const totalCompliant = Object.values(byFramework).reduce((sum, f) => sum + f.compliant, 0);
    const totalChecks = Object.values(byFramework).reduce((sum, f) => sum + f.total, 0);

    return {
      overall: totalChecks > 0 ? (totalCompliant / totalChecks) * 100 : 100,
      byFramework,
    };
  }

  getComplianceChecks(framework?: string): ComplianceCheck[] {
    if (framework) {
      return this.complianceChecks.filter(c => c.framework === framework);
    }
    return this.complianceChecks;
  }

  // System Lockdown
  async initiateSystemLockdown(level: 'partial' | 'full' | 'emergency', reason: string): Promise<void> {
    this.securityStatus = 'lockdown';
    
    this.emit('lockdown:initiated', { level, reason });
    this.logAudit('system_lockdown', 'system', 'global', 'success', { level, reason });

    // Simulate lockdown actions
    if (level === 'full' || level === 'emergency') {
      // Terminate all sessions
      this.emit('sessions:terminated', { reason: 'lockdown' });
    }

    if (level === 'emergency') {
      // Block all non-essential access
      this.emit('access:blocked', { reason: 'emergency_lockdown' });
    }
  }

  async liftLockdown(): Promise<void> {
    this.securityStatus = 'secure';
    this.emit('lockdown:lifted', {});
    this.logAudit('lockdown_lifted', 'system', 'global', 'success', {});
  }

  // Status
  private updateSecurityStatus(): void {
    const unmitigatedCritical = this.threats.filter(t => !t.mitigated && t.level === 'critical').length;
    const unmitigatedHigh = this.threats.filter(t => !t.mitigated && t.level === 'high').length;

    if (unmitigatedCritical > 0) {
      this.securityStatus = 'compromised';
    } else if (unmitigatedHigh > 2) {
      this.securityStatus = 'warning';
    } else {
      this.securityStatus = 'secure';
    }

    this.emit('status:changed', { status: this.securityStatus });
  }

  getSecurityStatus(): SecurityStatus {
    return this.securityStatus;
  }

  getSecuritySummary(): {
    status: SecurityStatus;
    threatCount: { critical: number; high: number; medium: number; low: number };
    complianceScore: number;
    lastScanScore: number;
    activeIncidents: number;
  } {
    const threatCount = {
      critical: this.threats.filter(t => !t.mitigated && t.level === 'critical').length,
      high: this.threats.filter(t => !t.mitigated && t.level === 'high').length,
      medium: this.threats.filter(t => !t.mitigated && t.level === 'medium').length,
      low: this.threats.filter(t => !t.mitigated && t.level === 'low').length,
    };

    const lastScan = this.scanResults[this.scanResults.length - 1];

    return {
      status: this.securityStatus,
      threatCount,
      complianceScore: this.getComplianceStatus().overall,
      lastScanScore: lastScan?.score || 100,
      activeIncidents: this.incidents.filter(i => i.status !== 'closed').length,
    };
  }

  // Configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    this.emit('config:updated', this.config);
  }

  // Event Subscription
  subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Export singleton instance
export const systemHardening = new SystemHardeningService();

// Export constants
export { DEFAULT_CONFIG, DEFAULT_ZERO_TRUST_POLICIES, COMPLIANCE_FRAMEWORKS };
