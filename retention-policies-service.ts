/**
 * Retention Policies Service
 * Manages automatic archival and deletion of voice recordings
 * Implements age-based, importance-based, and storage-based policies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type RetentionTier = 'standard' | 'important' | 'critical' | 'permanent';
export type PolicyAction = 'archive' | 'delete' | 'notify' | 'compress' | 'move_cold_storage';
export type PolicyTrigger = 'age' | 'storage_limit' | 'view_count' | 'manual' | 'scheduled';
export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'pending_review';

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  tier: RetentionTier;
  isActive: boolean;
  priority: number; // Lower = higher priority
  conditions: PolicyCondition[];
  actions: PolicyActionConfig[];
  exceptions: PolicyException[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  recordingsAffected: number;
}

export interface PolicyCondition {
  id: string;
  type: 'age_days' | 'storage_mb' | 'view_count' | 'importance' | 'category' | 'channel' | 'creator_rank';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number;
  andOr: 'and' | 'or';
}

export interface PolicyActionConfig {
  id: string;
  action: PolicyAction;
  delayDays: number;
  notifyOwner: boolean;
  notifyAdmins: boolean;
  requireApproval: boolean;
  approvalLevel: 'master' | 'council' | 'grand_master';
}

export interface PolicyException {
  id: string;
  type: 'recording_id' | 'channel_id' | 'creator_id' | 'tag' | 'date_range';
  value: string;
  reason: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface RetentionRecord {
  id: string;
  recordingId: string;
  recordingName: string;
  policyId: string;
  policyName: string;
  tier: RetentionTier;
  action: PolicyAction;
  trigger: PolicyTrigger;
  status: 'pending' | 'approved' | 'executed' | 'failed' | 'cancelled' | 'overridden';
  scheduledAt: string;
  executedAt?: string;
  executedBy?: string;
  overriddenBy?: string;
  overrideReason?: string;
  error?: string;
  metadata: {
    originalSize: number;
    compressedSize?: number;
    ageDays: number;
    viewCount: number;
    importance: string;
  };
}

export interface StorageQuota {
  totalLimit: number; // bytes
  used: number;
  available: number;
  byTier: Record<RetentionTier, number>;
  warningThreshold: number; // percentage
  criticalThreshold: number;
  status: 'normal' | 'warning' | 'critical' | 'exceeded';
}

export interface ComplianceReport {
  id: string;
  generatedAt: string;
  period: { start: string; end: string };
  status: ComplianceStatus;
  totalRecordings: number;
  recordingsByTier: Record<RetentionTier, number>;
  policiesExecuted: number;
  actionsPerformed: Record<PolicyAction, number>;
  exceptionsApplied: number;
  overridesUsed: number;
  storageReclaimed: number;
  issues: ComplianceIssue[];
  recommendations: string[];
}

export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'expired_recording' | 'storage_exceeded' | 'policy_violation' | 'missing_approval';
  description: string;
  recordingId?: string;
  policyId?: string;
  suggestedAction: string;
}

export interface RetentionAnalytics {
  totalPolicies: number;
  activePolicies: number;
  totalRecords: number;
  recordsByStatus: Record<RetentionRecord['status'], number>;
  actionsByType: Record<PolicyAction, number>;
  storageReclaimed: number;
  averageRetentionDays: number;
  complianceRate: number;
  pendingActions: number;
  overrideRate: number;
}

// Storage keys
const STORAGE_KEYS = {
  POLICIES: '@medivac_retention_policies',
  RECORDS: '@medivac_retention_records',
  QUOTA: '@medivac_storage_quota',
  REPORTS: '@medivac_compliance_reports',
};

// Default storage quota (10GB)
const DEFAULT_QUOTA: StorageQuota = {
  totalLimit: 10 * 1024 * 1024 * 1024,
  used: 0,
  available: 10 * 1024 * 1024 * 1024,
  byTier: {
    standard: 0,
    important: 0,
    critical: 0,
    permanent: 0,
  },
  warningThreshold: 80,
  criticalThreshold: 95,
  status: 'normal',
};

class RetentionPoliciesService {
  private policies: RetentionPolicy[] = [];
  private records: RetentionRecord[] = [];
  private quota: StorageQuota = DEFAULT_QUOTA;
  private reports: ComplianceReport[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initializeDefaultPolicies();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [policiesData, recordsData, quotaData, reportsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.POLICIES),
        AsyncStorage.getItem(STORAGE_KEYS.RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.QUOTA),
        AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
      ]);

      if (policiesData) this.policies = JSON.parse(policiesData);
      if (recordsData) this.records = JSON.parse(recordsData);
      if (quotaData) this.quota = JSON.parse(quotaData);
      if (reportsData) this.reports = JSON.parse(reportsData);
    } catch (error) {
      console.error('Failed to load retention policies data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(this.policies)),
        AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(this.records)),
        AsyncStorage.setItem(STORAGE_KEYS.QUOTA, JSON.stringify(this.quota)),
        AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(this.reports)),
      ]);
    } catch (error) {
      console.error('Failed to save retention policies data:', error);
    }
  }

  private initializeDefaultPolicies(): void {
    if (this.policies.length === 0) {
      const defaultPolicies: RetentionPolicy[] = [
        {
          id: 'policy_standard_90',
          name: 'Standard 90-Day Retention',
          description: 'Archive standard recordings after 90 days, delete after 180 days',
          tier: 'standard',
          isActive: true,
          priority: 100,
          conditions: [
            { id: 'cond_1', type: 'age_days', operator: 'greater_than', value: 90, andOr: 'and' },
            { id: 'cond_2', type: 'importance', operator: 'equals', value: 'low', andOr: 'or' },
          ],
          actions: [
            { id: 'act_1', action: 'archive', delayDays: 0, notifyOwner: true, notifyAdmins: false, requireApproval: false, approvalLevel: 'master' },
            { id: 'act_2', action: 'delete', delayDays: 90, notifyOwner: true, notifyAdmins: true, requireApproval: true, approvalLevel: 'master' },
          ],
          exceptions: [],
          createdBy: 'system',
          createdByName: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionCount: 0,
          recordingsAffected: 0,
        },
        {
          id: 'policy_important_365',
          name: 'Important 1-Year Retention',
          description: 'Retain important recordings for 1 year before archival',
          tier: 'important',
          isActive: true,
          priority: 50,
          conditions: [
            { id: 'cond_3', type: 'age_days', operator: 'greater_than', value: 365, andOr: 'and' },
            { id: 'cond_4', type: 'importance', operator: 'equals', value: 'high', andOr: 'and' },
          ],
          actions: [
            { id: 'act_3', action: 'notify', delayDays: 0, notifyOwner: true, notifyAdmins: true, requireApproval: false, approvalLevel: 'master' },
            { id: 'act_4', action: 'archive', delayDays: 30, notifyOwner: true, notifyAdmins: false, requireApproval: true, approvalLevel: 'council' },
          ],
          exceptions: [],
          createdBy: 'system',
          createdByName: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionCount: 0,
          recordingsAffected: 0,
        },
        {
          id: 'policy_critical_permanent',
          name: 'Critical Permanent Retention',
          description: 'Critical recordings are never automatically deleted',
          tier: 'critical',
          isActive: true,
          priority: 10,
          conditions: [
            { id: 'cond_5', type: 'importance', operator: 'equals', value: 'critical', andOr: 'and' },
          ],
          actions: [
            { id: 'act_5', action: 'compress', delayDays: 365, notifyOwner: false, notifyAdmins: false, requireApproval: false, approvalLevel: 'master' },
            { id: 'act_6', action: 'move_cold_storage', delayDays: 730, notifyOwner: true, notifyAdmins: true, requireApproval: true, approvalLevel: 'grand_master' },
          ],
          exceptions: [],
          createdBy: 'system',
          createdByName: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionCount: 0,
          recordingsAffected: 0,
        },
        {
          id: 'policy_storage_cleanup',
          name: 'Storage Limit Enforcement',
          description: 'Automatically archive oldest recordings when storage exceeds 90%',
          tier: 'standard',
          isActive: true,
          priority: 5,
          conditions: [
            { id: 'cond_6', type: 'storage_mb', operator: 'greater_than', value: 9216, andOr: 'and' }, // 90% of 10GB
          ],
          actions: [
            { id: 'act_7', action: 'archive', delayDays: 0, notifyOwner: true, notifyAdmins: true, requireApproval: false, approvalLevel: 'master' },
            { id: 'act_8', action: 'compress', delayDays: 0, notifyOwner: false, notifyAdmins: false, requireApproval: false, approvalLevel: 'master' },
          ],
          exceptions: [],
          createdBy: 'system',
          createdByName: 'System',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionCount: 0,
          recordingsAffected: 0,
        },
      ];

      this.policies = defaultPolicies;
      this.saveData();
    }
  }

  // Policy Management
  async createPolicy(
    name: string,
    description: string,
    tier: RetentionTier,
    conditions: PolicyCondition[],
    actions: PolicyActionConfig[],
    createdBy: string,
    createdByName: string,
    options?: {
      priority?: number;
      isActive?: boolean;
      exceptions?: PolicyException[];
    }
  ): Promise<RetentionPolicy> {
    const policy: RetentionPolicy = {
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tier,
      isActive: options?.isActive ?? true,
      priority: options?.priority ?? 100,
      conditions,
      actions,
      exceptions: options?.exceptions || [],
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      recordingsAffected: 0,
    };

    this.policies.push(policy);
    this.policies.sort((a, b) => a.priority - b.priority);
    await this.saveData();
    return policy;
  }

  async updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<RetentionPolicy | null> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return null;

    Object.assign(policy, updates, { updatedAt: new Date().toISOString() });
    this.policies.sort((a, b) => a.priority - b.priority);
    await this.saveData();
    return policy;
  }

  async deletePolicy(policyId: string): Promise<boolean> {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index === -1) return false;

    this.policies.splice(index, 1);
    await this.saveData();
    return true;
  }

  async togglePolicy(policyId: string): Promise<boolean> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return false;

    policy.isActive = !policy.isActive;
    policy.updatedAt = new Date().toISOString();
    await this.saveData();
    return policy.isActive;
  }

  // Exception Management
  async addException(
    policyId: string,
    type: PolicyException['type'],
    value: string,
    reason: string,
    createdBy: string,
    expiresAt?: string
  ): Promise<PolicyException | null> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return null;

    const exception: PolicyException = {
      id: `exc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      value,
      reason,
      expiresAt,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    policy.exceptions.push(exception);
    policy.updatedAt = new Date().toISOString();
    await this.saveData();
    return exception;
  }

  async removeException(policyId: string, exceptionId: string): Promise<boolean> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return false;

    const index = policy.exceptions.findIndex(e => e.id === exceptionId);
    if (index === -1) return false;

    policy.exceptions.splice(index, 1);
    policy.updatedAt = new Date().toISOString();
    await this.saveData();
    return true;
  }

  // Retention Record Management
  async scheduleRetention(
    recordingId: string,
    recordingName: string,
    policyId: string,
    action: PolicyAction,
    trigger: PolicyTrigger,
    metadata: RetentionRecord['metadata']
  ): Promise<RetentionRecord> {
    const policy = this.policies.find(p => p.id === policyId);
    const actionConfig = policy?.actions.find(a => a.action === action);

    const record: RetentionRecord = {
      id: `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordingId,
      recordingName,
      policyId,
      policyName: policy?.name || 'Unknown Policy',
      tier: policy?.tier || 'standard',
      action,
      trigger,
      status: actionConfig?.requireApproval ? 'pending' : 'approved',
      scheduledAt: new Date(Date.now() + (actionConfig?.delayDays || 0) * 24 * 60 * 60 * 1000).toISOString(),
      metadata,
    };

    this.records.push(record);
    await this.saveData();
    return record;
  }

  async approveRetention(recordId: string, approvedBy: string): Promise<RetentionRecord | null> {
    const record = this.records.find(r => r.id === recordId);
    if (!record || record.status !== 'pending') return null;

    record.status = 'approved';
    record.executedBy = approvedBy;
    await this.saveData();
    return record;
  }

  async executeRetention(recordId: string, executedBy: string): Promise<RetentionRecord | null> {
    const record = this.records.find(r => r.id === recordId);
    if (!record || record.status !== 'approved') return null;

    record.status = 'executed';
    record.executedAt = new Date().toISOString();
    record.executedBy = executedBy;

    // Update policy stats
    const policy = this.policies.find(p => p.id === record.policyId);
    if (policy) {
      policy.lastExecutedAt = new Date().toISOString();
      policy.executionCount++;
      policy.recordingsAffected++;
    }

    // Update storage if applicable
    if (record.action === 'delete' || record.action === 'compress') {
      const sizeReduction = record.action === 'delete' 
        ? record.metadata.originalSize 
        : record.metadata.originalSize * 0.5;
      this.quota.used = Math.max(0, this.quota.used - sizeReduction);
      this.quota.available = this.quota.totalLimit - this.quota.used;
      this.updateQuotaStatus();
    }

    await this.saveData();
    return record;
  }

  async overrideRetention(
    recordId: string,
    overriddenBy: string,
    reason: string
  ): Promise<RetentionRecord | null> {
    const record = this.records.find(r => r.id === recordId);
    if (!record || ['executed', 'cancelled'].includes(record.status)) return null;

    record.status = 'overridden';
    record.overriddenBy = overriddenBy;
    record.overrideReason = reason;
    await this.saveData();
    return record;
  }

  async cancelRetention(recordId: string): Promise<boolean> {
    const record = this.records.find(r => r.id === recordId);
    if (!record || ['executed', 'cancelled'].includes(record.status)) return false;

    record.status = 'cancelled';
    await this.saveData();
    return true;
  }

  // Storage Quota Management
  async updateStorageUsage(usedBytes: number): Promise<StorageQuota> {
    this.quota.used = usedBytes;
    this.quota.available = this.quota.totalLimit - usedBytes;
    this.updateQuotaStatus();
    await this.saveData();
    return this.quota;
  }

  async updateStorageByTier(tier: RetentionTier, bytes: number): Promise<StorageQuota> {
    this.quota.byTier[tier] = bytes;
    this.quota.used = Object.values(this.quota.byTier).reduce((sum, val) => sum + val, 0);
    this.quota.available = this.quota.totalLimit - this.quota.used;
    this.updateQuotaStatus();
    await this.saveData();
    return this.quota;
  }

  async setStorageLimit(limitBytes: number): Promise<StorageQuota> {
    this.quota.totalLimit = limitBytes;
    this.quota.available = limitBytes - this.quota.used;
    this.updateQuotaStatus();
    await this.saveData();
    return this.quota;
  }

  private updateQuotaStatus(): void {
    const usagePercent = (this.quota.used / this.quota.totalLimit) * 100;
    if (usagePercent >= 100) {
      this.quota.status = 'exceeded';
    } else if (usagePercent >= this.quota.criticalThreshold) {
      this.quota.status = 'critical';
    } else if (usagePercent >= this.quota.warningThreshold) {
      this.quota.status = 'warning';
    } else {
      this.quota.status = 'normal';
    }
  }

  getStorageQuota(): StorageQuota {
    return { ...this.quota };
  }

  // Compliance Reporting
  async generateComplianceReport(
    startDate: string,
    endDate: string
  ): Promise<ComplianceReport> {
    const recordsInPeriod = this.records.filter(r => 
      r.scheduledAt >= startDate && r.scheduledAt <= endDate
    );

    const actionsPerformed: Record<PolicyAction, number> = {
      archive: 0,
      delete: 0,
      notify: 0,
      compress: 0,
      move_cold_storage: 0,
    };

    let storageReclaimed = 0;
    let overridesUsed = 0;

    recordsInPeriod.forEach(r => {
      if (r.status === 'executed') {
        actionsPerformed[r.action]++;
        if (r.action === 'delete') {
          storageReclaimed += r.metadata.originalSize;
        } else if (r.action === 'compress' && r.metadata.compressedSize) {
          storageReclaimed += r.metadata.originalSize - r.metadata.compressedSize;
        }
      }
      if (r.status === 'overridden') {
        overridesUsed++;
      }
    });

    const issues: ComplianceIssue[] = [];
    
    // Check for storage issues
    if (this.quota.status === 'exceeded') {
      issues.push({
        id: `issue_${Date.now()}_1`,
        severity: 'critical',
        type: 'storage_exceeded',
        description: 'Storage quota has been exceeded',
        suggestedAction: 'Archive or delete old recordings immediately',
      });
    } else if (this.quota.status === 'critical') {
      issues.push({
        id: `issue_${Date.now()}_2`,
        severity: 'high',
        type: 'storage_exceeded',
        description: 'Storage usage is critically high',
        suggestedAction: 'Review and archive old recordings',
      });
    }

    // Check for pending actions
    const pendingCount = this.records.filter(r => r.status === 'pending').length;
    if (pendingCount > 10) {
      issues.push({
        id: `issue_${Date.now()}_3`,
        severity: 'medium',
        type: 'missing_approval',
        description: `${pendingCount} retention actions pending approval`,
        suggestedAction: 'Review and approve pending retention actions',
      });
    }

    const status: ComplianceStatus = issues.some(i => i.severity === 'critical')
      ? 'violation'
      : issues.some(i => i.severity === 'high')
        ? 'warning'
        : 'compliant';

    const report: ComplianceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      status,
      totalRecordings: recordsInPeriod.length,
      recordingsByTier: {
        standard: recordsInPeriod.filter(r => r.tier === 'standard').length,
        important: recordsInPeriod.filter(r => r.tier === 'important').length,
        critical: recordsInPeriod.filter(r => r.tier === 'critical').length,
        permanent: recordsInPeriod.filter(r => r.tier === 'permanent').length,
      },
      policiesExecuted: new Set(recordsInPeriod.filter(r => r.status === 'executed').map(r => r.policyId)).size,
      actionsPerformed,
      exceptionsApplied: this.policies.reduce((sum, p) => sum + p.exceptions.length, 0),
      overridesUsed,
      storageReclaimed,
      issues,
      recommendations: this.generateRecommendations(issues),
    };

    this.reports.unshift(report);
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(0, 100);
    }
    await this.saveData();
    return report;
  }

  private generateRecommendations(issues: ComplianceIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'storage_exceeded')) {
      recommendations.push('Consider increasing storage quota or implementing more aggressive archival policies');
      recommendations.push('Review recordings in the standard tier for potential deletion');
    }

    if (issues.some(i => i.type === 'missing_approval')) {
      recommendations.push('Establish a regular review schedule for pending retention actions');
      recommendations.push('Consider reducing approval requirements for low-importance recordings');
    }

    if (this.policies.filter(p => p.isActive).length < 2) {
      recommendations.push('Create additional retention policies for different recording categories');
    }

    return recommendations;
  }

  // Query Methods
  getPolicies(filters?: {
    tier?: RetentionTier;
    isActive?: boolean;
  }): RetentionPolicy[] {
    let filtered = [...this.policies];

    if (filters?.tier) {
      filtered = filtered.filter(p => p.tier === filters.tier);
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(p => p.isActive === filters.isActive);
    }

    return filtered;
  }

  getPolicy(policyId: string): RetentionPolicy | null {
    return this.policies.find(p => p.id === policyId) || null;
  }

  getRecords(filters?: {
    policyId?: string;
    recordingId?: string;
    status?: RetentionRecord['status'];
    action?: PolicyAction;
    tier?: RetentionTier;
    limit?: number;
  }): RetentionRecord[] {
    let filtered = [...this.records];

    if (filters?.policyId) {
      filtered = filtered.filter(r => r.policyId === filters.policyId);
    }
    if (filters?.recordingId) {
      filtered = filtered.filter(r => r.recordingId === filters.recordingId);
    }
    if (filters?.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters?.action) {
      filtered = filtered.filter(r => r.action === filters.action);
    }
    if (filters?.tier) {
      filtered = filtered.filter(r => r.tier === filters.tier);
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  getPendingRecords(): RetentionRecord[] {
    return this.getRecords({ status: 'pending' });
  }

  getReports(limit?: number): ComplianceReport[] {
    return this.reports.slice(0, limit || 10);
  }

  // Analytics
  getAnalytics(): RetentionAnalytics {
    const recordsByStatus: Record<RetentionRecord['status'], number> = {
      pending: 0,
      approved: 0,
      executed: 0,
      failed: 0,
      cancelled: 0,
      overridden: 0,
    };

    const actionsByType: Record<PolicyAction, number> = {
      archive: 0,
      delete: 0,
      notify: 0,
      compress: 0,
      move_cold_storage: 0,
    };

    let storageReclaimed = 0;
    let totalRetentionDays = 0;
    let overrideCount = 0;

    this.records.forEach(r => {
      recordsByStatus[r.status]++;
      actionsByType[r.action]++;
      
      if (r.status === 'executed') {
        if (r.action === 'delete') {
          storageReclaimed += r.metadata.originalSize;
        }
      }
      if (r.status === 'overridden') {
        overrideCount++;
      }
      totalRetentionDays += r.metadata.ageDays;
    });

    const executedCount = recordsByStatus.executed;
    const totalCount = this.records.length;

    return {
      totalPolicies: this.policies.length,
      activePolicies: this.policies.filter(p => p.isActive).length,
      totalRecords: totalCount,
      recordsByStatus,
      actionsByType,
      storageReclaimed,
      averageRetentionDays: totalCount > 0 ? totalRetentionDays / totalCount : 0,
      complianceRate: totalCount > 0 ? ((executedCount + recordsByStatus.approved) / totalCount) * 100 : 100,
      pendingActions: recordsByStatus.pending,
      overrideRate: totalCount > 0 ? (overrideCount / totalCount) * 100 : 0,
    };
  }
}

export const retentionPoliciesService = new RetentionPoliciesService();
export default retentionPoliciesService;
