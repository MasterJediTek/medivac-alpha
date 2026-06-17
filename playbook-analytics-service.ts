/**
 * Playbook Analytics Service
 * Track execution metrics, response times, and success rates for incident playbooks
 * MediVac One v5.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  EXECUTIONS: 'medivac_playbook_executions',
  METRICS: 'medivac_playbook_metrics',
};

// Types
export type ThreatType = 
  | 'unauthorized_access'
  | 'data_breach'
  | 'malware_detected'
  | 'ddos_attack'
  | 'phishing_attempt'
  | 'insider_threat'
  | 'ransomware'
  | 'credential_compromise'
  | 'policy_violation'
  | 'system_intrusion'
  | 'data_exfiltration';

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'partial';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  playbookName: string;
  threatType: ThreatType;
  severity: Severity;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number; // in milliseconds
  actionsTotal: number;
  actionsCompleted: number;
  actionsFailed: number;
  triggeredBy: 'manual' | 'automated' | 'scheduled';
  incidentId?: string;
  notes?: string;
  errorMessage?: string;
}

export interface PlaybookMetrics {
  playbookId: string;
  playbookName: string;
  threatType: ThreatType;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageResponseTime: number; // in milliseconds
  minResponseTime: number;
  maxResponseTime: number;
  lastExecutedAt?: string;
  successRate: number;
}

export interface AnalyticsSummary {
  totalExecutions: number;
  successRate: number;
  averageResponseTime: number;
  executionsByThreatType: Record<ThreatType, number>;
  executionsBySeverity: Record<Severity, number>;
  executionsByStatus: Record<ExecutionStatus, number>;
  executionsByTrigger: Record<string, number>;
  trendsDaily: TrendDataPoint[];
  trendsWeekly: TrendDataPoint[];
  topPlaybooks: PlaybookMetrics[];
  recentExecutions: PlaybookExecution[];
}

export interface TrendDataPoint {
  date: string;
  executions: number;
  successRate: number;
  averageResponseTime: number;
}

export interface FilterOptions {
  threatType?: ThreatType;
  severity?: Severity;
  status?: ExecutionStatus;
  startDate?: string;
  endDate?: string;
  playbookId?: string;
}

// Threat type configuration
export const THREAT_TYPE_CONFIG: Record<ThreatType, { label: string; icon: string; color: string }> = {
  unauthorized_access: { label: 'Unauthorized Access', icon: '🚫', color: '#EF4444' },
  data_breach: { label: 'Data Breach', icon: '💾', color: '#DC2626' },
  malware_detected: { label: 'Malware Detected', icon: '🦠', color: '#7C3AED' },
  ddos_attack: { label: 'DDoS Attack', icon: '🌊', color: '#2563EB' },
  phishing_attempt: { label: 'Phishing Attempt', icon: '🎣', color: '#F59E0B' },
  insider_threat: { label: 'Insider Threat', icon: '👤', color: '#EC4899' },
  ransomware: { label: 'Ransomware', icon: '🔒', color: '#991B1B' },
  credential_compromise: { label: 'Credential Compromise', icon: '🔑', color: '#D97706' },
  policy_violation: { label: 'Policy Violation', icon: '📋', color: '#6366F1' },
  system_intrusion: { label: 'System Intrusion', icon: '🔓', color: '#B91C1C' },
  data_exfiltration: { label: 'Data Exfiltration', icon: '📤', color: '#059669' },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#DC2626' },
  high: { label: 'High', color: '#F59E0B' },
  medium: { label: 'Medium', color: '#3B82F6' },
  low: { label: 'Low', color: '#10B981' },
};

class PlaybookAnalyticsService {
  private executions: PlaybookExecution[] = [];
  private metricsCache: Map<string, PlaybookMetrics> = new Map();

  async initialize(): Promise<void> {
    await this.loadExecutions();
    this.recalculateMetrics();
    
    // Generate sample data if empty
    if (this.executions.length === 0) {
      await this.generateSampleData();
    }
  }

  private async loadExecutions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXECUTIONS);
      if (data) {
        this.executions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load playbook executions:', error);
    }
  }

  private async saveExecutions(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.EXECUTIONS, JSON.stringify(this.executions));
  }

  private recalculateMetrics(): void {
    this.metricsCache.clear();
    
    // Group executions by playbook
    const byPlaybook = new Map<string, PlaybookExecution[]>();
    for (const exec of this.executions) {
      const existing = byPlaybook.get(exec.playbookId) || [];
      existing.push(exec);
      byPlaybook.set(exec.playbookId, existing);
    }

    // Calculate metrics for each playbook
    for (const [playbookId, execs] of byPlaybook) {
      const successful = execs.filter(e => e.status === 'completed');
      const failed = execs.filter(e => e.status === 'failed');
      const withDuration = execs.filter(e => e.duration !== undefined);
      
      const metrics: PlaybookMetrics = {
        playbookId,
        playbookName: execs[0]?.playbookName || 'Unknown',
        threatType: execs[0]?.threatType || 'unauthorized_access',
        totalExecutions: execs.length,
        successfulExecutions: successful.length,
        failedExecutions: failed.length,
        averageResponseTime: withDuration.length > 0
          ? withDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / withDuration.length
          : 0,
        minResponseTime: withDuration.length > 0
          ? Math.min(...withDuration.map(e => e.duration || 0))
          : 0,
        maxResponseTime: withDuration.length > 0
          ? Math.max(...withDuration.map(e => e.duration || 0))
          : 0,
        lastExecutedAt: execs.sort((a, b) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )[0]?.startedAt,
        successRate: execs.length > 0 ? (successful.length / execs.length) * 100 : 0,
      };

      this.metricsCache.set(playbookId, metrics);
    }
  }

  /**
   * Record a new playbook execution
   */
  async recordExecution(execution: Omit<PlaybookExecution, 'id'>): Promise<PlaybookExecution> {
    const newExecution: PlaybookExecution = {
      ...execution,
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.executions.push(newExecution);
    await this.saveExecutions();
    this.recalculateMetrics();

    return newExecution;
  }

  /**
   * Update execution status
   */
  async updateExecution(id: string, updates: Partial<PlaybookExecution>): Promise<PlaybookExecution | null> {
    const index = this.executions.findIndex(e => e.id === id);
    if (index < 0) return null;

    this.executions[index] = { ...this.executions[index], ...updates };
    
    // Calculate duration if completed
    if (updates.completedAt && !updates.duration) {
      const start = new Date(this.executions[index].startedAt).getTime();
      const end = new Date(updates.completedAt).getTime();
      this.executions[index].duration = end - start;
    }

    await this.saveExecutions();
    this.recalculateMetrics();

    return this.executions[index];
  }

  /**
   * Get all executions with optional filtering
   */
  getExecutions(filters?: FilterOptions): PlaybookExecution[] {
    let result = [...this.executions];

    if (filters) {
      if (filters.threatType) {
        result = result.filter(e => e.threatType === filters.threatType);
      }
      if (filters.severity) {
        result = result.filter(e => e.severity === filters.severity);
      }
      if (filters.status) {
        result = result.filter(e => e.status === filters.status);
      }
      if (filters.playbookId) {
        result = result.filter(e => e.playbookId === filters.playbookId);
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        result = result.filter(e => new Date(e.startedAt).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        result = result.filter(e => new Date(e.startedAt).getTime() <= end);
      }
    }

    return result.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Get metrics for a specific playbook
   */
  getPlaybookMetrics(playbookId: string): PlaybookMetrics | null {
    return this.metricsCache.get(playbookId) || null;
  }

  /**
   * Get all playbook metrics
   */
  getAllMetrics(): PlaybookMetrics[] {
    return Array.from(this.metricsCache.values());
  }

  /**
   * Get comprehensive analytics summary
   */
  getAnalyticsSummary(filters?: FilterOptions): AnalyticsSummary {
    const executions = this.getExecutions(filters);
    const successful = executions.filter(e => e.status === 'completed');
    const withDuration = executions.filter(e => e.duration !== undefined);

    // Calculate by threat type
    const executionsByThreatType: Record<ThreatType, number> = {
      unauthorized_access: 0,
      data_breach: 0,
      malware_detected: 0,
      ddos_attack: 0,
      phishing_attempt: 0,
      insider_threat: 0,
      ransomware: 0,
      credential_compromise: 0,
      policy_violation: 0,
      system_intrusion: 0,
      data_exfiltration: 0,
    };
    executions.forEach(e => executionsByThreatType[e.threatType]++);

    // Calculate by severity
    const executionsBySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    executions.forEach(e => executionsBySeverity[e.severity]++);

    // Calculate by status
    const executionsByStatus: Record<ExecutionStatus, number> = {
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      partial: 0,
    };
    executions.forEach(e => executionsByStatus[e.status]++);

    // Calculate by trigger
    const executionsByTrigger: Record<string, number> = {
      manual: 0,
      automated: 0,
      scheduled: 0,
    };
    executions.forEach(e => executionsByTrigger[e.triggeredBy]++);

    // Calculate daily trends (last 7 days)
    const trendsDaily = this.calculateTrends(executions, 7, 'day');
    
    // Calculate weekly trends (last 4 weeks)
    const trendsWeekly = this.calculateTrends(executions, 4, 'week');

    // Get top playbooks by execution count
    const topPlaybooks = this.getAllMetrics()
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, 5);

    return {
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? (successful.length / executions.length) * 100 : 0,
      averageResponseTime: withDuration.length > 0
        ? withDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / withDuration.length
        : 0,
      executionsByThreatType,
      executionsBySeverity,
      executionsByStatus,
      executionsByTrigger,
      trendsDaily,
      trendsWeekly,
      topPlaybooks,
      recentExecutions: executions.slice(0, 10),
    };
  }

  private calculateTrends(executions: PlaybookExecution[], periods: number, unit: 'day' | 'week'): TrendDataPoint[] {
    const trends: TrendDataPoint[] = [];
    const now = new Date();
    const msPerUnit = unit === 'day' ? 86400000 : 604800000;

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now.getTime() - (i + 1) * msPerUnit);
      const periodEnd = new Date(now.getTime() - i * msPerUnit);
      
      const periodExecs = executions.filter(e => {
        const execTime = new Date(e.startedAt).getTime();
        return execTime >= periodStart.getTime() && execTime < periodEnd.getTime();
      });

      const successful = periodExecs.filter(e => e.status === 'completed');
      const withDuration = periodExecs.filter(e => e.duration !== undefined);

      trends.push({
        date: periodStart.toISOString().split('T')[0],
        executions: periodExecs.length,
        successRate: periodExecs.length > 0 ? (successful.length / periodExecs.length) * 100 : 0,
        averageResponseTime: withDuration.length > 0
          ? withDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / withDuration.length
          : 0,
      });
    }

    return trends;
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv'): string {
    const summary = this.getAnalyticsSummary();
    
    if (format === 'json') {
      return JSON.stringify(summary, null, 2);
    }

    // CSV format - executions list
    const headers = ['ID', 'Playbook', 'Threat Type', 'Severity', 'Status', 'Started At', 'Duration (ms)', 'Actions Completed', 'Triggered By'];
    const rows = this.executions.map(e => [
      e.id,
      e.playbookName,
      e.threatType,
      e.severity,
      e.status,
      e.startedAt,
      e.duration?.toString() || '',
      `${e.actionsCompleted}/${e.actionsTotal}`,
      e.triggeredBy,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Generate sample data for demonstration
   */
  private async generateSampleData(): Promise<void> {
    const threatTypes: ThreatType[] = [
      'unauthorized_access', 'data_breach', 'malware_detected', 'phishing_attempt',
      'policy_violation', 'credential_compromise', 'insider_threat',
    ];
    const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
    const statuses: ExecutionStatus[] = ['completed', 'completed', 'completed', 'failed', 'completed'];
    const triggers: ('manual' | 'automated' | 'scheduled')[] = ['automated', 'automated', 'manual', 'scheduled'];

    const now = Date.now();
    const dayMs = 86400000;

    for (let i = 0; i < 50; i++) {
      const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const trigger = triggers[Math.floor(Math.random() * triggers.length)];
      
      const startedAt = new Date(now - Math.floor(Math.random() * 30) * dayMs);
      const duration = 30000 + Math.floor(Math.random() * 270000); // 30s to 5min
      const actionsTotal = 3 + Math.floor(Math.random() * 7);
      const actionsCompleted = status === 'completed' ? actionsTotal : Math.floor(Math.random() * actionsTotal);

      await this.recordExecution({
        playbookId: `playbook_${threatType}`,
        playbookName: `${THREAT_TYPE_CONFIG[threatType].label} Response`,
        threatType,
        severity,
        status,
        startedAt: startedAt.toISOString(),
        completedAt: new Date(startedAt.getTime() + duration).toISOString(),
        duration,
        actionsTotal,
        actionsCompleted,
        actionsFailed: status === 'failed' ? actionsTotal - actionsCompleted : 0,
        triggeredBy: trigger,
      });
    }
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    this.executions = [];
    this.metricsCache.clear();
    await AsyncStorage.removeItem(STORAGE_KEYS.EXECUTIONS);
  }
}

export const playbookAnalyticsService = new PlaybookAnalyticsService();
