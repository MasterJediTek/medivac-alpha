/**
 * Security Scan Service - Deep scanning with baseline scoring
 * MediVac One v5.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type ScanType = 'quick' | 'standard' | 'deep' | 'compliance' | 'penetration';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  category: string;
  cveId?: string;
  cvssScore?: number;
  affectedComponent: string;
  discoveredAt: string;
  remediation: string;
  references: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export interface ScanResult {
  id: string;
  scanType: ScanType;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  vulnerabilities: Vulnerability[];
  securityScore: number;
  baselineScore?: number;
  scoreChange?: number;
  summary: ScanSummary;
  recommendations: Recommendation[];
  complianceResults?: ComplianceResult[];
}

export interface ScanSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  effort: 'minimal' | 'moderate' | 'significant';
  impact: number; // Score improvement if implemented
  category: string;
  steps: string[];
}

export interface ComplianceResult {
  framework: string;
  score: number;
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  findings: string[];
}

export interface ScanSchedule {
  id: string;
  name: string;
  scanType: ScanType;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  notifyOnComplete: boolean;
  notifyOnCritical: boolean;
}

export interface BaselineConfig {
  id: string;
  name: string;
  createdAt: string;
  score: number;
  vulnerabilityCounts: Record<SeverityLevel, number>;
  isActive: boolean;
}

// ==========================================
// Security Checks Database
// ==========================================

interface SecurityCheck {
  id: string;
  name: string;
  category: string;
  description: string;
  severity: SeverityLevel;
  remediation: string;
  check: () => Promise<boolean>;
}

const SECURITY_CHECKS: SecurityCheck[] = [
  // Authentication Checks
  {
    id: 'auth_mfa_enabled',
    name: 'Multi-Factor Authentication',
    category: 'Authentication',
    description: 'Verify MFA is enabled for all users',
    severity: 'critical',
    remediation: 'Enable MFA for all user accounts in Authentication settings',
    check: async () => true,
  },
  {
    id: 'auth_password_policy',
    name: 'Password Policy Strength',
    category: 'Authentication',
    description: 'Check password complexity requirements',
    severity: 'high',
    remediation: 'Enforce minimum 12 characters with complexity requirements',
    check: async () => true,
  },
  {
    id: 'auth_session_timeout',
    name: 'Session Timeout Configuration',
    category: 'Authentication',
    description: 'Verify session timeout is appropriately configured',
    severity: 'medium',
    remediation: 'Set session timeout to 30 minutes or less for clinical systems',
    check: async () => true,
  },
  {
    id: 'auth_lockout_policy',
    name: 'Account Lockout Policy',
    category: 'Authentication',
    description: 'Check account lockout after failed attempts',
    severity: 'high',
    remediation: 'Enable account lockout after 5 failed login attempts',
    check: async () => true,
  },
  // Encryption Checks
  {
    id: 'enc_data_at_rest',
    name: 'Data at Rest Encryption',
    category: 'Encryption',
    description: 'Verify all stored data is encrypted',
    severity: 'critical',
    remediation: 'Enable AES-256 encryption for all stored patient data',
    check: async () => true,
  },
  {
    id: 'enc_data_in_transit',
    name: 'Data in Transit Encryption',
    category: 'Encryption',
    description: 'Check TLS configuration for all communications',
    severity: 'critical',
    remediation: 'Enforce TLS 1.3 for all API communications',
    check: async () => true,
  },
  {
    id: 'enc_key_rotation',
    name: 'Encryption Key Rotation',
    category: 'Encryption',
    description: 'Verify encryption keys are rotated regularly',
    severity: 'high',
    remediation: 'Implement 90-day key rotation policy',
    check: async () => true,
  },
  // Access Control Checks
  {
    id: 'ac_rbac_enabled',
    name: 'Role-Based Access Control',
    category: 'Access Control',
    description: 'Verify RBAC is properly configured',
    severity: 'high',
    remediation: 'Implement role-based permissions for all clinical functions',
    check: async () => true,
  },
  {
    id: 'ac_least_privilege',
    name: 'Least Privilege Principle',
    category: 'Access Control',
    description: 'Check users have minimum required permissions',
    severity: 'medium',
    remediation: 'Review and reduce excessive permissions',
    check: async () => true,
  },
  {
    id: 'ac_audit_logging',
    name: 'Access Audit Logging',
    category: 'Access Control',
    description: 'Verify all access is logged',
    severity: 'high',
    remediation: 'Enable comprehensive audit logging for all data access',
    check: async () => true,
  },
  // Network Security Checks
  {
    id: 'net_firewall',
    name: 'Firewall Configuration',
    category: 'Network Security',
    description: 'Check firewall rules are properly configured',
    severity: 'high',
    remediation: 'Review and tighten firewall rules',
    check: async () => true,
  },
  {
    id: 'net_intrusion_detection',
    name: 'Intrusion Detection System',
    category: 'Network Security',
    description: 'Verify IDS is active and monitoring',
    severity: 'high',
    remediation: 'Enable and configure intrusion detection alerts',
    check: async () => true,
  },
  {
    id: 'net_rate_limiting',
    name: 'API Rate Limiting',
    category: 'Network Security',
    description: 'Check rate limiting is enabled',
    severity: 'medium',
    remediation: 'Implement rate limiting on all API endpoints',
    check: async () => true,
  },
  // Data Protection Checks
  {
    id: 'dp_backup_encryption',
    name: 'Backup Encryption',
    category: 'Data Protection',
    description: 'Verify backups are encrypted',
    severity: 'critical',
    remediation: 'Enable encryption for all backup data',
    check: async () => true,
  },
  {
    id: 'dp_data_retention',
    name: 'Data Retention Policy',
    category: 'Data Protection',
    description: 'Check data retention policies are enforced',
    severity: 'medium',
    remediation: 'Implement automated data retention and purging',
    check: async () => true,
  },
  {
    id: 'dp_pii_protection',
    name: 'PII Protection',
    category: 'Data Protection',
    description: 'Verify PII is properly protected',
    severity: 'critical',
    remediation: 'Implement PII masking and access controls',
    check: async () => true,
  },
  // Application Security Checks
  {
    id: 'app_input_validation',
    name: 'Input Validation',
    category: 'Application Security',
    description: 'Check input validation is implemented',
    severity: 'high',
    remediation: 'Implement strict input validation on all forms',
    check: async () => true,
  },
  {
    id: 'app_xss_protection',
    name: 'XSS Protection',
    category: 'Application Security',
    description: 'Verify XSS protection is enabled',
    severity: 'high',
    remediation: 'Enable Content Security Policy headers',
    check: async () => true,
  },
  {
    id: 'app_csrf_protection',
    name: 'CSRF Protection',
    category: 'Application Security',
    description: 'Check CSRF tokens are implemented',
    severity: 'high',
    remediation: 'Implement CSRF tokens on all state-changing operations',
    check: async () => true,
  },
  {
    id: 'app_dependency_scan',
    name: 'Dependency Vulnerabilities',
    category: 'Application Security',
    description: 'Check for vulnerable dependencies',
    severity: 'medium',
    remediation: 'Update vulnerable packages to latest secure versions',
    check: async () => true,
  },
  // Compliance Checks
  {
    id: 'comp_hipaa_audit',
    name: 'HIPAA Audit Controls',
    category: 'Compliance',
    description: 'Verify HIPAA audit requirements are met',
    severity: 'critical',
    remediation: 'Implement required HIPAA audit controls',
    check: async () => true,
  },
  {
    id: 'comp_privacy_act',
    name: 'Australian Privacy Act',
    category: 'Compliance',
    description: 'Check Privacy Act compliance',
    severity: 'critical',
    remediation: 'Review and implement Privacy Act requirements',
    check: async () => true,
  },
  {
    id: 'comp_consent_management',
    name: 'Consent Management',
    category: 'Compliance',
    description: 'Verify patient consent is properly managed',
    severity: 'high',
    remediation: 'Implement consent tracking and management',
    check: async () => true,
  },
  {
    id: 'comp_breach_notification',
    name: 'Breach Notification Process',
    category: 'Compliance',
    description: 'Check breach notification procedures',
    severity: 'high',
    remediation: 'Document and test breach notification procedures',
    check: async () => true,
  },
];

// ==========================================
// Service Class
// ==========================================

class SecurityScanService {
  private static instance: SecurityScanService;
  private scanResults: ScanResult[] = [];
  private schedules: ScanSchedule[] = [];
  private baselines: BaselineConfig[] = [];
  private currentScan: ScanResult | null = null;
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadData();
  }

  static getInstance(): SecurityScanService {
    if (!SecurityScanService.instance) {
      SecurityScanService.instance = new SecurityScanService();
    }
    return SecurityScanService.instance;
  }

  // ==========================================
  // Event System
  // ==========================================

  subscribe(callback: (event: string, data: unknown) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach(cb => cb(event, data));
  }

  // ==========================================
  // Data Persistence
  // ==========================================

  private async loadData(): Promise<void> {
    try {
      const [results, schedules, baselines] = await Promise.all([
        AsyncStorage.getItem('security_scan_results'),
        AsyncStorage.getItem('security_scan_schedules'),
        AsyncStorage.getItem('security_baselines'),
      ]);
      
      if (results) this.scanResults = JSON.parse(results);
      if (schedules) this.schedules = JSON.parse(schedules);
      if (baselines) this.baselines = JSON.parse(baselines);
    } catch (error) {
      console.error('Failed to load security scan data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('security_scan_results', JSON.stringify(this.scanResults)),
        AsyncStorage.setItem('security_scan_schedules', JSON.stringify(this.schedules)),
        AsyncStorage.setItem('security_baselines', JSON.stringify(this.baselines)),
      ]);
    } catch (error) {
      console.error('Failed to save security scan data:', error);
    }
  }

  // ==========================================
  // Scanning Operations
  // ==========================================

  async startScan(scanType: ScanType): Promise<ScanResult> {
    if (this.currentScan?.status === 'running') {
      throw new Error('A scan is already in progress');
    }

    const scanId = `scan_${Date.now()}`;
    const scan: ScanResult = {
      id: scanId,
      scanType,
      status: 'running',
      startedAt: new Date().toISOString(),
      vulnerabilities: [],
      securityScore: 0,
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
      },
      recommendations: [],
    };

    this.currentScan = scan;
    this.emit('scan_started', scan);

    try {
      // Get checks based on scan type
      const checks = this.getChecksForScanType(scanType);
      scan.summary.totalChecks = checks.length;

      // Run checks with progress updates
      for (let i = 0; i < checks.length; i++) {
        const check = checks[i];
        const progress = ((i + 1) / checks.length) * 100;
        this.emit('scan_progress', { scanId, progress, currentCheck: check.name });

        // Simulate check execution with random results
        const passed = Math.random() > 0.15; // 85% pass rate
        
        if (passed) {
          scan.summary.passedChecks++;
        } else {
          scan.summary.failedChecks++;
          
          // Create vulnerability
          const vulnerability: Vulnerability = {
            id: `vuln_${Date.now()}_${i}`,
            name: check.name,
            description: check.description,
            severity: check.severity,
            category: check.category,
            affectedComponent: check.category,
            discoveredAt: new Date().toISOString(),
            remediation: check.remediation,
            references: [],
            status: 'open',
          };
          
          scan.vulnerabilities.push(vulnerability);
          
          // Update counts
          switch (check.severity) {
            case 'critical': scan.summary.criticalCount++; break;
            case 'high': scan.summary.highCount++; break;
            case 'medium': scan.summary.mediumCount++; break;
            case 'low': scan.summary.lowCount++; break;
            case 'info': scan.summary.infoCount++; break;
          }
        }

        // Small delay to simulate actual scanning
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate security score
      scan.securityScore = this.calculateSecurityScore(scan);

      // Get active baseline for comparison
      const activeBaseline = this.baselines.find(b => b.isActive);
      if (activeBaseline) {
        scan.baselineScore = activeBaseline.score;
        scan.scoreChange = scan.securityScore - activeBaseline.score;
      }

      // Generate recommendations
      scan.recommendations = this.generateRecommendations(scan);

      // Add compliance results for compliance scans
      if (scanType === 'compliance' || scanType === 'deep') {
        scan.complianceResults = this.generateComplianceResults(scan);
      }

      // Complete scan
      scan.status = 'completed';
      scan.completedAt = new Date().toISOString();
      scan.duration = Date.now() - new Date(scan.startedAt).getTime();

      // Save result
      this.scanResults.unshift(scan);
      if (this.scanResults.length > 50) {
        this.scanResults = this.scanResults.slice(0, 50);
      }
      await this.saveData();

      this.currentScan = null;
      this.emit('scan_completed', scan);

      return scan;
    } catch (error) {
      scan.status = 'failed';
      scan.completedAt = new Date().toISOString();
      this.currentScan = null;
      this.emit('scan_failed', { scan, error });
      throw error;
    }
  }

  async cancelScan(): Promise<void> {
    if (this.currentScan) {
      this.currentScan.status = 'cancelled';
      this.currentScan.completedAt = new Date().toISOString();
      this.emit('scan_cancelled', this.currentScan);
      this.currentScan = null;
    }
  }

  private getChecksForScanType(scanType: ScanType): SecurityCheck[] {
    switch (scanType) {
      case 'quick':
        return SECURITY_CHECKS.filter(c => c.severity === 'critical' || c.severity === 'high');
      case 'standard':
        return SECURITY_CHECKS.filter(c => c.severity !== 'info');
      case 'deep':
      case 'penetration':
        return SECURITY_CHECKS;
      case 'compliance':
        return SECURITY_CHECKS.filter(c => c.category === 'Compliance' || c.category === 'Data Protection' || c.category === 'Access Control');
      default:
        return SECURITY_CHECKS;
    }
  }

  private calculateSecurityScore(scan: ScanResult): number {
    let score = 100;
    
    // Deduct points based on severity
    score -= scan.summary.criticalCount * 15;
    score -= scan.summary.highCount * 10;
    score -= scan.summary.mediumCount * 5;
    score -= scan.summary.lowCount * 2;
    score -= scan.summary.infoCount * 0.5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(scan: ScanResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Group vulnerabilities by category
    const byCategory = new Map<string, Vulnerability[]>();
    scan.vulnerabilities.forEach(v => {
      const list = byCategory.get(v.category) || [];
      list.push(v);
      byCategory.set(v.category, list);
    });

    // Generate recommendations per category
    byCategory.forEach((vulns, category) => {
      const criticalCount = vulns.filter(v => v.severity === 'critical').length;
      const highCount = vulns.filter(v => v.severity === 'high').length;
      
      let priority: 'immediate' | 'high' | 'medium' | 'low' = 'low';
      if (criticalCount > 0) priority = 'immediate';
      else if (highCount > 0) priority = 'high';
      else if (vulns.length > 2) priority = 'medium';

      recommendations.push({
        id: `rec_${category.toLowerCase().replace(/\s+/g, '_')}`,
        title: `Address ${category} Issues`,
        description: `Found ${vulns.length} issue(s) in ${category}`,
        priority,
        effort: vulns.length > 3 ? 'significant' : vulns.length > 1 ? 'moderate' : 'minimal',
        impact: criticalCount * 15 + highCount * 10,
        category,
        steps: vulns.map(v => v.remediation),
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateComplianceResults(scan: ScanResult): ComplianceResult[] {
    const frameworks = ['HIPAA', 'Australian Privacy Act', 'ISO 27001', 'NSQHS'];
    
    return frameworks.map(framework => {
      const relevantVulns = scan.vulnerabilities.filter(v => 
        v.category === 'Compliance' || v.category === 'Data Protection'
      );
      
      const score = Math.max(0, 100 - relevantVulns.length * 10);
      
      return {
        framework,
        score,
        controls: [
          {
            id: `${framework}_access`,
            name: 'Access Control',
            status: score >= 90 ? 'compliant' : score >= 70 ? 'partial' : 'non_compliant',
            findings: relevantVulns.filter(v => v.category === 'Access Control').map(v => v.name),
          },
          {
            id: `${framework}_audit`,
            name: 'Audit Logging',
            status: score >= 85 ? 'compliant' : score >= 60 ? 'partial' : 'non_compliant',
            findings: [],
          },
          {
            id: `${framework}_encryption`,
            name: 'Data Encryption',
            status: score >= 95 ? 'compliant' : score >= 75 ? 'partial' : 'non_compliant',
            findings: relevantVulns.filter(v => v.category === 'Encryption').map(v => v.name),
          },
        ],
      };
    });
  }

  // ==========================================
  // Baseline Management
  // ==========================================

  async createBaseline(name: string, scanResult: ScanResult): Promise<BaselineConfig> {
    const baseline: BaselineConfig = {
      id: `baseline_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      score: scanResult.securityScore,
      vulnerabilityCounts: {
        critical: scanResult.summary.criticalCount,
        high: scanResult.summary.highCount,
        medium: scanResult.summary.mediumCount,
        low: scanResult.summary.lowCount,
        info: scanResult.summary.infoCount,
      },
      isActive: true,
    };

    // Deactivate other baselines
    this.baselines.forEach(b => b.isActive = false);
    this.baselines.unshift(baseline);
    await this.saveData();

    this.emit('baseline_created', baseline);
    return baseline;
  }

  async setActiveBaseline(baselineId: string): Promise<void> {
    this.baselines.forEach(b => b.isActive = b.id === baselineId);
    await this.saveData();
    this.emit('baseline_changed', baselineId);
  }

  getBaselines(): BaselineConfig[] {
    return [...this.baselines];
  }

  getActiveBaseline(): BaselineConfig | undefined {
    return this.baselines.find(b => b.isActive);
  }

  // ==========================================
  // Schedule Management
  // ==========================================

  async createSchedule(schedule: Omit<ScanSchedule, 'id' | 'lastRun'>): Promise<ScanSchedule> {
    const newSchedule: ScanSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
    };

    this.schedules.push(newSchedule);
    await this.saveData();
    this.emit('schedule_created', newSchedule);
    return newSchedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<ScanSchedule>): Promise<void> {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index >= 0) {
      this.schedules[index] = { ...this.schedules[index], ...updates };
      await this.saveData();
      this.emit('schedule_updated', this.schedules[index]);
    }
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    await this.saveData();
    this.emit('schedule_deleted', scheduleId);
  }

  getSchedules(): ScanSchedule[] {
    return [...this.schedules];
  }

  // ==========================================
  // Results & History
  // ==========================================

  getScanResults(): ScanResult[] {
    return [...this.scanResults];
  }

  getScanResult(scanId: string): ScanResult | undefined {
    return this.scanResults.find(r => r.id === scanId);
  }

  getCurrentScan(): ScanResult | null {
    return this.currentScan;
  }

  async compareScanResults(scanId1: string, scanId2: string): Promise<{
    scan1: ScanResult;
    scan2: ScanResult;
    scoreChange: number;
    newVulnerabilities: Vulnerability[];
    resolvedVulnerabilities: Vulnerability[];
    unchangedVulnerabilities: Vulnerability[];
  }> {
    const scan1 = this.scanResults.find(r => r.id === scanId1);
    const scan2 = this.scanResults.find(r => r.id === scanId2);

    if (!scan1 || !scan2) {
      throw new Error('Scan results not found');
    }

    const scan1VulnIds = new Set(scan1.vulnerabilities.map(v => v.name));
    const scan2VulnIds = new Set(scan2.vulnerabilities.map(v => v.name));

    return {
      scan1,
      scan2,
      scoreChange: scan2.securityScore - scan1.securityScore,
      newVulnerabilities: scan2.vulnerabilities.filter(v => !scan1VulnIds.has(v.name)),
      resolvedVulnerabilities: scan1.vulnerabilities.filter(v => !scan2VulnIds.has(v.name)),
      unchangedVulnerabilities: scan2.vulnerabilities.filter(v => scan1VulnIds.has(v.name)),
    };
  }

  // ==========================================
  // Vulnerability Management
  // ==========================================

  async updateVulnerabilityStatus(
    scanId: string,
    vulnId: string,
    status: Vulnerability['status']
  ): Promise<void> {
    const scan = this.scanResults.find(r => r.id === scanId);
    if (scan) {
      const vuln = scan.vulnerabilities.find(v => v.id === vulnId);
      if (vuln) {
        vuln.status = status;
        await this.saveData();
        this.emit('vulnerability_updated', { scanId, vulnId, status });
      }
    }
  }

  // ==========================================
  // Statistics
  // ==========================================

  getSecurityTrend(days: number = 30): { date: string; score: number }[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.scanResults
      .filter(r => r.status === 'completed' && new Date(r.completedAt!).getTime() > cutoff)
      .map(r => ({
        date: r.completedAt!.split('T')[0],
        score: r.securityScore,
      }))
      .reverse();
  }

  getVulnerabilityTrend(days: number = 30): { date: string; critical: number; high: number; medium: number; low: number }[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.scanResults
      .filter(r => r.status === 'completed' && new Date(r.completedAt!).getTime() > cutoff)
      .map(r => ({
        date: r.completedAt!.split('T')[0],
        critical: r.summary.criticalCount,
        high: r.summary.highCount,
        medium: r.summary.mediumCount,
        low: r.summary.lowCount,
      }))
      .reverse();
  }
}

export const securityScanService = SecurityScanService.getInstance();
