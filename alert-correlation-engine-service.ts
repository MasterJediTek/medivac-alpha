/**
 * Alert Correlation Engine Service
 * Automatically groups related alerts to reduce noise and identify root causes
 */

export type AlertCategory = 'pathway' | 'system' | 'security' | 'performance' | 'user' | 'integration';
export type CorrelationStrategy = 'time-based' | 'source-based' | 'pattern-based' | 'ml-based';
export type RootCauseConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface CorrelatedAlert {
  id: string;
  originalAlertId: string;
  category: AlertCategory;
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface AlertGroup {
  id: string;
  name: string;
  alerts: CorrelatedAlert[];
  correlationStrategy: CorrelationStrategy;
  rootCause?: RootCause;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  priority: number;
  suppressedCount: number;
}

export interface RootCause {
  id: string;
  description: string;
  confidence: RootCauseConfidence;
  affectedSystems: string[];
  suggestedActions: string[];
  relatedIncidents: string[];
  identifiedAt: Date;
  identifiedBy: 'algorithm' | 'ml-model' | 'manual';
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  strategy: CorrelationStrategy;
  conditions: CorrelationCondition[];
  timeWindowMinutes: number;
  minAlertCount: number;
  priority: number;
  actions: CorrelationAction[];
}

export interface CorrelationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface CorrelationAction {
  type: 'group' | 'suppress' | 'escalate' | 'notify' | 'auto_resolve';
  config: Record<string, any>;
}

export interface NoiseReductionStats {
  totalAlertsReceived: number;
  alertsGrouped: number;
  alertsSuppressed: number;
  uniqueGroups: number;
  noiseReductionPercentage: number;
  avgGroupSize: number;
}

export interface CorrelationAnalytics {
  totalGroups: number;
  activeGroups: number;
  resolvedGroups: number;
  totalAlerts: number;
  alertsByCategory: Record<AlertCategory, number>;
  alertsBySeverity: Record<string, number>;
  topRootCauses: RootCause[];
  noiseReduction: NoiseReductionStats;
  correlationAccuracy: number;
  avgTimeToCorrelate: number;
}

// Default correlation rules
const DEFAULT_RULES: CorrelationRule[] = [
  {
    id: 'rule_pathway_cascade',
    name: 'Pathway Cascade Detection',
    description: 'Groups pathway alerts that occur within 5 minutes of each other',
    enabled: true,
    strategy: 'time-based',
    conditions: [
      { field: 'category', operator: 'equals', value: 'pathway' },
    ],
    timeWindowMinutes: 5,
    minAlertCount: 3,
    priority: 1,
    actions: [
      { type: 'group', config: { groupName: 'Pathway Cascade' } },
      { type: 'escalate', config: { level: 'critical' } },
    ],
  },
  {
    id: 'rule_same_source',
    name: 'Same Source Grouping',
    description: 'Groups alerts from the same source within 10 minutes',
    enabled: true,
    strategy: 'source-based',
    conditions: [],
    timeWindowMinutes: 10,
    minAlertCount: 2,
    priority: 2,
    actions: [
      { type: 'group', config: {} },
    ],
  },
  {
    id: 'rule_performance_pattern',
    name: 'Performance Degradation Pattern',
    description: 'Detects patterns indicating system-wide performance issues',
    enabled: true,
    strategy: 'pattern-based',
    conditions: [
      { field: 'category', operator: 'in', value: ['performance', 'pathway'] },
      { field: 'severity', operator: 'in', value: ['warning', 'critical'] },
    ],
    timeWindowMinutes: 15,
    minAlertCount: 5,
    priority: 1,
    actions: [
      { type: 'group', config: { groupName: 'Performance Degradation' } },
      { type: 'notify', config: { channels: ['ops-team'] } },
    ],
  },
  {
    id: 'rule_security_burst',
    name: 'Security Alert Burst',
    description: 'Groups rapid security alerts indicating potential attack',
    enabled: true,
    strategy: 'time-based',
    conditions: [
      { field: 'category', operator: 'equals', value: 'security' },
    ],
    timeWindowMinutes: 2,
    minAlertCount: 10,
    priority: 0,
    actions: [
      { type: 'group', config: { groupName: 'Security Incident' } },
      { type: 'escalate', config: { level: 'emergency' } },
      { type: 'notify', config: { channels: ['security-team', 'jedi-council'] } },
    ],
  },
  {
    id: 'rule_integration_failure',
    name: 'Integration Failure Chain',
    description: 'Groups integration alerts that may indicate upstream failure',
    enabled: true,
    strategy: 'pattern-based',
    conditions: [
      { field: 'category', operator: 'equals', value: 'integration' },
    ],
    timeWindowMinutes: 5,
    minAlertCount: 3,
    priority: 2,
    actions: [
      { type: 'group', config: { groupName: 'Integration Chain Failure' } },
    ],
  },
];

// Root cause patterns for identification
const ROOT_CAUSE_PATTERNS = [
  {
    pattern: /database|db|sql|connection pool/i,
    cause: 'Database connectivity or performance issue',
    systems: ['database', 'api', 'backend'],
    actions: ['Check database server status', 'Review connection pool settings', 'Check for long-running queries'],
  },
  {
    pattern: /network|timeout|unreachable|dns/i,
    cause: 'Network connectivity issue',
    systems: ['network', 'firewall', 'dns'],
    actions: ['Check network connectivity', 'Verify DNS resolution', 'Review firewall rules'],
  },
  {
    pattern: /memory|heap|oom|out of memory/i,
    cause: 'Memory exhaustion',
    systems: ['application', 'server'],
    actions: ['Restart affected services', 'Increase memory allocation', 'Check for memory leaks'],
  },
  {
    pattern: /cpu|processor|high load/i,
    cause: 'CPU overload',
    systems: ['server', 'application'],
    actions: ['Identify high CPU processes', 'Scale horizontally', 'Optimize code paths'],
  },
  {
    pattern: /disk|storage|full|quota/i,
    cause: 'Storage capacity issue',
    systems: ['storage', 'filesystem'],
    actions: ['Clean up old files', 'Expand storage', 'Archive old data'],
  },
  {
    pattern: /auth|authentication|token|session/i,
    cause: 'Authentication service issue',
    systems: ['auth', 'identity', 'sso'],
    actions: ['Check auth service status', 'Verify token validity', 'Review session management'],
  },
  {
    pattern: /api|endpoint|rate limit|throttl/i,
    cause: 'API rate limiting or failure',
    systems: ['api', 'gateway'],
    actions: ['Check API quotas', 'Review rate limit settings', 'Contact API provider'],
  },
  {
    pattern: /cache|redis|memcache/i,
    cause: 'Cache service issue',
    systems: ['cache', 'redis'],
    actions: ['Check cache service status', 'Clear cache if corrupted', 'Review cache configuration'],
  },
];

class AlertCorrelationEngineService {
  private alerts: Map<string, CorrelatedAlert> = new Map();
  private groups: Map<string, AlertGroup> = new Map();
  private rules: Map<string, CorrelationRule> = new Map();
  private rootCauses: Map<string, RootCause> = new Map();
  private suppressedAlerts: Set<string> = new Set();
  private listeners: Set<(groups: AlertGroup[]) => void> = new Set();
  private processingQueue: CorrelatedAlert[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    DEFAULT_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Alert Ingestion
  ingestAlert(alert: Omit<CorrelatedAlert, 'id' | 'timestamp'>): CorrelatedAlert {
    const correlatedAlert: CorrelatedAlert = {
      id: this.generateId('alert'),
      ...alert,
      timestamp: new Date(),
    };

    this.alerts.set(correlatedAlert.id, correlatedAlert);
    this.processingQueue.push(correlatedAlert);
    
    if (!this.isProcessing) {
      this.processQueue();
    }

    return correlatedAlert;
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const alert = this.processingQueue.shift()!;
      await this.correlateAlert(alert);
    }

    this.isProcessing = false;
    this.notifyListeners();
  }

  private async correlateAlert(alert: CorrelatedAlert): Promise<void> {
    const matchingRules = this.findMatchingRules(alert);
    
    if (matchingRules.length === 0) {
      // Create single-alert group
      this.createGroup([alert], 'time-based');
      return;
    }

    // Sort by priority
    matchingRules.sort((a, b) => a.priority - b.priority);

    for (const rule of matchingRules) {
      const relatedAlerts = this.findRelatedAlerts(alert, rule);
      
      if (relatedAlerts.length >= rule.minAlertCount - 1) {
        // Found enough related alerts to form a group
        const allAlerts = [alert, ...relatedAlerts];
        const existingGroup = this.findExistingGroup(allAlerts);

        if (existingGroup) {
          this.addToGroup(existingGroup.id, alert);
        } else {
          const group = this.createGroup(allAlerts, rule.strategy, rule);
          this.executeActions(rule.actions, group);
        }

        // Identify root cause
        this.identifyRootCause(this.groups.get(alert.id) || this.findGroupContaining(alert.id)!);
        return;
      }
    }

    // No correlation found, create single-alert group
    this.createGroup([alert], 'time-based');
  }

  private findMatchingRules(alert: CorrelatedAlert): CorrelationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false;
      
      return rule.conditions.every(condition => {
        const value = this.getFieldValue(alert, condition.field);
        return this.evaluateCondition(value, condition);
      });
    });
  }

  private getFieldValue(alert: CorrelatedAlert, field: string): any {
    if (field in alert) {
      return (alert as any)[field];
    }
    return alert.metadata[field];
  }

  private evaluateCondition(value: any, condition: CorrelationCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      default:
        return false;
    }
  }

  private findRelatedAlerts(alert: CorrelatedAlert, rule: CorrelationRule): CorrelatedAlert[] {
    const timeWindow = rule.timeWindowMinutes * 60 * 1000;
    const alertTime = alert.timestamp.getTime();

    return Array.from(this.alerts.values()).filter(a => {
      if (a.id === alert.id) return false;
      if (this.suppressedAlerts.has(a.id)) return false;

      const timeDiff = Math.abs(a.timestamp.getTime() - alertTime);
      if (timeDiff > timeWindow) return false;

      // Check strategy-specific matching
      switch (rule.strategy) {
        case 'source-based':
          return a.source === alert.source;
        case 'pattern-based':
          return a.category === alert.category;
        case 'time-based':
        default:
          return true;
      }
    });
  }

  private findExistingGroup(alerts: CorrelatedAlert[]): AlertGroup | undefined {
    const alertIds = new Set(alerts.map(a => a.id));
    
    return Array.from(this.groups.values()).find(group => {
      if (group.status === 'resolved' || group.status === 'dismissed') return false;
      return group.alerts.some(a => alertIds.has(a.id));
    });
  }

  private findGroupContaining(alertId: string): AlertGroup | undefined {
    return Array.from(this.groups.values()).find(group => 
      group.alerts.some(a => a.id === alertId)
    );
  }

  // Group Management
  createGroup(alerts: CorrelatedAlert[], strategy: CorrelationStrategy, rule?: CorrelationRule): AlertGroup {
    const group: AlertGroup = {
      id: this.generateId('group'),
      name: rule?.name || `Alert Group (${alerts.length} alerts)`,
      alerts: [...alerts],
      correlationStrategy: strategy,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      priority: rule?.priority || 5,
      suppressedCount: 0,
    };

    this.groups.set(group.id, group);
    return group;
  }

  addToGroup(groupId: string, alert: CorrelatedAlert): AlertGroup | null {
    const group = this.groups.get(groupId);
    if (!group) return null;

    if (!group.alerts.find(a => a.id === alert.id)) {
      group.alerts.push(alert);
      group.updatedAt = new Date();
      group.suppressedCount++;
    }

    return group;
  }

  updateGroupStatus(groupId: string, status: AlertGroup['status']): AlertGroup | null {
    const group = this.groups.get(groupId);
    if (!group) return null;

    group.status = status;
    group.updatedAt = new Date();
    this.notifyListeners();

    return group;
  }

  getGroup(groupId: string): AlertGroup | undefined {
    return this.groups.get(groupId);
  }

  getAllGroups(): AlertGroup[] {
    return Array.from(this.groups.values());
  }

  getActiveGroups(): AlertGroup[] {
    return this.getAllGroups().filter(g => g.status === 'active' || g.status === 'investigating');
  }

  // Root Cause Identification
  private identifyRootCause(group: AlertGroup): void {
    const allMessages = group.alerts.map(a => a.message).join(' ');
    
    for (const pattern of ROOT_CAUSE_PATTERNS) {
      if (pattern.pattern.test(allMessages)) {
        const rootCause: RootCause = {
          id: this.generateId('cause'),
          description: pattern.cause,
          confidence: group.alerts.length >= 5 ? 'high' : group.alerts.length >= 3 ? 'medium' : 'low',
          affectedSystems: pattern.systems,
          suggestedActions: pattern.actions,
          relatedIncidents: [],
          identifiedAt: new Date(),
          identifiedBy: 'algorithm',
        };

        group.rootCause = rootCause;
        this.rootCauses.set(rootCause.id, rootCause);
        return;
      }
    }

    // ML-based fallback (simulated)
    if (group.alerts.length >= 3) {
      const rootCause: RootCause = {
        id: this.generateId('cause'),
        description: `Correlated issue affecting ${group.alerts[0].source}`,
        confidence: 'low',
        affectedSystems: [group.alerts[0].source],
        suggestedActions: ['Review system logs', 'Check recent changes', 'Monitor for recurrence'],
        relatedIncidents: [],
        identifiedAt: new Date(),
        identifiedBy: 'ml-model',
      };

      group.rootCause = rootCause;
      this.rootCauses.set(rootCause.id, rootCause);
    }
  }

  getRootCause(causeId: string): RootCause | undefined {
    return this.rootCauses.get(causeId);
  }

  getAllRootCauses(): RootCause[] {
    return Array.from(this.rootCauses.values());
  }

  // Rule Management
  addRule(rule: Omit<CorrelationRule, 'id'>): CorrelationRule {
    const newRule: CorrelationRule = {
      id: this.generateId('rule'),
      ...rule,
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<Omit<CorrelationRule, 'id'>>): CorrelationRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated = { ...rule, ...updates };
    this.rules.set(ruleId, updated);
    return updated;
  }

  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): CorrelationRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): CorrelationRule[] {
    return Array.from(this.rules.values());
  }

  toggleRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = !rule.enabled;
    return rule.enabled;
  }

  // Actions Execution
  private executeActions(actions: CorrelationAction[], group: AlertGroup): void {
    actions.forEach(action => {
      switch (action.type) {
        case 'suppress':
          group.alerts.forEach(a => this.suppressedAlerts.add(a.id));
          break;
        case 'escalate':
          group.priority = 0;
          break;
        case 'notify':
          // Notification would be sent here
          console.log(`Notification sent to: ${action.config.channels?.join(', ')}`);
          break;
        case 'auto_resolve':
          group.status = 'resolved';
          break;
      }
    });
  }

  // Noise Reduction
  suppressAlert(alertId: string): void {
    this.suppressedAlerts.add(alertId);
  }

  unsuppressAlert(alertId: string): void {
    this.suppressedAlerts.delete(alertId);
  }

  getNoiseReductionStats(): NoiseReductionStats {
    const totalAlerts = this.alerts.size;
    const groupedAlerts = Array.from(this.groups.values())
      .filter(g => g.alerts.length > 1)
      .reduce((sum, g) => sum + g.alerts.length, 0);
    const suppressedCount = this.suppressedAlerts.size;
    const uniqueGroups = this.groups.size;

    const noiseReduction = totalAlerts > 0 
      ? ((groupedAlerts + suppressedCount - uniqueGroups) / totalAlerts) * 100 
      : 0;

    const groupsWithMultiple = Array.from(this.groups.values()).filter(g => g.alerts.length > 1);
    const avgGroupSize = groupsWithMultiple.length > 0
      ? groupsWithMultiple.reduce((sum, g) => sum + g.alerts.length, 0) / groupsWithMultiple.length
      : 0;

    return {
      totalAlertsReceived: totalAlerts,
      alertsGrouped: groupedAlerts,
      alertsSuppressed: suppressedCount,
      uniqueGroups,
      noiseReductionPercentage: Math.round(noiseReduction * 100) / 100,
      avgGroupSize: Math.round(avgGroupSize * 100) / 100,
    };
  }

  // Analytics
  getAnalytics(): CorrelationAnalytics {
    const groups = this.getAllGroups();
    const alerts = Array.from(this.alerts.values());

    const alertsByCategory: Record<AlertCategory, number> = {
      pathway: 0, system: 0, security: 0, performance: 0, user: 0, integration: 0,
    };

    const alertsBySeverity: Record<string, number> = {
      info: 0, warning: 0, critical: 0, emergency: 0,
    };

    alerts.forEach(alert => {
      alertsByCategory[alert.category]++;
      alertsBySeverity[alert.severity]++;
    });

    const topRootCauses = Array.from(this.rootCauses.values())
      .sort((a, b) => {
        const confidenceOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
        return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      })
      .slice(0, 5);

    return {
      totalGroups: groups.length,
      activeGroups: groups.filter(g => g.status === 'active').length,
      resolvedGroups: groups.filter(g => g.status === 'resolved').length,
      totalAlerts: alerts.length,
      alertsByCategory,
      alertsBySeverity,
      topRootCauses,
      noiseReduction: this.getNoiseReductionStats(),
      correlationAccuracy: 85, // Simulated accuracy
      avgTimeToCorrelate: 250, // Simulated ms
    };
  }

  // Event Listeners
  subscribe(listener: (groups: AlertGroup[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const groups = this.getActiveGroups();
    this.listeners.forEach(listener => listener(groups));
  }

  // Reset
  reset(): void {
    this.alerts.clear();
    this.groups.clear();
    this.rootCauses.clear();
    this.suppressedAlerts.clear();
    this.processingQueue = [];
    this.notifyListeners();
  }
}

export const alertCorrelationEngineService = new AlertCorrelationEngineService();
