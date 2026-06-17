/**
 * Zero-Trust Policy Configuration Service
 * Clinical workflow access policies for MediVac One v5.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type PolicyAction = 'allow' | 'deny' | 'challenge' | 'audit' | 'notify';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VerificationType = 'mfa' | 'biometric' | 'supervisor' | 'pin' | 'security_question';

export interface AccessCondition {
  type: 'role' | 'department' | 'time' | 'location' | 'device' | 'risk_score' | 'patient_relationship' | 'emergency';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: string | string[] | number | number[] | boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  conditions: AccessCondition[];
  conditionLogic: 'all' | 'any';
  action: PolicyAction;
  verificationRequired?: VerificationType[];
  notifyRoles?: string[];
  auditLevel: 'none' | 'basic' | 'detailed' | 'forensic';
  priority: number;
  enabled: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  resource: string;
  resourceType: 'patient_record' | 'medication' | 'lab_result' | 'imaging' | 'billing' | 'admin' | 'system' | 'all';
  rules: PolicyRule[];
  defaultAction: PolicyAction;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'clinical' | 'administrative' | 'emergency' | 'compliance' | 'security';
  policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'version'>;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  resource: string;
  resourceType: string;
  action: string;
  timestamp: string;
  context: AccessContext;
  policyId?: string;
  ruleId?: string;
  decision: PolicyAction;
  riskScore: number;
  verificationCompleted?: VerificationType[];
}

export interface AccessContext {
  ipAddress: string;
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  deviceTrusted: boolean;
  location?: { latitude: number; longitude: number; facility?: string };
  timeOfDay: string;
  dayOfWeek: number;
  isEmergency: boolean;
  patientId?: string;
  patientRelationship?: 'assigned' | 'treating' | 'consulting' | 'emergency' | 'none';
  sessionDuration: number;
  previousAccessCount: number;
  riskIndicators: string[];
}

export interface PolicySimulationResult {
  request: AccessRequest;
  matchedPolicy?: AccessPolicy;
  matchedRule?: PolicyRule;
  decision: PolicyAction;
  riskScore: number;
  reasoning: string[];
  recommendations: string[];
}

// ==========================================
// Policy Templates
// ==========================================

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'template_clinical_standard',
    name: 'Standard Clinical Access',
    description: 'Default policy for clinical staff accessing patient records',
    category: 'clinical',
    policy: {
      name: 'Standard Clinical Access',
      description: 'Allows clinical staff to access assigned patient records during normal hours',
      resource: 'patient_records',
      resourceType: 'patient_record',
      defaultAction: 'deny',
      enabled: true,
      rules: [
        {
          id: 'rule_assigned_patients',
          name: 'Assigned Patient Access',
          description: 'Allow access to assigned patients',
          conditions: [
            { type: 'role', operator: 'in', value: ['doctor', 'nurse', 'specialist'] },
            { type: 'patient_relationship', operator: 'in', value: ['assigned', 'treating'] },
          ],
          conditionLogic: 'all',
          action: 'allow',
          auditLevel: 'basic',
          priority: 1,
          enabled: true,
        },
        {
          id: 'rule_consulting_access',
          name: 'Consulting Access',
          description: 'Allow consulting access with additional verification',
          conditions: [
            { type: 'role', operator: 'in', value: ['doctor', 'specialist'] },
            { type: 'patient_relationship', operator: 'equals', value: 'consulting' },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa'],
          auditLevel: 'detailed',
          priority: 2,
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'template_emergency_access',
    name: 'Emergency Access Override',
    description: 'Break-glass policy for emergency situations',
    category: 'emergency',
    policy: {
      name: 'Emergency Access Override',
      description: 'Allows emergency access with full audit trail',
      resource: 'all_records',
      resourceType: 'all',
      defaultAction: 'deny',
      enabled: true,
      rules: [
        {
          id: 'rule_emergency_clinical',
          name: 'Emergency Clinical Access',
          description: 'Allow emergency access for clinical staff',
          conditions: [
            { type: 'role', operator: 'in', value: ['doctor', 'nurse', 'emergency_physician'] },
            { type: 'emergency', operator: 'equals', value: true },
          ],
          conditionLogic: 'all',
          action: 'allow',
          notifyRoles: ['privacy_officer', 'department_head'],
          auditLevel: 'forensic',
          priority: 0,
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'template_after_hours',
    name: 'After Hours Access',
    description: 'Restricted access policy for after-hours operations',
    category: 'security',
    policy: {
      name: 'After Hours Access Control',
      description: 'Additional verification required for after-hours access',
      resource: 'all_records',
      resourceType: 'all',
      defaultAction: 'challenge',
      enabled: true,
      rules: [
        {
          id: 'rule_night_shift',
          name: 'Night Shift Access',
          description: 'Allow night shift staff with verification',
          conditions: [
            { type: 'time', operator: 'between', value: ['22:00', '06:00'] },
            { type: 'role', operator: 'in', value: ['doctor', 'nurse', 'night_supervisor'] },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa', 'biometric'],
          auditLevel: 'detailed',
          priority: 1,
          enabled: true,
        },
        {
          id: 'rule_weekend_access',
          name: 'Weekend Access',
          description: 'Weekend access with additional logging',
          conditions: [
            { type: 'time', operator: 'in', value: [0, 6] }, // Sunday, Saturday
          ],
          conditionLogic: 'all',
          action: 'audit',
          auditLevel: 'detailed',
          priority: 2,
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'template_medication_admin',
    name: 'Medication Administration',
    description: 'Policy for medication ordering and administration',
    category: 'clinical',
    policy: {
      name: 'Medication Access Control',
      description: 'Controls access to medication ordering and administration',
      resource: 'medications',
      resourceType: 'medication',
      defaultAction: 'deny',
      enabled: true,
      rules: [
        {
          id: 'rule_prescriber_access',
          name: 'Prescriber Access',
          description: 'Allow prescribers to order medications',
          conditions: [
            { type: 'role', operator: 'in', value: ['doctor', 'nurse_practitioner', 'specialist'] },
            { type: 'patient_relationship', operator: 'in', value: ['assigned', 'treating'] },
          ],
          conditionLogic: 'all',
          action: 'allow',
          auditLevel: 'detailed',
          priority: 1,
          enabled: true,
        },
        {
          id: 'rule_controlled_substances',
          name: 'Controlled Substance Access',
          description: 'Additional verification for controlled substances',
          conditions: [
            { type: 'role', operator: 'in', value: ['doctor', 'nurse_practitioner'] },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa', 'supervisor'],
          auditLevel: 'forensic',
          priority: 0,
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'template_admin_access',
    name: 'Administrative System Access',
    description: 'Policy for administrative and system functions',
    category: 'administrative',
    policy: {
      name: 'Administrative Access Control',
      description: 'Controls access to administrative functions',
      resource: 'admin_functions',
      resourceType: 'admin',
      defaultAction: 'deny',
      enabled: true,
      rules: [
        {
          id: 'rule_admin_staff',
          name: 'Admin Staff Access',
          description: 'Allow admin staff during business hours',
          conditions: [
            { type: 'role', operator: 'in', value: ['admin', 'billing', 'reception'] },
            { type: 'time', operator: 'between', value: ['07:00', '19:00'] },
            { type: 'device', operator: 'equals', value: 'trusted' },
          ],
          conditionLogic: 'all',
          action: 'allow',
          auditLevel: 'basic',
          priority: 1,
          enabled: true,
        },
        {
          id: 'rule_system_admin',
          name: 'System Administrator Access',
          description: 'Full system access with MFA',
          conditions: [
            { type: 'role', operator: 'equals', value: 'system_admin' },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa', 'biometric'],
          auditLevel: 'forensic',
          priority: 0,
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'template_high_risk',
    name: 'High Risk Access Control',
    description: 'Policy for high-risk access patterns',
    category: 'security',
    policy: {
      name: 'High Risk Access Control',
      description: 'Additional controls for high-risk access patterns',
      resource: 'all_records',
      resourceType: 'all',
      defaultAction: 'audit',
      enabled: true,
      rules: [
        {
          id: 'rule_high_risk_score',
          name: 'High Risk Score Block',
          description: 'Block access when risk score is critical',
          conditions: [
            { type: 'risk_score', operator: 'greater_than', value: 80 },
          ],
          conditionLogic: 'all',
          action: 'deny',
          notifyRoles: ['security_officer', 'privacy_officer'],
          auditLevel: 'forensic',
          priority: 0,
          enabled: true,
        },
        {
          id: 'rule_medium_risk',
          name: 'Medium Risk Challenge',
          description: 'Challenge access when risk is elevated',
          conditions: [
            { type: 'risk_score', operator: 'between', value: [50, 80] },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa'],
          auditLevel: 'detailed',
          priority: 1,
          enabled: true,
        },
        {
          id: 'rule_untrusted_device',
          name: 'Untrusted Device',
          description: 'Additional verification for untrusted devices',
          conditions: [
            { type: 'device', operator: 'equals', value: 'untrusted' },
          ],
          conditionLogic: 'all',
          action: 'challenge',
          verificationRequired: ['mfa', 'security_question'],
          auditLevel: 'detailed',
          priority: 2,
          enabled: true,
        },
      ],
    },
  },
];

// ==========================================
// Service Class
// ==========================================

class ZeroTrustPolicyService {
  private static instance: ZeroTrustPolicyService;
  private policies: AccessPolicy[] = [];
  private accessLog: AccessRequest[] = [];
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadData();
  }

  static getInstance(): ZeroTrustPolicyService {
    if (!ZeroTrustPolicyService.instance) {
      ZeroTrustPolicyService.instance = new ZeroTrustPolicyService();
    }
    return ZeroTrustPolicyService.instance;
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
      const [policies, accessLog] = await Promise.all([
        AsyncStorage.getItem('zero_trust_policies'),
        AsyncStorage.getItem('zero_trust_access_log'),
      ]);
      
      if (policies) this.policies = JSON.parse(policies);
      if (accessLog) this.accessLog = JSON.parse(accessLog);

      // Initialize with default policies if empty
      if (this.policies.length === 0) {
        await this.initializeDefaultPolicies();
      }
    } catch (error) {
      console.error('Failed to load zero-trust policies:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('zero_trust_policies', JSON.stringify(this.policies)),
        AsyncStorage.setItem('zero_trust_access_log', JSON.stringify(this.accessLog.slice(0, 1000))),
      ]);
    } catch (error) {
      console.error('Failed to save zero-trust policies:', error);
    }
  }

  private async initializeDefaultPolicies(): Promise<void> {
    for (const template of POLICY_TEMPLATES) {
      await this.createPolicyFromTemplate(template.id, 'system');
    }
  }

  // ==========================================
  // Policy Management
  // ==========================================

  async createPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AccessPolicy> {
    const newPolicy: AccessPolicy = {
      ...policy,
      id: `policy_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.policies.push(newPolicy);
    await this.saveData();
    this.emit('policy_created', newPolicy);
    return newPolicy;
  }

  async createPolicyFromTemplate(templateId: string, createdBy: string): Promise<AccessPolicy> {
    const template = POLICY_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.createPolicy({
      ...template.policy,
      createdBy,
    });
  }

  async updatePolicy(policyId: string, updates: Partial<AccessPolicy>): Promise<AccessPolicy> {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index < 0) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const updated: AccessPolicy = {
      ...this.policies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: this.policies[index].version + 1,
    };

    this.policies[index] = updated;
    await this.saveData();
    this.emit('policy_updated', updated);
    return updated;
  }

  async deletePolicy(policyId: string): Promise<void> {
    this.policies = this.policies.filter(p => p.id !== policyId);
    await this.saveData();
    this.emit('policy_deleted', policyId);
  }

  async togglePolicy(policyId: string, enabled: boolean): Promise<void> {
    await this.updatePolicy(policyId, { enabled });
  }

  getPolicies(): AccessPolicy[] {
    return [...this.policies];
  }

  getPolicy(policyId: string): AccessPolicy | undefined {
    return this.policies.find(p => p.id === policyId);
  }

  getPolicyTemplates(): PolicyTemplate[] {
    return [...POLICY_TEMPLATES];
  }

  // ==========================================
  // Rule Management
  // ==========================================

  async addRule(policyId: string, rule: Omit<PolicyRule, 'id'>): Promise<PolicyRule> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const newRule: PolicyRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };

    policy.rules.push(newRule);
    policy.rules.sort((a, b) => a.priority - b.priority);
    await this.saveData();
    this.emit('rule_added', { policyId, rule: newRule });
    return newRule;
  }

  async updateRule(policyId: string, ruleId: string, updates: Partial<PolicyRule>): Promise<void> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const ruleIndex = policy.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex < 0) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    policy.rules[ruleIndex] = { ...policy.rules[ruleIndex], ...updates };
    policy.rules.sort((a, b) => a.priority - b.priority);
    await this.saveData();
    this.emit('rule_updated', { policyId, ruleId, updates });
  }

  async deleteRule(policyId: string, ruleId: string): Promise<void> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    policy.rules = policy.rules.filter(r => r.id !== ruleId);
    await this.saveData();
    this.emit('rule_deleted', { policyId, ruleId });
  }

  // ==========================================
  // Access Evaluation
  // ==========================================

  async evaluateAccess(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceType: string,
    action: string,
    context: AccessContext
  ): Promise<AccessRequest> {
    const riskScore = this.calculateRiskScore(context);
    
    // Find applicable policies
    const applicablePolicies = this.policies.filter(
      p => p.enabled && (p.resourceType === resourceType || p.resourceType === 'all')
    );

    let decision: PolicyAction = 'deny';
    let matchedPolicy: AccessPolicy | undefined;
    let matchedRule: PolicyRule | undefined;

    // Evaluate policies by priority
    for (const policy of applicablePolicies) {
      for (const rule of policy.rules.filter(r => r.enabled)) {
        if (this.evaluateConditions(rule.conditions, rule.conditionLogic, userRole, context, riskScore)) {
          decision = rule.action;
          matchedPolicy = policy;
          matchedRule = rule;
          break;
        }
      }
      if (matchedRule) break;
    }

    // If no rule matched, use default action from first applicable policy
    if (!matchedRule && applicablePolicies.length > 0) {
      decision = applicablePolicies[0].defaultAction;
      matchedPolicy = applicablePolicies[0];
    }

    const accessRequest: AccessRequest = {
      id: `access_${Date.now()}`,
      userId,
      userName,
      userRole,
      resource,
      resourceType,
      action,
      timestamp: new Date().toISOString(),
      context,
      policyId: matchedPolicy?.id,
      ruleId: matchedRule?.id,
      decision,
      riskScore,
    };

    // Log access request
    this.accessLog.unshift(accessRequest);
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(0, 1000);
    }
    await this.saveData();

    this.emit('access_evaluated', accessRequest);
    return accessRequest;
  }

  private evaluateConditions(
    conditions: AccessCondition[],
    logic: 'all' | 'any',
    userRole: string,
    context: AccessContext,
    riskScore: number
  ): boolean {
    const results = conditions.map(condition => this.evaluateCondition(condition, userRole, context, riskScore));
    return logic === 'all' ? results.every(r => r) : results.some(r => r);
  }

  private evaluateCondition(
    condition: AccessCondition,
    userRole: string,
    context: AccessContext,
    riskScore: number
  ): boolean {
    let actualValue: unknown;

    switch (condition.type) {
      case 'role':
        actualValue = userRole;
        break;
      case 'time':
        actualValue = context.timeOfDay;
        break;
      case 'device':
        actualValue = context.deviceTrusted ? 'trusted' : 'untrusted';
        break;
      case 'risk_score':
        actualValue = riskScore;
        break;
      case 'patient_relationship':
        actualValue = context.patientRelationship;
        break;
      case 'emergency':
        actualValue = context.isEmergency;
        break;
      case 'location':
        actualValue = context.location?.facility;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'not_equals':
        return actualValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && (condition.value as string[]).includes(actualValue as string);
      case 'not_in':
        return Array.isArray(condition.value) && !(condition.value as string[]).includes(actualValue as string);
      case 'greater_than':
        return typeof actualValue === 'number' && actualValue > (condition.value as number);
      case 'less_than':
        return typeof actualValue === 'number' && actualValue < (condition.value as number);
      case 'between':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          if (typeof actualValue === 'number') {
            return actualValue >= (condition.value[0] as number) && actualValue <= (condition.value[1] as number);
          }
          if (typeof actualValue === 'string') {
            return actualValue >= condition.value[0] && actualValue <= condition.value[1];
          }
        }
        return false;
      case 'contains':
        return typeof actualValue === 'string' && actualValue.includes(condition.value as string);
      default:
        return false;
    }
  }

  private calculateRiskScore(context: AccessContext): number {
    let score = 0;

    // Device trust
    if (!context.deviceTrusted) score += 20;
    if (context.deviceType === 'unknown') score += 15;

    // Time-based risk
    const hour = parseInt(context.timeOfDay.split(':')[0]);
    if (hour < 6 || hour > 22) score += 15;
    if (context.dayOfWeek === 0 || context.dayOfWeek === 6) score += 10;

    // Session and behavior
    if (context.sessionDuration > 480) score += 10; // Over 8 hours
    if (context.previousAccessCount > 100) score += 15; // High access volume

    // Risk indicators
    score += context.riskIndicators.length * 10;

    // Patient relationship
    if (context.patientRelationship === 'none') score += 25;
    if (context.patientRelationship === 'consulting') score += 5;

    return Math.min(100, score);
  }

  // ==========================================
  // Policy Simulation
  // ==========================================

  async simulateAccess(
    userRole: string,
    resourceType: string,
    context: Partial<AccessContext>
  ): Promise<PolicySimulationResult> {
    const fullContext: AccessContext = {
      ipAddress: context.ipAddress || '192.168.1.1',
      deviceId: context.deviceId || 'device_001',
      deviceType: context.deviceType || 'desktop',
      deviceTrusted: context.deviceTrusted ?? true,
      location: context.location,
      timeOfDay: context.timeOfDay || new Date().toTimeString().slice(0, 5),
      dayOfWeek: context.dayOfWeek ?? new Date().getDay(),
      isEmergency: context.isEmergency ?? false,
      patientId: context.patientId,
      patientRelationship: context.patientRelationship || 'assigned',
      sessionDuration: context.sessionDuration || 60,
      previousAccessCount: context.previousAccessCount || 10,
      riskIndicators: context.riskIndicators || [],
    };

    const riskScore = this.calculateRiskScore(fullContext);
    const reasoning: string[] = [];
    const recommendations: string[] = [];

    // Find applicable policies
    const applicablePolicies = this.policies.filter(
      p => p.enabled && (p.resourceType === resourceType || p.resourceType === 'all')
    );

    reasoning.push(`Found ${applicablePolicies.length} applicable policies`);

    let decision: PolicyAction = 'deny';
    let matchedPolicy: AccessPolicy | undefined;
    let matchedRule: PolicyRule | undefined;

    for (const policy of applicablePolicies) {
      reasoning.push(`Evaluating policy: ${policy.name}`);
      
      for (const rule of policy.rules.filter(r => r.enabled)) {
        const conditionResults = rule.conditions.map(c => ({
          condition: c,
          result: this.evaluateCondition(c, userRole, fullContext, riskScore),
        }));

        const ruleMatches = rule.conditionLogic === 'all'
          ? conditionResults.every(r => r.result)
          : conditionResults.some(r => r.result);

        if (ruleMatches) {
          decision = rule.action;
          matchedPolicy = policy;
          matchedRule = rule;
          reasoning.push(`Rule "${rule.name}" matched with action: ${rule.action}`);
          break;
        } else {
          const failedConditions = conditionResults.filter(r => !r.result);
          reasoning.push(`Rule "${rule.name}" did not match: ${failedConditions.length} conditions failed`);
        }
      }
      if (matchedRule) break;
    }

    if (!matchedRule) {
      decision = applicablePolicies[0]?.defaultAction || 'deny';
      reasoning.push(`No rules matched, using default action: ${decision}`);
    }

    // Generate recommendations
    if (riskScore > 50) {
      recommendations.push('Consider using a trusted device to reduce risk score');
    }
    if (!fullContext.deviceTrusted) {
      recommendations.push('Register this device as trusted for smoother access');
    }
    if (decision === 'challenge') {
      recommendations.push('Complete MFA verification to proceed with access');
    }
    if (decision === 'deny') {
      recommendations.push('Contact your supervisor or security team for access approval');
    }

    return {
      request: {
        id: `sim_${Date.now()}`,
        userId: 'simulation',
        userName: 'Simulation User',
        userRole,
        resource: 'simulation',
        resourceType,
        action: 'read',
        timestamp: new Date().toISOString(),
        context: fullContext,
        policyId: matchedPolicy?.id,
        ruleId: matchedRule?.id,
        decision,
        riskScore,
      },
      matchedPolicy,
      matchedRule,
      decision,
      riskScore,
      reasoning,
      recommendations,
    };
  }

  // ==========================================
  // Access Log & Analytics
  // ==========================================

  getAccessLog(filters?: {
    userId?: string;
    decision?: PolicyAction;
    startDate?: string;
    endDate?: string;
    resourceType?: string;
  }): AccessRequest[] {
    let log = [...this.accessLog];

    if (filters?.userId) {
      log = log.filter(r => r.userId === filters.userId);
    }
    if (filters?.decision) {
      log = log.filter(r => r.decision === filters.decision);
    }
    if (filters?.startDate) {
      log = log.filter(r => r.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      log = log.filter(r => r.timestamp <= filters.endDate!);
    }
    if (filters?.resourceType) {
      log = log.filter(r => r.resourceType === filters.resourceType);
    }

    return log;
  }

  getAccessStats(): {
    totalRequests: number;
    allowed: number;
    denied: number;
    challenged: number;
    averageRiskScore: number;
    byResourceType: Record<string, number>;
    byDecision: Record<string, number>;
  } {
    const stats = {
      totalRequests: this.accessLog.length,
      allowed: 0,
      denied: 0,
      challenged: 0,
      averageRiskScore: 0,
      byResourceType: {} as Record<string, number>,
      byDecision: {} as Record<string, number>,
    };

    let totalRisk = 0;

    this.accessLog.forEach(request => {
      totalRisk += request.riskScore;

      if (request.decision === 'allow') stats.allowed++;
      else if (request.decision === 'deny') stats.denied++;
      else if (request.decision === 'challenge') stats.challenged++;

      stats.byResourceType[request.resourceType] = (stats.byResourceType[request.resourceType] || 0) + 1;
      stats.byDecision[request.decision] = (stats.byDecision[request.decision] || 0) + 1;
    });

    stats.averageRiskScore = this.accessLog.length > 0 ? Math.round(totalRisk / this.accessLog.length) : 0;

    return stats;
  }
}

export const zeroTrustPolicyService = ZeroTrustPolicyService.getInstance();
