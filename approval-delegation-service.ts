/**
 * Approval Delegation Service
 * Allow approvers to delegate authority to backup staff during leave
 * MediVac One v6.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  DELEGATIONS: 'medivac_delegations',
  DELEGATION_HISTORY: 'medivac_delegation_history',
};

// Types
export type DelegationStatus = 'active' | 'pending' | 'expired' | 'revoked';
export type DelegationReason = 'annual_leave' | 'sick_leave' | 'training' | 'conference' | 'emergency' | 'other';

export interface Delegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorRole: string;
  delegateId: string;
  delegateName: string;
  delegateRole: string;
  reason: DelegationReason;
  reasonDetails?: string;
  startDate: string;
  endDate: string;
  status: DelegationStatus;
  scopes: DelegationScope[];
  maxApprovalLevel: number;
  requireNotification: boolean;
  autoRevoke: boolean;
  createdAt: string;
  activatedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
}

export interface DelegationScope {
  type: 'environment' | 'site' | 'package_type' | 'urgency_level';
  values: string[];
}

export interface DelegationHistoryEntry {
  id: string;
  delegationId: string;
  action: 'created' | 'activated' | 'used' | 'expired' | 'revoked' | 'extended';
  performedBy: string;
  performedAt: string;
  details: string;
  approvalRequestId?: string;
}

export interface DelegationRequest {
  delegatorId: string;
  delegatorName: string;
  delegatorRole: string;
  delegateId: string;
  delegateName: string;
  delegateRole: string;
  reason: DelegationReason;
  reasonDetails?: string;
  startDate: string;
  endDate: string;
  scopes: DelegationScope[];
  maxApprovalLevel: number;
  requireNotification: boolean;
  autoRevoke: boolean;
}

export interface DelegationStats {
  totalDelegations: number;
  activeDelegations: number;
  pendingDelegations: number;
  expiredDelegations: number;
  revokedDelegations: number;
  usageCount: number;
  averageDuration: number; // days
}

// Sample data
const SAMPLE_DELEGATIONS: Delegation[] = [
  {
    id: 'del_1',
    delegatorId: 'approver_1',
    delegatorName: 'Sarah Mitchell',
    delegatorRole: 'IT Manager',
    delegateId: 'approver_4',
    delegateName: 'David Thompson',
    delegateRole: 'Senior IT Analyst',
    reason: 'annual_leave',
    reasonDetails: 'Annual leave - family vacation',
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 604800000).toISOString(),
    status: 'active',
    scopes: [
      { type: 'environment', values: ['staging', 'production'] },
      { type: 'urgency_level', values: ['low', 'medium', 'high'] },
    ],
    maxApprovalLevel: 3,
    requireNotification: true,
    autoRevoke: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    activatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'del_2',
    delegatorId: 'approver_3',
    delegatorName: 'Dr. Emily Chen',
    delegatorRole: 'Security Officer',
    delegateId: 'approver_5',
    delegateName: 'Michael Roberts',
    delegateRole: 'Security Analyst',
    reason: 'conference',
    reasonDetails: 'Attending CyberSec Australia 2025',
    startDate: new Date(Date.now() + 604800000).toISOString(),
    endDate: new Date(Date.now() + 1209600000).toISOString(),
    status: 'pending',
    scopes: [
      { type: 'environment', values: ['production'] },
      { type: 'package_type', values: ['security_patch', 'hotfix'] },
    ],
    maxApprovalLevel: 4,
    requireNotification: true,
    autoRevoke: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'del_3',
    delegatorId: 'approver_2',
    delegatorName: 'James Wilson',
    delegatorRole: 'CTO',
    delegateId: 'approver_1',
    delegateName: 'Sarah Mitchell',
    delegateRole: 'IT Manager',
    reason: 'sick_leave',
    reasonDetails: 'Medical procedure recovery',
    startDate: new Date(Date.now() - 1209600000).toISOString(),
    endDate: new Date(Date.now() - 604800000).toISOString(),
    status: 'expired',
    scopes: [
      { type: 'environment', values: ['production', 'disaster_recovery'] },
    ],
    maxApprovalLevel: 5,
    requireNotification: true,
    autoRevoke: true,
    createdAt: new Date(Date.now() - 1296000000).toISOString(),
    activatedAt: new Date(Date.now() - 1209600000).toISOString(),
  },
];

const SAMPLE_HISTORY: DelegationHistoryEntry[] = [
  {
    id: 'hist_1',
    delegationId: 'del_1',
    action: 'created',
    performedBy: 'Sarah Mitchell',
    performedAt: new Date(Date.now() - 172800000).toISOString(),
    details: 'Created delegation to David Thompson for annual leave',
  },
  {
    id: 'hist_2',
    delegationId: 'del_1',
    action: 'activated',
    performedBy: 'System',
    performedAt: new Date(Date.now() - 86400000).toISOString(),
    details: 'Delegation automatically activated at scheduled start date',
  },
  {
    id: 'hist_3',
    delegationId: 'del_1',
    action: 'used',
    performedBy: 'David Thompson',
    performedAt: new Date(Date.now() - 43200000).toISOString(),
    details: 'Approved deployment request req_staging_001 on behalf of Sarah Mitchell',
    approvalRequestId: 'req_staging_001',
  },
];

class ApprovalDelegationService {
  private delegations: Delegation[] = [];
  private history: DelegationHistoryEntry[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [delegationsData, historyData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DELEGATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.DELEGATION_HISTORY),
      ]);

      this.delegations = delegationsData ? JSON.parse(delegationsData) : SAMPLE_DELEGATIONS;
      this.history = historyData ? JSON.parse(historyData) : SAMPLE_HISTORY;
      this.initialized = true;

      // Check for status updates
      await this.updateDelegationStatuses();
    } catch (error) {
      console.error('Failed to initialize delegation service:', error);
      this.delegations = SAMPLE_DELEGATIONS;
      this.history = SAMPLE_HISTORY;
      this.initialized = true;
    }
  }

  private async saveDelegations(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DELEGATIONS, JSON.stringify(this.delegations));
    } catch (error) {
      console.error('Failed to save delegations:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DELEGATION_HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save delegation history:', error);
    }
  }

  private async addHistoryEntry(entry: Omit<DelegationHistoryEntry, 'id'>): Promise<void> {
    const historyEntry: DelegationHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...entry,
    };
    this.history.push(historyEntry);
    await this.saveHistory();
  }

  private async updateDelegationStatuses(): Promise<void> {
    const now = new Date();
    let updated = false;

    for (const delegation of this.delegations) {
      const startDate = new Date(delegation.startDate);
      const endDate = new Date(delegation.endDate);

      if (delegation.status === 'pending' && now >= startDate) {
        delegation.status = 'active';
        delegation.activatedAt = now.toISOString();
        updated = true;
        await this.addHistoryEntry({
          delegationId: delegation.id,
          action: 'activated',
          performedBy: 'System',
          performedAt: now.toISOString(),
          details: 'Delegation automatically activated at scheduled start date',
        });
      }

      if (delegation.status === 'active' && now > endDate && delegation.autoRevoke) {
        delegation.status = 'expired';
        updated = true;
        await this.addHistoryEntry({
          delegationId: delegation.id,
          action: 'expired',
          performedBy: 'System',
          performedAt: now.toISOString(),
          details: 'Delegation automatically expired at scheduled end date',
        });
      }
    }

    if (updated) {
      await this.saveDelegations();
    }
  }

  // Delegations
  getDelegations(): Delegation[] {
    return [...this.delegations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDelegation(id: string): Delegation | undefined {
    return this.delegations.find(d => d.id === id);
  }

  getActiveDelegations(): Delegation[] {
    return this.delegations.filter(d => d.status === 'active');
  }

  getDelegationsForDelegator(delegatorId: string): Delegation[] {
    return this.delegations.filter(d => d.delegatorId === delegatorId);
  }

  getDelegationsForDelegate(delegateId: string): Delegation[] {
    return this.delegations.filter(d => d.delegateId === delegateId);
  }

  getActiveDelegationForApprover(approverId: string): Delegation | undefined {
    return this.delegations.find(d => 
      d.delegatorId === approverId && d.status === 'active'
    );
  }

  async createDelegation(request: DelegationRequest): Promise<Delegation> {
    // Validate no overlapping active delegations
    const existing = this.delegations.find(d => 
      d.delegatorId === request.delegatorId &&
      (d.status === 'active' || d.status === 'pending') &&
      new Date(d.startDate) < new Date(request.endDate) &&
      new Date(d.endDate) > new Date(request.startDate)
    );

    if (existing) {
      throw new Error('Overlapping delegation already exists for this period');
    }

    const now = new Date();
    const startDate = new Date(request.startDate);
    const status: DelegationStatus = now >= startDate ? 'active' : 'pending';

    const delegation: Delegation = {
      id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...request,
      status,
      createdAt: now.toISOString(),
      activatedAt: status === 'active' ? now.toISOString() : undefined,
    };

    this.delegations.push(delegation);
    await this.saveDelegations();

    await this.addHistoryEntry({
      delegationId: delegation.id,
      action: 'created',
      performedBy: request.delegatorName,
      performedAt: now.toISOString(),
      details: `Created delegation to ${request.delegateName} for ${request.reason.replace('_', ' ')}`,
    });

    if (status === 'active') {
      await this.addHistoryEntry({
        delegationId: delegation.id,
        action: 'activated',
        performedBy: 'System',
        performedAt: now.toISOString(),
        details: 'Delegation immediately activated (start date is now or past)',
      });
    }

    return delegation;
  }

  async revokeDelegation(id: string, revokedBy: string, reason: string): Promise<Delegation | null> {
    const delegation = this.delegations.find(d => d.id === id);
    if (!delegation || delegation.status === 'revoked' || delegation.status === 'expired') {
      return null;
    }

    delegation.status = 'revoked';
    delegation.revokedAt = new Date().toISOString();
    delegation.revokedBy = revokedBy;
    delegation.revokeReason = reason;

    await this.saveDelegations();

    await this.addHistoryEntry({
      delegationId: delegation.id,
      action: 'revoked',
      performedBy: revokedBy,
      performedAt: new Date().toISOString(),
      details: `Delegation revoked: ${reason}`,
    });

    return delegation;
  }

  async extendDelegation(id: string, newEndDate: string, extendedBy: string): Promise<Delegation | null> {
    const delegation = this.delegations.find(d => d.id === id);
    if (!delegation || delegation.status === 'revoked') {
      return null;
    }

    const oldEndDate = delegation.endDate;
    delegation.endDate = newEndDate;

    // If was expired but new end date is in future, reactivate
    if (delegation.status === 'expired' && new Date(newEndDate) > new Date()) {
      delegation.status = 'active';
    }

    await this.saveDelegations();

    await this.addHistoryEntry({
      delegationId: delegation.id,
      action: 'extended',
      performedBy: extendedBy,
      performedAt: new Date().toISOString(),
      details: `Delegation extended from ${new Date(oldEndDate).toLocaleDateString()} to ${new Date(newEndDate).toLocaleDateString()}`,
    });

    return delegation;
  }

  async recordDelegationUsage(
    delegationId: string, 
    approvalRequestId: string, 
    delegateName: string
  ): Promise<void> {
    await this.addHistoryEntry({
      delegationId,
      action: 'used',
      performedBy: delegateName,
      performedAt: new Date().toISOString(),
      details: `Approved request ${approvalRequestId} on behalf of delegator`,
      approvalRequestId,
    });
  }

  // Validation
  canDelegate(delegatorId: string, delegateId: string): { valid: boolean; reason?: string } {
    // Check for circular delegation
    const delegateHasActiveDelegation = this.delegations.find(d => 
      d.delegatorId === delegateId && 
      d.delegateId === delegatorId &&
      (d.status === 'active' || d.status === 'pending')
    );

    if (delegateHasActiveDelegation) {
      return { valid: false, reason: 'Circular delegation not allowed' };
    }

    // Check if delegator already has active delegation
    const existingActive = this.delegations.find(d => 
      d.delegatorId === delegatorId && d.status === 'active'
    );

    if (existingActive) {
      return { valid: false, reason: 'Active delegation already exists' };
    }

    return { valid: true };
  }

  isDelegateAuthorized(
    delegateId: string, 
    environment: string, 
    urgencyLevel: string
  ): { authorized: boolean; delegation?: Delegation } {
    const activeDelegations = this.delegations.filter(d => d.status === 'active');
    const delegation = activeDelegations.find(d => d.delegateId === delegateId);

    if (!delegation) {
      return { authorized: false };
    }

    // Check environment scope
    const envScope = delegation.scopes.find(s => s.type === 'environment');
    if (envScope && !envScope.values.includes(environment)) {
      return { authorized: false, delegation };
    }

    // Check urgency scope
    const urgencyScope = delegation.scopes.find(s => s.type === 'urgency_level');
    if (urgencyScope && !urgencyScope.values.includes(urgencyLevel)) {
      return { authorized: false, delegation };
    }

    return { authorized: true, delegation };
  }

  // History
  getHistory(): DelegationHistoryEntry[] {
    return [...this.history].sort((a, b) => 
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }

  getHistoryForDelegation(delegationId: string): DelegationHistoryEntry[] {
    return this.history
      .filter(h => h.delegationId === delegationId)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }

  // Statistics
  getStats(): DelegationStats {
    const active = this.delegations.filter(d => d.status === 'active').length;
    const pending = this.delegations.filter(d => d.status === 'pending').length;
    const expired = this.delegations.filter(d => d.status === 'expired').length;
    const revoked = this.delegations.filter(d => d.status === 'revoked').length;
    const usageCount = this.history.filter(h => h.action === 'used').length;

    // Calculate average duration
    const completedDelegations = this.delegations.filter(d => 
      d.status === 'expired' || d.status === 'revoked'
    );
    const totalDays = completedDelegations.reduce((sum, d) => {
      const start = new Date(d.startDate);
      const end = d.revokedAt ? new Date(d.revokedAt) : new Date(d.endDate);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    return {
      totalDelegations: this.delegations.length,
      activeDelegations: active,
      pendingDelegations: pending,
      expiredDelegations: expired,
      revokedDelegations: revoked,
      usageCount,
      averageDuration: completedDelegations.length > 0 ? totalDays / completedDelegations.length : 0,
    };
  }

  // Available delegates
  getAvailableDelegates(): { id: string; name: string; role: string }[] {
    return [
      { id: 'approver_1', name: 'Sarah Mitchell', role: 'IT Manager' },
      { id: 'approver_2', name: 'James Wilson', role: 'CTO' },
      { id: 'approver_3', name: 'Dr. Emily Chen', role: 'Security Officer' },
      { id: 'approver_4', name: 'David Thompson', role: 'Senior IT Analyst' },
      { id: 'approver_5', name: 'Michael Roberts', role: 'Security Analyst' },
      { id: 'approver_6', name: 'Lisa Anderson', role: 'Compliance Officer' },
      { id: 'approver_7', name: 'Robert Chen', role: 'Network Administrator' },
    ];
  }
}

export const approvalDelegationService = new ApprovalDelegationService();
