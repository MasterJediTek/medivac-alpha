/**
 * Emergency Alert Broadcasting Service
 * Facility-wide emergency notifications with role-based escalation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Alert severity levels
export type AlertSeverity = 
  | 'info'
  | 'warning'
  | 'urgent'
  | 'critical'
  | 'emergency';

// Emergency code types
export type EmergencyCode = 
  | 'code_blue'      // Cardiac/respiratory arrest
  | 'code_red'       // Fire
  | 'code_orange'    // Hazardous material
  | 'code_yellow'    // Missing patient
  | 'code_green'     // Evacuation
  | 'code_pink'      // Infant abduction
  | 'code_silver'    // Active threat
  | 'code_black'     // Bomb threat
  | 'code_white'     // Violent patient
  | 'code_gray'      // Security emergency
  | 'rapid_response' // Rapid response team
  | 'custom';        // Custom alert

// Alert status
export type AlertStatus = 
  | 'active'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

// Staff role for targeting
export type StaffRole = 
  | 'all'
  | 'physician'
  | 'nurse'
  | 'security'
  | 'admin'
  | 'respiratory'
  | 'pharmacy'
  | 'lab'
  | 'radiology'
  | 'housekeeping'
  | 'maintenance';

// Location
export interface Location {
  building: string;
  floor: string;
  unit: string;
  room?: string;
  description?: string;
}

// Emergency alert
export interface EmergencyAlert {
  id: string;
  code: EmergencyCode;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: Location;
  targetRoles: StaffRole[];
  initiatedBy: string;
  initiatedAt: number;
  status: AlertStatus;
  acknowledgments: AlertAcknowledgment[];
  responses: AlertResponse[];
  escalations: AlertEscalation[];
  instructions: string[];
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNotes?: string;
  priority: number; // 1-5, 5 being highest
}

// Alert acknowledgment
export interface AlertAcknowledgment {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  acknowledgedAt: number;
  location?: string;
  eta?: number; // Estimated time of arrival in minutes
  notes?: string;
}

// Alert response
export interface AlertResponse {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  action: string;
  timestamp: number;
  notes?: string;
}

// Alert escalation
export interface AlertEscalation {
  id: string;
  level: number;
  escalatedTo: StaffRole[];
  escalatedAt: number;
  reason: string;
  escalatedBy: string;
}

// Alert template
export interface AlertTemplate {
  code: EmergencyCode;
  title: string;
  description: string;
  severity: AlertSeverity;
  defaultTargetRoles: StaffRole[];
  instructions: string[];
  escalationProtocol: EscalationProtocol;
  priority: number;
  color: string;
  icon: string;
}

// Escalation protocol
export interface EscalationProtocol {
  levels: EscalationLevel[];
  autoEscalateAfter: number; // Minutes
}

// Escalation level
export interface EscalationLevel {
  level: number;
  roles: StaffRole[];
  notifyAfter: number; // Minutes after alert initiation
  description: string;
}

// Alert statistics
export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  averageResponseTime: number; // Minutes
  acknowledgmentRate: number; // Percentage
  alertsByCode: Record<EmergencyCode, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
}

// Alert history entry
export interface AlertHistoryEntry {
  id: string;
  alertId: string;
  action: string;
  performedBy: string;
  timestamp: number;
  details?: string;
}

class EmergencyAlertService {
  private alerts: Map<string, EmergencyAlert> = new Map();
  private templates: Map<EmergencyCode, AlertTemplate> = new Map();
  private history: AlertHistoryEntry[] = [];
  private listeners: Set<(alert: EmergencyAlert) => void> = new Set();
  private escalationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.initializeTemplates();
    this.loadState();
  }

  // Initialize alert templates
  private initializeTemplates(): void {
    const templates: AlertTemplate[] = [
      {
        code: 'code_blue',
        title: 'Code Blue - Cardiac Arrest',
        description: 'Patient in cardiac or respiratory arrest requiring immediate resuscitation',
        severity: 'emergency',
        defaultTargetRoles: ['physician', 'nurse', 'respiratory'],
        instructions: [
          'Call for help and activate code team',
          'Begin CPR immediately',
          'Retrieve crash cart and AED',
          'Prepare for advanced airway management',
          'Document time of arrest and interventions',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['physician', 'nurse', 'respiratory'], notifyAfter: 0, description: 'Initial response team' },
            { level: 2, roles: ['admin'], notifyAfter: 5, description: 'Notify administration' },
            { level: 3, roles: ['all'], notifyAfter: 10, description: 'Facility-wide notification' },
          ],
          autoEscalateAfter: 5,
        },
        priority: 5,
        color: '#3B82F6',
        icon: '💙',
      },
      {
        code: 'code_red',
        title: 'Code Red - Fire',
        description: 'Fire or smoke detected in the facility',
        severity: 'emergency',
        defaultTargetRoles: ['all', 'security', 'maintenance'],
        instructions: [
          'RACE: Rescue, Alarm, Contain, Extinguish/Evacuate',
          'Pull nearest fire alarm',
          'Close doors to contain fire',
          'Do not use elevators',
          'Follow evacuation routes',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['security', 'maintenance'], notifyAfter: 0, description: 'Security and maintenance response' },
            { level: 2, roles: ['all'], notifyAfter: 2, description: 'All staff notification' },
          ],
          autoEscalateAfter: 2,
        },
        priority: 5,
        color: '#EF4444',
        icon: '🔥',
      },
      {
        code: 'code_yellow',
        title: 'Code Yellow - Missing Patient',
        description: 'Patient is missing from their assigned area',
        severity: 'urgent',
        defaultTargetRoles: ['nurse', 'security'],
        instructions: [
          'Search immediate area thoroughly',
          'Check bathrooms and common areas',
          'Notify security immediately',
          'Provide patient description',
          'Check exits and parking areas',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['nurse', 'security'], notifyAfter: 0, description: 'Unit and security search' },
            { level: 2, roles: ['all'], notifyAfter: 15, description: 'Facility-wide search' },
            { level: 3, roles: ['admin'], notifyAfter: 30, description: 'External notification' },
          ],
          autoEscalateAfter: 15,
        },
        priority: 4,
        color: '#F59E0B',
        icon: '🔍',
      },
      {
        code: 'code_green',
        title: 'Code Green - Evacuation',
        description: 'Facility evacuation required',
        severity: 'emergency',
        defaultTargetRoles: ['all'],
        instructions: [
          'Follow evacuation plan for your area',
          'Assist patients and visitors',
          'Use stairs, not elevators',
          'Report to designated assembly area',
          'Account for all patients and staff',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['all'], notifyAfter: 0, description: 'All staff evacuation' },
          ],
          autoEscalateAfter: 0,
        },
        priority: 5,
        color: '#22C55E',
        icon: '🚪',
      },
      {
        code: 'code_silver',
        title: 'Code Silver - Active Threat',
        description: 'Active shooter or armed intruder in facility',
        severity: 'emergency',
        defaultTargetRoles: ['all', 'security'],
        instructions: [
          'RUN: Evacuate if safe path exists',
          'HIDE: Secure in place if cannot evacuate',
          'FIGHT: Last resort only',
          'Call 911 when safe',
          'Do not approach the threat',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['all', 'security'], notifyAfter: 0, description: 'Immediate lockdown' },
          ],
          autoEscalateAfter: 0,
        },
        priority: 5,
        color: '#6B7280',
        icon: '🔒',
      },
      {
        code: 'code_white',
        title: 'Code White - Violent Patient',
        description: 'Combative or violent patient requiring intervention',
        severity: 'urgent',
        defaultTargetRoles: ['security', 'nurse'],
        instructions: [
          'Maintain safe distance',
          'Clear area of other patients/visitors',
          'Use de-escalation techniques',
          'Wait for security assistance',
          'Document incident thoroughly',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['security', 'nurse'], notifyAfter: 0, description: 'Security response' },
            { level: 2, roles: ['physician'], notifyAfter: 5, description: 'Medical assessment' },
          ],
          autoEscalateAfter: 5,
        },
        priority: 4,
        color: '#FFFFFF',
        icon: '⚠️',
      },
      {
        code: 'rapid_response',
        title: 'Rapid Response Team',
        description: 'Patient condition deteriorating - requires immediate assessment',
        severity: 'critical',
        defaultTargetRoles: ['physician', 'nurse', 'respiratory'],
        instructions: [
          'Assess patient immediately',
          'Check vital signs and oxygen saturation',
          'Review recent medications and labs',
          'Prepare for possible escalation to ICU',
          'Document assessment and interventions',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['physician', 'nurse', 'respiratory'], notifyAfter: 0, description: 'RRT response' },
            { level: 2, roles: ['admin'], notifyAfter: 15, description: 'ICU notification' },
          ],
          autoEscalateAfter: 10,
        },
        priority: 4,
        color: '#8B5CF6',
        icon: '🏃',
      },
      {
        code: 'code_pink',
        title: 'Code Pink - Infant Abduction',
        description: 'Infant or child missing or abducted',
        severity: 'emergency',
        defaultTargetRoles: ['all', 'security'],
        instructions: [
          'Secure all exits immediately',
          'Check all persons leaving with infants',
          'Notify law enforcement immediately',
          'Provide description of infant and suspect',
          'Review security footage',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['all', 'security'], notifyAfter: 0, description: 'Immediate lockdown' },
          ],
          autoEscalateAfter: 0,
        },
        priority: 5,
        color: '#EC4899',
        icon: '👶',
      },
      {
        code: 'code_orange',
        title: 'Code Orange - Hazmat',
        description: 'Hazardous material spill or exposure',
        severity: 'emergency',
        defaultTargetRoles: ['security', 'maintenance', 'nurse'],
        instructions: [
          'Evacuate immediate area',
          'Do not touch or attempt to clean',
          'Isolate affected area',
          'Identify material if possible',
          'Decontaminate exposed individuals',
        ],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['security', 'maintenance'], notifyAfter: 0, description: 'Initial response' },
            { level: 2, roles: ['all'], notifyAfter: 5, description: 'Area evacuation' },
          ],
          autoEscalateAfter: 5,
        },
        priority: 5,
        color: '#F97316',
        icon: '☣️',
      },
      {
        code: 'custom',
        title: 'Custom Alert',
        description: 'Custom emergency notification',
        severity: 'warning',
        defaultTargetRoles: ['all'],
        instructions: [],
        escalationProtocol: {
          levels: [
            { level: 1, roles: ['all'], notifyAfter: 0, description: 'Initial notification' },
          ],
          autoEscalateAfter: 30,
        },
        priority: 3,
        color: '#6B7280',
        icon: '📢',
      },
    ];

    templates.forEach(template => this.templates.set(template.code, template));
  }

  // Get all templates
  getTemplates(): AlertTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get template by code
  getTemplate(code: EmergencyCode): AlertTemplate | undefined {
    return this.templates.get(code);
  }

  // Initiate emergency alert
  async initiateAlert(
    code: EmergencyCode,
    location: Location,
    initiatedBy: string,
    customTitle?: string,
    customDescription?: string,
    additionalInstructions?: string[]
  ): Promise<EmergencyAlert> {
    const template = this.templates.get(code);
    if (!template) {
      throw new Error('Alert template not found');
    }

    const alert: EmergencyAlert = {
      id: `ALERT-${Date.now()}`,
      code,
      severity: template.severity,
      title: customTitle || template.title,
      description: customDescription || template.description,
      location,
      targetRoles: [...template.defaultTargetRoles],
      initiatedBy,
      initiatedAt: Date.now(),
      status: 'active',
      acknowledgments: [],
      responses: [],
      escalations: [],
      instructions: [...template.instructions, ...(additionalInstructions || [])],
      priority: template.priority,
    };

    this.alerts.set(alert.id, alert);
    this.addHistoryEntry(alert.id, 'Alert initiated', initiatedBy);
    
    // Set up auto-escalation
    this.setupEscalation(alert);
    
    await this.saveState();
    this.notifyListeners(alert);

    return alert;
  }

  // Acknowledge alert
  async acknowledgeAlert(
    alertId: string,
    staffId: string,
    staffName: string,
    role: StaffRole,
    eta?: number,
    notes?: string
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    const acknowledgment: AlertAcknowledgment = {
      id: `ACK-${Date.now()}`,
      staffId,
      staffName,
      role,
      acknowledgedAt: Date.now(),
      eta,
      notes,
    };

    alert.acknowledgments.push(acknowledgment);
    
    if (alert.status === 'active') {
      alert.status = 'acknowledged';
    }

    this.addHistoryEntry(alertId, 'Alert acknowledged', staffName, `ETA: ${eta || 'N/A'} minutes`);
    await this.saveState();
    this.notifyListeners(alert);
  }

  // Add response to alert
  async addResponse(
    alertId: string,
    staffId: string,
    staffName: string,
    role: StaffRole,
    action: string,
    notes?: string
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    const response: AlertResponse = {
      id: `RESP-${Date.now()}`,
      staffId,
      staffName,
      role,
      action,
      timestamp: Date.now(),
      notes,
    };

    alert.responses.push(response);
    
    if (alert.status === 'acknowledged') {
      alert.status = 'in_progress';
    }

    this.addHistoryEntry(alertId, action, staffName, notes);
    await this.saveState();
    this.notifyListeners(alert);
  }

  // Escalate alert
  async escalateAlert(
    alertId: string,
    escalatedBy: string,
    reason: string,
    additionalRoles?: StaffRole[]
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    const template = this.templates.get(alert.code);
    const currentLevel = alert.escalations.length;
    const nextLevel = currentLevel + 1;

    let newRoles: StaffRole[] = [];
    
    if (additionalRoles) {
      newRoles = additionalRoles;
    } else if (template && template.escalationProtocol.levels[nextLevel - 1]) {
      newRoles = template.escalationProtocol.levels[nextLevel - 1].roles;
    } else {
      newRoles = ['all'];
    }

    const escalation: AlertEscalation = {
      id: `ESC-${Date.now()}`,
      level: nextLevel,
      escalatedTo: newRoles,
      escalatedAt: Date.now(),
      reason,
      escalatedBy,
    };

    alert.escalations.push(escalation);
    alert.targetRoles = [...new Set([...alert.targetRoles, ...newRoles])];

    this.addHistoryEntry(alertId, `Escalated to level ${nextLevel}`, escalatedBy, reason);
    await this.saveState();
    this.notifyListeners(alert);
  }

  // Resolve alert
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = resolutionNotes;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    this.addHistoryEntry(alertId, 'Alert resolved', resolvedBy, resolutionNotes);
    await this.saveState();
    this.notifyListeners(alert);
  }

  // Cancel alert
  async cancelAlert(
    alertId: string,
    cancelledBy: string,
    reason: string
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'cancelled';
    alert.resolvedAt = Date.now();
    alert.resolvedBy = cancelledBy;
    alert.resolutionNotes = `Cancelled: ${reason}`;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    this.addHistoryEntry(alertId, 'Alert cancelled', cancelledBy, reason);
    await this.saveState();
    this.notifyListeners(alert);
  }

  // Setup auto-escalation
  private setupEscalation(alert: EmergencyAlert): void {
    const template = this.templates.get(alert.code);
    if (!template || !template.escalationProtocol.autoEscalateAfter) return;

    const timer = setTimeout(async () => {
      const currentAlert = this.alerts.get(alert.id);
      if (currentAlert && currentAlert.status === 'active' && currentAlert.acknowledgments.length === 0) {
        await this.escalateAlert(alert.id, 'System', 'Auto-escalation due to no response');
      }
    }, template.escalationProtocol.autoEscalateAfter * 60 * 1000);

    this.escalationTimers.set(alert.id, timer);
  }

  // Get alert by ID
  getAlert(alertId: string): EmergencyAlert | undefined {
    return this.alerts.get(alertId);
  }

  // Get all alerts
  getAllAlerts(): EmergencyAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.initiatedAt - a.initiatedAt);
  }

  // Get active alerts
  getActiveAlerts(): EmergencyAlert[] {
    return this.getAllAlerts().filter(
      a => a.status === 'active' || a.status === 'acknowledged' || a.status === 'in_progress'
    );
  }

  // Get alerts by role
  getAlertsByRole(role: StaffRole): EmergencyAlert[] {
    return this.getActiveAlerts().filter(
      a => a.targetRoles.includes('all') || a.targetRoles.includes(role)
    );
  }

  // Get alert statistics
  getStatistics(): AlertStatistics {
    const alerts = this.getAllAlerts();
    const activeAlerts = this.getActiveAlerts();

    const alertsByCode: Record<EmergencyCode, number> = {} as Record<EmergencyCode, number>;
    const alertsBySeverity: Record<AlertSeverity, number> = {} as Record<AlertSeverity, number>;

    let totalResponseTime = 0;
    let responsesCount = 0;
    let acknowledgedCount = 0;

    alerts.forEach(alert => {
      alertsByCode[alert.code] = (alertsByCode[alert.code] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;

      if (alert.acknowledgments.length > 0) {
        acknowledgedCount++;
        const firstAck = alert.acknowledgments[0];
        totalResponseTime += (firstAck.acknowledgedAt - alert.initiatedAt) / 60000;
        responsesCount++;
      }
    });

    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      averageResponseTime: responsesCount > 0 ? Math.round(totalResponseTime / responsesCount * 10) / 10 : 0,
      acknowledgmentRate: alerts.length > 0 ? Math.round((acknowledgedCount / alerts.length) * 100) : 0,
      alertsByCode,
      alertsBySeverity,
    };
  }

  // Get alert history
  getAlertHistory(alertId: string): AlertHistoryEntry[] {
    return this.history.filter(h => h.alertId === alertId);
  }

  // Add history entry
  private addHistoryEntry(alertId: string, action: string, performedBy: string, details?: string): void {
    this.history.unshift({
      id: `HIST-${Date.now()}`,
      alertId,
      action,
      performedBy,
      timestamp: Date.now(),
      details,
    });
  }

  // Subscribe to updates
  subscribe(listener: (alert: EmergencyAlert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(alert: EmergencyAlert): void {
    this.listeners.forEach(listener => listener(alert));
  }

  // Get severity color
  getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      info: '#3B82F6',
      warning: '#F59E0B',
      urgent: '#F97316',
      critical: '#EF4444',
      emergency: '#7C3AED',
    };
    return colors[severity];
  }

  // Get status color
  getStatusColor(status: AlertStatus): string {
    const colors: Record<AlertStatus, string> = {
      active: '#EF4444',
      acknowledged: '#F59E0B',
      in_progress: '#3B82F6',
      resolved: '#22C55E',
      cancelled: '#6B7280',
    };
    return colors[status];
  }

  // Format time elapsed
  formatTimeElapsed(timestamp: number): string {
    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('emergency_alerts', JSON.stringify(Array.from(this.alerts.entries())));
      await AsyncStorage.setItem('alert_history', JSON.stringify(this.history.slice(0, 1000)));
    } catch (error) {
      console.error('Failed to save emergency alert state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const alertsJson = await AsyncStorage.getItem('emergency_alerts');
      if (alertsJson) {
        const entries = JSON.parse(alertsJson);
        entries.forEach(([key, value]: [string, EmergencyAlert]) => {
          this.alerts.set(key, value);
        });
      }

      const historyJson = await AsyncStorage.getItem('alert_history');
      if (historyJson) {
        this.history = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('Failed to load emergency alert state:', error);
    }
  }
}

// Export singleton instance
export const emergencyAlertService = new EmergencyAlertService();
export default emergencyAlertService;
