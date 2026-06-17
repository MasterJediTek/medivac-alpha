/**
 * MediVac One - JediTek Agent Service
 * AI Agent with authentication and automation capabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type AgentRole = 
  | 'commander' | 'sentinel' | 'medic' | 'analyst' | 'guardian'
  | 'navigator' | 'archivist' | 'dispatcher' | 'enforcer' | 'oracle';

export type AgentStatus = 'active' | 'standby' | 'busy' | 'offline' | 'error';

export type CommandPriority = 'critical' | 'high' | 'normal' | 'low';

export type TaskType = 
  | 'authentication' | 'data_sync' | 'monitoring' | 'notification'
  | 'report_generation' | 'compliance_check' | 'backup' | 'maintenance'
  | 'user_assist' | 'security_scan';

export interface JediTekAgentConfig {
  agentId: string;
  agentName: string;
  role: AgentRole;
  apiEndpoint: string;
  apiKey?: string;
  authToken?: string;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  autoStart: boolean;
  heartbeatInterval: number;
  maxConcurrentTasks: number;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiredPermissions: string[];
}

export interface AgentPermission {
  id: string;
  resource: string;
  actions: ('read' | 'write' | 'execute' | 'delete')[];
  granted: boolean;
  grantedBy?: string;
  grantedAt?: string;
}

export interface AgentCommand {
  id: string;
  type: string;
  action: string;
  parameters: Record<string, unknown>;
  priority: CommandPriority;
  source: 'user' | 'system' | 'schedule' | 'event';
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result?: unknown;
  error?: string;
}

export interface AgentTask {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  schedule?: {
    type: 'once' | 'recurring';
    cron?: string;
    nextRun?: string;
  };
  parameters: Record<string, unknown>;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

export interface AgentEvent {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AgentHealth {
  status: AgentStatus;
  uptime: number;
  lastHeartbeat: string;
  cpuUsage: number;
  memoryUsage: number;
  activeTasks: number;
  pendingCommands: number;
  errorCount: number;
  warningCount: number;
}

export interface AgentMetrics {
  commandsExecuted: number;
  tasksCompleted: number;
  eventsProcessed: number;
  authenticationAttempts: number;
  successfulAuths: number;
  failedAuths: number;
  averageResponseTime: number;
  uptime: number;
  lastReset: string;
}

export interface AgentNotification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    command: string;
  };
  timestamp: string;
  read: boolean;
  dismissed: boolean;
}

// ==========================================
// Constants
// ==========================================

const STORAGE_KEYS = {
  CONFIG: 'jeditek_agent_config',
  COMMANDS: 'jeditek_agent_commands',
  TASKS: 'jeditek_agent_tasks',
  EVENTS: 'jeditek_agent_events',
  METRICS: 'jeditek_agent_metrics',
  NOTIFICATIONS: 'jeditek_agent_notifications',
};

const DEFAULT_CAPABILITIES: AgentCapability[] = [
  { id: 'auth_management', name: 'Authentication Management', description: 'Manage user authentication and SSO', enabled: true, requiredPermissions: ['auth:read', 'auth:write'] },
  { id: 'data_sync', name: 'Data Synchronization', description: 'Sync data across systems', enabled: true, requiredPermissions: ['data:read', 'data:write'] },
  { id: 'monitoring', name: 'System Monitoring', description: 'Monitor system health and performance', enabled: true, requiredPermissions: ['system:read'] },
  { id: 'notifications', name: 'Notification Delivery', description: 'Send notifications to users', enabled: true, requiredPermissions: ['notification:write'] },
  { id: 'reporting', name: 'Report Generation', description: 'Generate compliance and analytics reports', enabled: true, requiredPermissions: ['report:read', 'report:write'] },
  { id: 'compliance', name: 'Compliance Checking', description: 'Verify regulatory compliance', enabled: true, requiredPermissions: ['compliance:read'] },
  { id: 'backup', name: 'Data Backup', description: 'Backup critical data', enabled: true, requiredPermissions: ['backup:execute'] },
  { id: 'security', name: 'Security Scanning', description: 'Scan for security vulnerabilities', enabled: true, requiredPermissions: ['security:read', 'security:execute'] },
];

const AGENT_ROLES: Record<AgentRole, { name: string; description: string; color: string }> = {
  commander: { name: 'JEDI Commander', description: 'Supreme control and coordination', color: '#FFD700' },
  sentinel: { name: 'JEDI Sentinel', description: 'Security and access control', color: '#DC143C' },
  medic: { name: 'JEDI Medic', description: 'Healthcare data management', color: '#32CD32' },
  analyst: { name: 'JEDI Analyst', description: 'Data analysis and insights', color: '#4169E1' },
  guardian: { name: 'JEDI Guardian', description: 'System protection and backup', color: '#8B4513' },
  navigator: { name: 'JEDI Navigator', description: 'Workflow guidance and routing', color: '#20B2AA' },
  archivist: { name: 'JEDI Archivist', description: 'Record keeping and documentation', color: '#9370DB' },
  dispatcher: { name: 'JEDI Dispatcher', description: 'Task distribution and scheduling', color: '#FF6347' },
  enforcer: { name: 'JEDI Enforcer', description: 'Policy enforcement and compliance', color: '#2F4F4F' },
  oracle: { name: 'JEDI Oracle', description: 'Predictive analytics and forecasting', color: '#9932CC' },
};

// ==========================================
// JediTek Agent Service
// ==========================================

class JediTekAgentService {
  private config: JediTekAgentConfig;
  private commands: AgentCommand[] = [];
  private tasks: AgentTask[] = [];
  private events: AgentEvent[] = [];
  private notifications: AgentNotification[] = [];
  private metrics: AgentMetrics;
  private health: AgentHealth;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
    this.health = this.getDefaultHealth();
    this.initializeService();
  }

  private getDefaultConfig(): JediTekAgentConfig {
    return {
      agentId: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentName: 'JEDI Agent Alpha',
      role: 'commander',
      apiEndpoint: 'https://api.jeditek.com.au/agent',
      capabilities: [...DEFAULT_CAPABILITIES],
      permissions: [],
      autoStart: true,
      heartbeatInterval: 30000,
      maxConcurrentTasks: 5,
      isConfigured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getDefaultMetrics(): AgentMetrics {
    return {
      commandsExecuted: 0,
      tasksCompleted: 0,
      eventsProcessed: 0,
      authenticationAttempts: 0,
      successfulAuths: 0,
      failedAuths: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastReset: new Date().toISOString(),
    };
  }

  private getDefaultHealth(): AgentHealth {
    return {
      status: 'standby',
      uptime: 0,
      lastHeartbeat: new Date().toISOString(),
      cpuUsage: 0,
      memoryUsage: 0,
      activeTasks: 0,
      pendingCommands: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadCommands();
      await this.loadTasks();
      await this.loadEvents();
      await this.loadMetrics();
      await this.loadNotifications();

      if (this.config.autoStart && this.config.isConfigured) {
        await this.start();
      }
    } catch (error) {
      console.error('Failed to initialize JediTek Agent Service:', error);
    }
  }

  // ==========================================
  // Agent Lifecycle
  // ==========================================

  async start(): Promise<void> {
    if (this.health.status === 'active') {
      return;
    }

    this.health.status = 'active';
    this.health.lastHeartbeat = new Date().toISOString();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process pending commands
    await this.processPendingCommands();
    
    this.emit('agent_started', { agentId: this.config.agentId });
    await this.logEvent('info', 'agent', 'Agent started successfully');
  }

  async stop(): Promise<void> {
    this.health.status = 'standby';
    this.stopHeartbeat();
    
    this.emit('agent_stopped', { agentId: this.config.agentId });
    await this.logEvent('info', 'agent', 'Agent stopped');
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    this.health.lastHeartbeat = new Date().toISOString();
    this.health.uptime += this.config.heartbeatInterval / 1000;
    this.metrics.uptime = this.health.uptime;
    
    // Simulate resource usage
    this.health.cpuUsage = Math.random() * 30;
    this.health.memoryUsage = 40 + Math.random() * 20;
    this.health.activeTasks = this.tasks.filter(t => t.status === 'running').length;
    this.health.pendingCommands = this.commands.filter(c => c.status === 'pending').length;

    this.emit('heartbeat', this.health);
  }

  // ==========================================
  // Configuration
  // ==========================================

  async configure(config: Partial<JediTekAgentConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
      isConfigured: !!(config.apiKey || config.authToken || this.config.apiKey || this.config.authToken),
      updatedAt: new Date().toISOString(),
    };
    await this.saveConfig();
    this.emit('config_updated', this.config);
  }

  getConfig(): JediTekAgentConfig {
    return { ...this.config };
  }

  getHealth(): AgentHealth {
    return { ...this.health };
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  getRoleInfo(role?: AgentRole): { name: string; description: string; color: string } {
    return AGENT_ROLES[role || this.config.role];
  }

  getAllRoles(): Record<AgentRole, { name: string; description: string; color: string }> {
    return { ...AGENT_ROLES };
  }

  // ==========================================
  // Command Processing
  // ==========================================

  async executeCommand(command: Omit<AgentCommand, 'id' | 'createdAt' | 'status'>): Promise<AgentCommand> {
    const fullCommand: AgentCommand = {
      ...command,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.commands.push(fullCommand);
    await this.saveCommands();

    if (this.health.status === 'active') {
      await this.processCommand(fullCommand);
    }

    return fullCommand;
  }

  private async processCommand(command: AgentCommand): Promise<void> {
    command.status = 'executing';
    command.executedAt = new Date().toISOString();
    this.emit('command_executing', command);

    try {
      const startTime = Date.now();
      
      // Execute based on command type
      const result = await this.executeCommandAction(command);
      
      command.status = 'completed';
      command.completedAt = new Date().toISOString();
      command.result = result;
      
      // Update metrics
      this.metrics.commandsExecuted++;
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.commandsExecuted - 1) + responseTime) / 
        this.metrics.commandsExecuted;

      this.emit('command_completed', command);
      await this.logEvent('info', 'command', `Command ${command.type}:${command.action} completed`);
    } catch (error) {
      command.status = 'failed';
      command.error = error instanceof Error ? error.message : 'Unknown error';
      this.health.errorCount++;
      
      this.emit('command_failed', command);
      await this.logEvent('error', 'command', `Command ${command.type}:${command.action} failed: ${command.error}`);
    }

    await this.saveCommands();
  }

  private async executeCommandAction(command: AgentCommand): Promise<unknown> {
    switch (command.type) {
      case 'auth':
        return this.handleAuthCommand(command);
      case 'sync':
        return this.handleSyncCommand(command);
      case 'monitor':
        return this.handleMonitorCommand(command);
      case 'notify':
        return this.handleNotifyCommand(command);
      case 'report':
        return this.handleReportCommand(command);
      default:
        return { success: true, message: `Command ${command.type}:${command.action} executed` };
    }
  }

  private async handleAuthCommand(command: AgentCommand): Promise<unknown> {
    this.metrics.authenticationAttempts++;
    
    switch (command.action) {
      case 'validate_session':
        this.metrics.successfulAuths++;
        return { valid: true, expiresIn: 3600 };
      case 'refresh_token':
        this.metrics.successfulAuths++;
        return { refreshed: true, newToken: 'new_token_' + Date.now() };
      case 'revoke_access':
        return { revoked: true };
      default:
        return { success: true };
    }
  }

  private async handleSyncCommand(command: AgentCommand): Promise<unknown> {
    const { target, direction } = command.parameters as { target?: string; direction?: string };
    
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      synced: true,
      target: target || 'all',
      direction: direction || 'bidirectional',
      recordsProcessed: Math.floor(Math.random() * 100) + 10,
    };
  }

  private async handleMonitorCommand(command: AgentCommand): Promise<unknown> {
    return {
      health: this.health,
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleNotifyCommand(command: AgentCommand): Promise<unknown> {
    const { title, message, type } = command.parameters as { title?: string; message?: string; type?: string };
    
    const notification: AgentNotification = {
      id: `notif_${Date.now()}`,
      type: (type as AgentNotification['type']) || 'info',
      title: title || 'Agent Notification',
      message: message || 'No message provided',
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
    };

    this.notifications.push(notification);
    await this.saveNotifications();
    this.emit('notification', notification);

    return { sent: true, notificationId: notification.id };
  }

  private async handleReportCommand(command: AgentCommand): Promise<unknown> {
    const { reportType } = command.parameters as { reportType?: string };
    
    return {
      generated: true,
      reportType: reportType || 'summary',
      data: {
        metrics: this.metrics,
        health: this.health,
        commandCount: this.commands.length,
        taskCount: this.tasks.length,
        eventCount: this.events.length,
      },
    };
  }

  private async processPendingCommands(): Promise<void> {
    const pending = this.commands.filter(c => c.status === 'pending');
    
    // Sort by priority
    const priorityOrder: Record<CommandPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    pending.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    for (const command of pending) {
      if (this.health.status !== 'active') break;
      await this.processCommand(command);
    }
  }

  getCommands(options?: { status?: string; limit?: number }): AgentCommand[] {
    let filtered = [...this.commands];
    
    if (options?.status) {
      filtered = filtered.filter(c => c.status === options.status);
    }
    
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  // ==========================================
  // Task Management
  // ==========================================

  async createTask(task: Omit<AgentTask, 'id' | 'status' | 'progress'>): Promise<AgentTask> {
    const fullTask: AgentTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'scheduled',
      progress: 0,
    };

    this.tasks.push(fullTask);
    await this.saveTasks();
    this.emit('task_created', fullTask);

    return fullTask;
  }

  async runTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'running') {
      throw new Error('Task is already running');
    }

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    task.progress = 0;
    await this.saveTasks();
    this.emit('task_started', task);

    try {
      // Simulate task execution with progress updates
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        task.progress = i * 10;
        this.emit('task_progress', { taskId, progress: task.progress });
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = { success: true };
      this.metrics.tasksCompleted++;
      
      this.emit('task_completed', task);
      await this.logEvent('info', 'task', `Task ${task.name} completed`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.health.errorCount++;
      
      this.emit('task_failed', task);
      await this.logEvent('error', 'task', `Task ${task.name} failed: ${task.error}`);
    }

    await this.saveTasks();
  }

  async pauseTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'running') {
      task.status = 'paused';
      await this.saveTasks();
      this.emit('task_paused', task);
    }
  }

  getTasks(options?: { status?: string; type?: TaskType }): AgentTask[] {
    let filtered = [...this.tasks];
    
    if (options?.status) {
      filtered = filtered.filter(t => t.status === options.status);
    }
    if (options?.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }
    
    return filtered;
  }

  // ==========================================
  // Event Logging
  // ==========================================

  private async logEvent(
    severity: AgentEvent['severity'],
    source: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const event: AgentEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: `agent_${source}`,
      severity,
      source,
      message,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.events.push(event);
    this.metrics.eventsProcessed++;

    if (severity === 'warning') {
      this.health.warningCount++;
    } else if (severity === 'error' || severity === 'critical') {
      this.health.errorCount++;
    }

    await this.saveEvents();
    this.emit('event', event);
  }

  async acknowledgeEvent(eventId: string, acknowledgedBy: string): Promise<void> {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
      event.acknowledgedBy = acknowledgedBy;
      event.acknowledgedAt = new Date().toISOString();
      await this.saveEvents();
      this.emit('event_acknowledged', event);
    }
  }

  getEvents(options?: { severity?: string; acknowledged?: boolean; limit?: number }): AgentEvent[] {
    let filtered = [...this.events];
    
    if (options?.severity) {
      filtered = filtered.filter(e => e.severity === options.severity);
    }
    if (options?.acknowledged !== undefined) {
      filtered = filtered.filter(e => e.acknowledged === options.acknowledged);
    }
    
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  // ==========================================
  // Notifications
  // ==========================================

  getNotifications(options?: { unread?: boolean; limit?: number }): AgentNotification[] {
    let filtered = [...this.notifications];
    
    if (options?.unread) {
      filtered = filtered.filter(n => !n.read && !n.dismissed);
    }
    
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
    }
  }

  async dismissNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      await this.saveNotifications();
    }
  }

  // ==========================================
  // Storage
  // ==========================================

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load JediTek Agent config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save JediTek Agent config:', error);
    }
  }

  private async loadCommands(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMANDS);
      if (stored) {
        this.commands = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load commands:', error);
    }
  }

  private async saveCommands(): Promise<void> {
    try {
      // Keep only last 100 commands
      const toSave = this.commands.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.COMMANDS, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save commands:', error);
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        this.tasks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  private async saveTasks(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      // Keep only last 500 events
      const toSave = this.events.slice(-500);
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.METRICS);
      if (stored) {
        this.metrics = { ...this.getDefaultMetrics(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      // Keep only last 50 notifications
      const toSave = this.notifications.slice(-50);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // ==========================================
  // Event System
  // ==========================================

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }
}

// ==========================================
// Export Singleton
// ==========================================

export const jediTekAgent = new JediTekAgentService();

export default JediTekAgentService;
