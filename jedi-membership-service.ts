/**
 * MediVac One - JEDI Master Membership & Access Control Service
 * Manages AI assistant privileges, control options, and system access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIPersonaRole, JEDIMastershipLevel } from './ai-assistant-service';

// ==========================================
// Types and Interfaces
// ==========================================

export interface JEDIMembership {
  id: string;
  userId: string;
  level: JEDIMastershipLevel;
  title: string;
  grantedAt: string;
  expiresAt?: string;
  grantedBy: string;
  privileges: MembershipPrivilege[];
  controlAuthority: ControlAuthority;
  systemAccess: SystemAccess[];
  aiAssistantAccess: AIAssistantAccess;
}

export interface MembershipPrivilege {
  id: string;
  name: string;
  category: PrivilegeCategory;
  level: PrivilegeLevel;
  scope: string[];
  enabled: boolean;
  restrictions?: string[];
}

export type PrivilegeCategory = 
  | 'records'
  | 'calendar'
  | 'tasks'
  | 'email'
  | 'events'
  | 'system'
  | 'clinical'
  | 'admin'
  | 'financial'
  | 'hr'
  | 'security'
  | 'integration';

export type PrivilegeLevel = 'none' | 'read' | 'write' | 'execute' | 'admin' | 'supreme';

export interface ControlAuthority {
  level: number; // 1-10
  title: string;
  canOverride: boolean;
  canDelegate: boolean;
  canApprove: boolean;
  canBroadcast: boolean;
  canEmergencyAccess: boolean;
  maxDelegationLevel: number;
}

export interface SystemAccess {
  systemId: string;
  systemName: string;
  accessLevel: PrivilegeLevel;
  modules: string[];
  restrictions?: string[];
}

export interface AIAssistantAccess {
  enabled: boolean;
  personas: AIPersonaRole[];
  maxConcurrentSessions: number;
  actionExecutionEnabled: boolean;
  voiceEnabled: boolean;
  automationEnabled: boolean;
  integrationAccess: string[];
}

export interface AccessControlRule {
  id: string;
  name: string;
  description: string;
  conditions: AccessCondition[];
  actions: AccessAction[];
  priority: number;
  enabled: boolean;
}

export interface AccessCondition {
  type: 'role' | 'level' | 'time' | 'location' | 'department' | 'emergency';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: string | number | string[];
}

export interface AccessAction {
  type: 'allow' | 'deny' | 'require_approval' | 'log' | 'notify';
  target: string;
  params?: Record<string, unknown>;
}

export interface ControlOption {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'notification' | 'workflow' | 'integration' | 'security' | 'ai';
  enabled: boolean;
  config: ControlConfig;
  requiredLevel: JEDIMastershipLevel;
}

export interface ControlConfig {
  autoExecute: boolean;
  requireConfirmation: boolean;
  notifyOnAction: boolean;
  logAllActions: boolean;
  maxActionsPerHour?: number;
  allowedHours?: { start: string; end: string };
  targetSystems?: string[];
}

// ==========================================
// JEDI Mastership Level Configuration
// ==========================================

const MASTERSHIP_LEVELS: Record<JEDIMastershipLevel, {
  rank: number;
  title: string;
  description: string;
  basePrivileges: PrivilegeCategory[];
  maxControlLevel: number;
  canOverride: boolean;
  canDelegate: boolean;
}> = {
  initiate: {
    rank: 1,
    title: 'JEDI Initiate',
    description: 'Entry-level access with basic system capabilities',
    basePrivileges: ['records', 'calendar', 'tasks'],
    maxControlLevel: 2,
    canOverride: false,
    canDelegate: false,
  },
  padawan: {
    rank: 2,
    title: 'JEDI Padawan',
    description: 'Apprentice-level access with expanded capabilities',
    basePrivileges: ['records', 'calendar', 'tasks', 'email', 'events'],
    maxControlLevel: 4,
    canOverride: false,
    canDelegate: false,
  },
  knight: {
    rank: 3,
    title: 'JEDI Knight',
    description: 'Full operational access with departmental authority',
    basePrivileges: ['records', 'calendar', 'tasks', 'email', 'events', 'clinical', 'admin'],
    maxControlLevel: 6,
    canOverride: true,
    canDelegate: true,
  },
  master: {
    rank: 4,
    title: 'JEDI Master',
    description: 'Advanced access with cross-departmental authority',
    basePrivileges: ['records', 'calendar', 'tasks', 'email', 'events', 'clinical', 'admin', 'system'],
    maxControlLevel: 8,
    canOverride: true,
    canDelegate: true,
  },
  grand_master: {
    rank: 5,
    title: 'JEDI Grand Master',
    description: 'Executive access with organization-wide authority',
    basePrivileges: ['records', 'calendar', 'tasks', 'email', 'events', 'clinical', 'admin', 'system', 'financial', 'hr', 'security'],
    maxControlLevel: 9,
    canOverride: true,
    canDelegate: true,
  },
  supreme_commander: {
    rank: 6,
    title: 'JEDI Supreme Commander',
    description: 'Unrestricted access with supreme authority over all systems',
    basePrivileges: ['records', 'calendar', 'tasks', 'email', 'events', 'clinical', 'admin', 'system', 'financial', 'hr', 'security', 'integration'],
    maxControlLevel: 10,
    canOverride: true,
    canDelegate: true,
  },
};

// ==========================================
// Default Control Options by Level
// ==========================================

const DEFAULT_CONTROL_OPTIONS: ControlOption[] = [
  // Automation Controls
  {
    id: 'ctrl_auto_scheduling',
    name: 'Automatic Scheduling',
    description: 'AI assistant can automatically schedule appointments and meetings',
    category: 'automation',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'padawan',
  },
  {
    id: 'ctrl_auto_tasks',
    name: 'Task Automation',
    description: 'AI assistant can create and assign tasks automatically',
    category: 'automation',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'knight',
  },
  {
    id: 'ctrl_auto_alerts',
    name: 'Automated Alerts',
    description: 'AI assistant can send alerts based on triggers',
    category: 'automation',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'padawan',
  },
  {
    id: 'ctrl_workflow_automation',
    name: 'Workflow Automation',
    description: 'AI assistant can execute multi-step workflows',
    category: 'workflow',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'master',
  },

  // Notification Controls
  {
    id: 'ctrl_email_notifications',
    name: 'Email Notifications',
    description: 'AI assistant can send email notifications',
    category: 'notification',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: true },
    requiredLevel: 'padawan',
  },
  {
    id: 'ctrl_push_notifications',
    name: 'Push Notifications',
    description: 'AI assistant can send push notifications',
    category: 'notification',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: true },
    requiredLevel: 'initiate',
  },
  {
    id: 'ctrl_broadcast',
    name: 'System Broadcast',
    description: 'AI assistant can send facility-wide broadcasts',
    category: 'notification',
    enabled: false,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'grand_master',
  },

  // Integration Controls
  {
    id: 'ctrl_calendar_sync',
    name: 'Calendar Integration',
    description: 'AI assistant can sync with external calendars',
    category: 'integration',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: true, targetSystems: ['office365', 'google'] },
    requiredLevel: 'knight',
  },
  {
    id: 'ctrl_email_integration',
    name: 'Email Integration',
    description: 'AI assistant can access and send emails',
    category: 'integration',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true, targetSystems: ['office365', 'gmail'] },
    requiredLevel: 'knight',
  },
  {
    id: 'ctrl_ehr_integration',
    name: 'EHR Integration',
    description: 'AI assistant can access electronic health records',
    category: 'integration',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: false, notifyOnAction: false, logAllActions: true, targetSystems: ['fhir', 'hl7'] },
    requiredLevel: 'knight',
  },
  {
    id: 'ctrl_gp_integration',
    name: 'GP Practice Integration',
    description: 'AI assistant can exchange records with GP practices',
    category: 'integration',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'master',
  },

  // Security Controls
  {
    id: 'ctrl_access_override',
    name: 'Access Override',
    description: 'AI assistant can override access restrictions in emergencies',
    category: 'security',
    enabled: false,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'grand_master',
  },
  {
    id: 'ctrl_audit_access',
    name: 'Audit Log Access',
    description: 'AI assistant can access and analyze audit logs',
    category: 'security',
    enabled: true,
    config: { autoExecute: false, requireConfirmation: false, notifyOnAction: false, logAllActions: true },
    requiredLevel: 'master',
  },
  {
    id: 'ctrl_emergency_protocols',
    name: 'Emergency Protocol Activation',
    description: 'AI assistant can activate emergency protocols',
    category: 'security',
    enabled: false,
    config: { autoExecute: false, requireConfirmation: true, notifyOnAction: true, logAllActions: true },
    requiredLevel: 'master',
  },

  // AI-Specific Controls
  {
    id: 'ctrl_ai_voice',
    name: 'Voice Interaction',
    description: 'Enable voice commands and responses with AI assistant',
    category: 'ai',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: false },
    requiredLevel: 'initiate',
  },
  {
    id: 'ctrl_ai_proactive',
    name: 'Proactive Assistance',
    description: 'AI assistant can proactively offer suggestions',
    category: 'ai',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: false },
    requiredLevel: 'padawan',
  },
  {
    id: 'ctrl_ai_learning',
    name: 'Personalized Learning',
    description: 'AI assistant learns from user preferences and behavior',
    category: 'ai',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: false },
    requiredLevel: 'padawan',
  },
  {
    id: 'ctrl_ai_multi_session',
    name: 'Multi-Session Management',
    description: 'AI assistant can manage multiple concurrent sessions',
    category: 'ai',
    enabled: true,
    config: { autoExecute: true, requireConfirmation: false, notifyOnAction: false, logAllActions: true },
    requiredLevel: 'knight',
  },
];

// ==========================================
// JEDI Membership Service
// ==========================================

class JEDIMembershipService {
  private memberships: Map<string, JEDIMembership> = new Map();
  private accessRules: AccessControlRule[] = [];
  private controlOptions: Map<string, ControlOption[]> = new Map();

  constructor() {
    this.loadState();
    this.initializeDefaultRules();
  }

  private async loadState(): Promise<void> {
    try {
      const membershipData = await AsyncStorage.getItem('jedi_memberships');
      if (membershipData) {
        const parsed = JSON.parse(membershipData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.memberships.set(key, value as JEDIMembership);
        });
      }

      const controlData = await AsyncStorage.getItem('jedi_control_options');
      if (controlData) {
        const parsed = JSON.parse(controlData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.controlOptions.set(key, value as ControlOption[]);
        });
      }
    } catch (error) {
      console.error('Failed to load JEDI membership state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const membershipObj: Record<string, JEDIMembership> = {};
      this.memberships.forEach((value, key) => {
        membershipObj[key] = value;
      });
      await AsyncStorage.setItem('jedi_memberships', JSON.stringify(membershipObj));

      const controlObj: Record<string, ControlOption[]> = {};
      this.controlOptions.forEach((value, key) => {
        controlObj[key] = value;
      });
      await AsyncStorage.setItem('jedi_control_options', JSON.stringify(controlObj));
    } catch (error) {
      console.error('Failed to save JEDI membership state:', error);
    }
  }

  private initializeDefaultRules(): void {
    this.accessRules = [
      {
        id: 'rule_emergency_override',
        name: 'Emergency Override',
        description: 'Allow emergency access override for critical situations',
        conditions: [
          { type: 'emergency', operator: 'equals', value: 'true' },
          { type: 'level', operator: 'greater_than', value: 3 },
        ],
        actions: [
          { type: 'allow', target: 'all_systems' },
          { type: 'log', target: 'audit_log' },
          { type: 'notify', target: 'security_team' },
        ],
        priority: 100,
        enabled: true,
      },
      {
        id: 'rule_clinical_access',
        name: 'Clinical Record Access',
        description: 'Control access to clinical records based on role',
        conditions: [
          { type: 'role', operator: 'in_range', value: ['doctor', 'nurse', 'pharmacist', 'lab_tech'] },
        ],
        actions: [
          { type: 'allow', target: 'clinical_records' },
          { type: 'log', target: 'access_log' },
        ],
        priority: 50,
        enabled: true,
      },
      {
        id: 'rule_after_hours',
        name: 'After Hours Access',
        description: 'Require additional verification for after-hours access',
        conditions: [
          { type: 'time', operator: 'in_range', value: ['22:00', '06:00'] },
        ],
        actions: [
          { type: 'require_approval', target: 'supervisor' },
          { type: 'log', target: 'audit_log' },
        ],
        priority: 30,
        enabled: true,
      },
    ];
  }

  // ==========================================
  // Membership Management
  // ==========================================

  async grantMembership(
    userId: string,
    level: JEDIMastershipLevel,
    grantedBy: string,
    customPrivileges?: MembershipPrivilege[]
  ): Promise<JEDIMembership> {
    const levelConfig = MASTERSHIP_LEVELS[level];
    
    const membership: JEDIMembership = {
      id: `membership_${Date.now()}_${userId}`,
      userId,
      level,
      title: levelConfig.title,
      grantedAt: new Date().toISOString(),
      grantedBy,
      privileges: customPrivileges || this.generateDefaultPrivileges(level),
      controlAuthority: {
        level: levelConfig.maxControlLevel,
        title: levelConfig.title,
        canOverride: levelConfig.canOverride,
        canDelegate: levelConfig.canDelegate,
        canApprove: levelConfig.rank >= 3,
        canBroadcast: levelConfig.rank >= 5,
        canEmergencyAccess: levelConfig.rank >= 4,
        maxDelegationLevel: Math.max(1, levelConfig.rank - 1),
      },
      systemAccess: this.generateSystemAccess(level),
      aiAssistantAccess: this.generateAIAccess(level),
    };

    this.memberships.set(userId, membership);
    
    // Initialize control options for user
    const userControls = DEFAULT_CONTROL_OPTIONS.filter(ctrl => {
      const requiredRank = MASTERSHIP_LEVELS[ctrl.requiredLevel].rank;
      return levelConfig.rank >= requiredRank;
    });
    this.controlOptions.set(userId, userControls);

    await this.saveState();
    return membership;
  }

  async revokeMembership(userId: string): Promise<void> {
    this.memberships.delete(userId);
    this.controlOptions.delete(userId);
    await this.saveState();
  }

  async upgradeMembership(userId: string, newLevel: JEDIMastershipLevel, upgradedBy: string): Promise<JEDIMembership> {
    const existing = this.memberships.get(userId);
    if (!existing) {
      return this.grantMembership(userId, newLevel, upgradedBy);
    }

    const currentRank = MASTERSHIP_LEVELS[existing.level].rank;
    const newRank = MASTERSHIP_LEVELS[newLevel].rank;

    if (newRank <= currentRank) {
      throw new Error('Cannot downgrade membership level');
    }

    return this.grantMembership(userId, newLevel, upgradedBy, existing.privileges);
  }

  getMembership(userId: string): JEDIMembership | undefined {
    return this.memberships.get(userId);
  }

  getAllMemberships(): JEDIMembership[] {
    return Array.from(this.memberships.values());
  }

  private generateDefaultPrivileges(level: JEDIMastershipLevel): MembershipPrivilege[] {
    const levelConfig = MASTERSHIP_LEVELS[level];
    const privileges: MembershipPrivilege[] = [];

    levelConfig.basePrivileges.forEach((category, index) => {
      privileges.push({
        id: `priv_${category}_${level}`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Access`,
        category,
        level: levelConfig.rank >= 5 ? 'admin' : levelConfig.rank >= 3 ? 'write' : 'read',
        scope: ['*'],
        enabled: true,
      });
    });

    return privileges;
  }

  private generateSystemAccess(level: JEDIMastershipLevel): SystemAccess[] {
    const levelConfig = MASTERSHIP_LEVELS[level];
    const systems: SystemAccess[] = [];

    const allSystems = [
      { id: 'patients', name: 'Patient Management', modules: ['records', 'vitals', 'history'] },
      { id: 'scheduling', name: 'Scheduling System', modules: ['appointments', 'calendar', 'availability'] },
      { id: 'tasks', name: 'Task Management', modules: ['tasks', 'workflows', 'assignments'] },
      { id: 'communications', name: 'Communications', modules: ['email', 'chat', 'alerts', 'broadcasts'] },
      { id: 'clinical', name: 'Clinical Systems', modules: ['cpoe', 'mar', 'labs', 'imaging'] },
      { id: 'admin', name: 'Administration', modules: ['users', 'roles', 'settings'] },
      { id: 'analytics', name: 'Analytics', modules: ['reports', 'dashboards', 'metrics'] },
      { id: 'jedi', name: 'JEDI Systems', modules: ['hub', 'integrations', 'sync'] },
      { id: 'security', name: 'Security', modules: ['access', 'audit', 'compliance'] },
      { id: 'finance', name: 'Finance', modules: ['billing', 'invoicing', 'payments'] },
    ];

    allSystems.forEach(system => {
      const hasAccess = levelConfig.rank >= 1; // All levels have some access
      const accessLevel: PrivilegeLevel = 
        levelConfig.rank >= 6 ? 'supreme' :
        levelConfig.rank >= 5 ? 'admin' :
        levelConfig.rank >= 3 ? 'write' :
        levelConfig.rank >= 2 ? 'read' : 'read';

      if (hasAccess) {
        systems.push({
          systemId: system.id,
          systemName: system.name,
          accessLevel,
          modules: system.modules,
        });
      }
    });

    return systems;
  }

  private generateAIAccess(level: JEDIMastershipLevel): AIAssistantAccess {
    const levelConfig = MASTERSHIP_LEVELS[level];
    
    const allPersonas: AIPersonaRole[] = [
      'doctor', 'nurse', 'admin', 'patient', 'receptionist', 'emergency',
      'lab_tech', 'pharmacist', 'surgeon', 'radiologist', 'therapist',
      'security', 'it_support', 'finance', 'hr', 'jedi_commander', 'master_jedi'
    ];

    // Higher levels get access to more personas
    const accessiblePersonas = allPersonas.slice(0, Math.min(allPersonas.length, 4 + (levelConfig.rank * 2)));

    return {
      enabled: true,
      personas: accessiblePersonas,
      maxConcurrentSessions: levelConfig.rank + 1,
      actionExecutionEnabled: levelConfig.rank >= 2,
      voiceEnabled: true,
      automationEnabled: levelConfig.rank >= 3,
      integrationAccess: levelConfig.rank >= 3 ? ['calendar', 'email', 'tasks', 'records'] : ['calendar', 'tasks'],
    };
  }

  // ==========================================
  // Access Control
  // ==========================================

  checkAccess(
    userId: string,
    resource: string,
    action: PrivilegeLevel,
    context?: { emergency?: boolean; time?: string; department?: string }
  ): { allowed: boolean; reason: string; requiresApproval?: boolean } {
    const membership = this.memberships.get(userId);
    
    if (!membership) {
      return { allowed: false, reason: 'No JEDI membership found' };
    }

    // Check emergency override
    if (context?.emergency && membership.controlAuthority.canEmergencyAccess) {
      return { allowed: true, reason: 'Emergency access granted' };
    }

    // Check privileges
    const relevantPrivilege = membership.privileges.find(p => 
      p.enabled && (p.scope.includes('*') || p.scope.includes(resource))
    );

    if (!relevantPrivilege) {
      return { allowed: false, reason: 'No privilege for this resource' };
    }

    // Check privilege level
    const levelOrder: PrivilegeLevel[] = ['none', 'read', 'write', 'execute', 'admin', 'supreme'];
    const hasLevel = levelOrder.indexOf(relevantPrivilege.level) >= levelOrder.indexOf(action);

    if (!hasLevel) {
      return { allowed: false, reason: `Insufficient privilege level: requires ${action}, has ${relevantPrivilege.level}` };
    }

    // Check access rules
    for (const rule of this.accessRules.filter(r => r.enabled).sort((a, b) => b.priority - a.priority)) {
      const conditionsMet = this.evaluateConditions(rule.conditions, membership, context);
      if (conditionsMet) {
        const requiresApproval = rule.actions.some(a => a.type === 'require_approval');
        const denied = rule.actions.some(a => a.type === 'deny');
        
        if (denied) {
          return { allowed: false, reason: `Access denied by rule: ${rule.name}` };
        }
        if (requiresApproval) {
          return { allowed: true, reason: `Access allowed pending approval: ${rule.name}`, requiresApproval: true };
        }
      }
    }

    return { allowed: true, reason: 'Access granted' };
  }

  private evaluateConditions(
    conditions: AccessCondition[],
    membership: JEDIMembership,
    context?: { emergency?: boolean; time?: string; department?: string }
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'level':
          const levelRank = MASTERSHIP_LEVELS[membership.level].rank;
          if (condition.operator === 'greater_than') {
            return levelRank > (condition.value as number);
          }
          if (condition.operator === 'less_than') {
            return levelRank < (condition.value as number);
          }
          return levelRank === condition.value;
        
        case 'emergency':
          return context?.emergency === (condition.value === 'true');
        
        case 'time':
          if (!context?.time) return false;
          const [start, end] = condition.value as string[];
          const currentHour = parseInt(context.time.split(':')[0]);
          const startHour = parseInt(start.split(':')[0]);
          const endHour = parseInt(end.split(':')[0]);
          if (startHour > endHour) {
            return currentHour >= startHour || currentHour < endHour;
          }
          return currentHour >= startHour && currentHour < endHour;
        
        case 'department':
          return context?.department === condition.value;
        
        default:
          return true;
      }
    });
  }

  // ==========================================
  // Control Options Management
  // ==========================================

  getControlOptions(userId: string): ControlOption[] {
    return this.controlOptions.get(userId) || [];
  }

  async updateControlOption(userId: string, optionId: string, enabled: boolean, config?: Partial<ControlConfig>): Promise<void> {
    const options = this.controlOptions.get(userId) || [];
    const optionIndex = options.findIndex(o => o.id === optionId);
    
    if (optionIndex >= 0) {
      options[optionIndex].enabled = enabled;
      if (config) {
        options[optionIndex].config = { ...options[optionIndex].config, ...config };
      }
      this.controlOptions.set(userId, options);
      await this.saveState();
    }
  }

  getAvailableControlOptions(level: JEDIMastershipLevel): ControlOption[] {
    const levelConfig = MASTERSHIP_LEVELS[level];
    return DEFAULT_CONTROL_OPTIONS.filter(ctrl => {
      const requiredRank = MASTERSHIP_LEVELS[ctrl.requiredLevel].rank;
      return levelConfig.rank >= requiredRank;
    });
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalMemberships: number;
    byLevel: Record<JEDIMastershipLevel, number>;
    activeControls: number;
  } {
    const byLevel: Record<JEDIMastershipLevel, number> = {
      initiate: 0,
      padawan: 0,
      knight: 0,
      master: 0,
      grand_master: 0,
      supreme_commander: 0,
    };

    let activeControls = 0;

    this.memberships.forEach(membership => {
      byLevel[membership.level]++;
    });

    this.controlOptions.forEach(options => {
      activeControls += options.filter(o => o.enabled).length;
    });

    return {
      totalMemberships: this.memberships.size,
      byLevel,
      activeControls,
    };
  }

  getMastershipLevelInfo(level: JEDIMastershipLevel): typeof MASTERSHIP_LEVELS[JEDIMastershipLevel] {
    return MASTERSHIP_LEVELS[level];
  }

  getAllMastershipLevels(): Array<{ level: JEDIMastershipLevel; info: typeof MASTERSHIP_LEVELS[JEDIMastershipLevel] }> {
    return Object.entries(MASTERSHIP_LEVELS).map(([level, info]) => ({
      level: level as JEDIMastershipLevel,
      info,
    }));
  }
}

export const jediMembership = new JEDIMembershipService();
