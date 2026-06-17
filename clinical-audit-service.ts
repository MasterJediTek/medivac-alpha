/**
 * MediVac One - Clinical Audit Trail Service
 * Comprehensive logging for compliance and quality assurance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'session_timeout'
  | 'patient_view'
  | 'patient_create'
  | 'patient_update'
  | 'patient_delete'
  | 'record_view'
  | 'record_create'
  | 'record_update'
  | 'record_delete'
  | 'record_print'
  | 'record_export'
  | 'medication_prescribe'
  | 'medication_administer'
  | 'medication_dispense'
  | 'order_create'
  | 'order_modify'
  | 'order_cancel'
  | 'order_verify'
  | 'lab_order'
  | 'lab_result_view'
  | 'imaging_order'
  | 'imaging_result_view'
  | 'clinical_decision'
  | 'ai_interaction'
  | 'ai_recommendation_accept'
  | 'ai_recommendation_reject'
  | 'alert_acknowledge'
  | 'alert_escalate'
  | 'consent_obtain'
  | 'consent_withdraw'
  | 'referral_create'
  | 'referral_send'
  | 'discharge_initiate'
  | 'discharge_complete'
  | 'claim_submit'
  | 'claim_modify'
  | 'report_generate'
  | 'report_view'
  | 'config_change'
  | 'permission_grant'
  | 'permission_revoke'
  | 'emergency_access'
  | 'break_glass'
  | 'data_export'
  | 'data_import'
  | 'system_error'
  | 'security_event';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'security';

export type ComplianceStandard = 
  | 'hipaa'
  | 'australian_privacy_act'
  | 'my_health_records_act'
  | 'nsqhs'
  | 'iso_27001'
  | 'soc2';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  deviceId?: string;
  deviceType?: string;
  sessionId: string;
  patientId?: string;
  patientMRN?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  description: string;
  previousValue?: string;
  newValue?: string;
  outcome: 'success' | 'failure' | 'partial';
  failureReason?: string;
  metadata?: Record<string, unknown>;
  complianceFlags?: ComplianceStandard[];
  riskScore?: number;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
}

export interface AuditSession {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  startTime: string;
  endTime?: string;
  ipAddress?: string;
  deviceId?: string;
  deviceType?: string;
  location?: string;
  eventCount: number;
  patientAccessCount: number;
  highRiskEventCount: number;
  status: 'active' | 'ended' | 'timeout' | 'terminated';
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  userIds?: string[];
  patientIds?: string[];
  resourceTypes?: string[];
  outcomes?: ('success' | 'failure' | 'partial')[];
  complianceFlags?: ComplianceStandard[];
  minRiskScore?: number;
  searchText?: string;
}

export interface AuditReport {
  id: string;
  title: string;
  reportType: 'compliance' | 'access' | 'security' | 'clinical' | 'custom';
  generatedAt: string;
  generatedBy: string;
  period: { start: string; end: string };
  filters: AuditFilter;
  summary: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    uniqueUsers: number;
    uniquePatients: number;
    highRiskEvents: number;
    complianceViolations: number;
  };
  events: AuditEvent[];
  recommendations?: string[];
}

export interface ComplianceViolation {
  id: string;
  timestamp: string;
  standard: ComplianceStandard;
  requirement: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedEvents: string[];
  status: 'open' | 'investigating' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface RiskIndicator {
  type: string;
  description: string;
  score: number;
  threshold: number;
  triggered: boolean;
  relatedEvents: string[];
}

// ==========================================
// Risk Scoring Configuration
// ==========================================

const RISK_SCORES: Record<AuditEventType, number> = {
  login: 1,
  logout: 0,
  session_timeout: 2,
  patient_view: 2,
  patient_create: 3,
  patient_update: 4,
  patient_delete: 8,
  record_view: 2,
  record_create: 3,
  record_update: 4,
  record_delete: 8,
  record_print: 5,
  record_export: 7,
  medication_prescribe: 5,
  medication_administer: 6,
  medication_dispense: 5,
  order_create: 4,
  order_modify: 5,
  order_cancel: 4,
  order_verify: 3,
  lab_order: 3,
  lab_result_view: 2,
  imaging_order: 3,
  imaging_result_view: 2,
  clinical_decision: 6,
  ai_interaction: 3,
  ai_recommendation_accept: 5,
  ai_recommendation_reject: 4,
  alert_acknowledge: 3,
  alert_escalate: 5,
  consent_obtain: 4,
  consent_withdraw: 6,
  referral_create: 3,
  referral_send: 4,
  discharge_initiate: 5,
  discharge_complete: 5,
  claim_submit: 4,
  claim_modify: 5,
  report_generate: 4,
  report_view: 2,
  config_change: 7,
  permission_grant: 8,
  permission_revoke: 7,
  emergency_access: 9,
  break_glass: 10,
  data_export: 8,
  data_import: 7,
  system_error: 5,
  security_event: 9,
};

const COMPLIANCE_MAPPINGS: Record<AuditEventType, ComplianceStandard[]> = {
  patient_view: ['australian_privacy_act', 'my_health_records_act', 'hipaa'],
  patient_update: ['australian_privacy_act', 'my_health_records_act', 'hipaa'],
  patient_delete: ['australian_privacy_act', 'my_health_records_act', 'hipaa'],
  record_view: ['australian_privacy_act', 'my_health_records_act', 'hipaa'],
  record_export: ['australian_privacy_act', 'my_health_records_act', 'hipaa', 'iso_27001'],
  medication_prescribe: ['nsqhs'],
  medication_administer: ['nsqhs'],
  clinical_decision: ['nsqhs'],
  ai_recommendation_accept: ['nsqhs'],
  consent_obtain: ['australian_privacy_act', 'my_health_records_act'],
  consent_withdraw: ['australian_privacy_act', 'my_health_records_act'],
  emergency_access: ['australian_privacy_act', 'hipaa', 'iso_27001'],
  break_glass: ['australian_privacy_act', 'hipaa', 'iso_27001', 'soc2'],
  data_export: ['australian_privacy_act', 'hipaa', 'iso_27001', 'soc2'],
  security_event: ['iso_27001', 'soc2'],
  permission_grant: ['iso_27001', 'soc2'],
  permission_revoke: ['iso_27001', 'soc2'],
  login: [],
  logout: [],
  session_timeout: [],
  patient_create: ['australian_privacy_act'],
  record_create: ['australian_privacy_act'],
  record_update: ['australian_privacy_act'],
  record_delete: ['australian_privacy_act', 'my_health_records_act'],
  record_print: ['australian_privacy_act'],
  medication_dispense: ['nsqhs'],
  order_create: [],
  order_modify: [],
  order_cancel: [],
  order_verify: [],
  lab_order: [],
  lab_result_view: [],
  imaging_order: [],
  imaging_result_view: [],
  ai_interaction: [],
  ai_recommendation_reject: [],
  alert_acknowledge: [],
  alert_escalate: [],
  referral_create: [],
  referral_send: [],
  discharge_initiate: [],
  discharge_complete: [],
  claim_submit: [],
  claim_modify: [],
  report_generate: [],
  report_view: [],
  config_change: ['iso_27001'],
  data_import: ['australian_privacy_act'],
  system_error: [],
};

// ==========================================
// Clinical Audit Service
// ==========================================

class ClinicalAuditService {
  private events: AuditEvent[] = [];
  private sessions: Map<string, AuditSession> = new Map();
  private violations: ComplianceViolation[] = [];
  private currentSession: AuditSession | null = null;
  private maxEvents = 10000;

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem('audit_events');
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }

      const sessionsData = await AsyncStorage.getItem('audit_sessions');
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.sessions.set(key, value as AuditSession);
        });
      }

      const violationsData = await AsyncStorage.getItem('audit_violations');
      if (violationsData) {
        this.violations = JSON.parse(violationsData);
      }
    } catch (error) {
      console.error('Failed to load audit state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      // Keep only recent events
      const recentEvents = this.events.slice(-this.maxEvents);
      await AsyncStorage.setItem('audit_events', JSON.stringify(recentEvents));

      const sessionsObj: Record<string, AuditSession> = {};
      this.sessions.forEach((value, key) => {
        sessionsObj[key] = value;
      });
      await AsyncStorage.setItem('audit_sessions', JSON.stringify(sessionsObj));

      await AsyncStorage.setItem('audit_violations', JSON.stringify(this.violations.slice(-500)));
    } catch (error) {
      console.error('Failed to save audit state:', error);
    }
  }

  // ==========================================
  // Session Management
  // ==========================================

  startSession(
    userId: string,
    userName: string,
    userRole: string,
    deviceInfo?: { deviceId?: string; deviceType?: string; ipAddress?: string; location?: string }
  ): AuditSession {
    const session: AuditSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userRole,
      startTime: new Date().toISOString(),
      ipAddress: deviceInfo?.ipAddress,
      deviceId: deviceInfo?.deviceId,
      deviceType: deviceInfo?.deviceType,
      location: deviceInfo?.location,
      eventCount: 0,
      patientAccessCount: 0,
      highRiskEventCount: 0,
      status: 'active',
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;

    // Log login event
    this.logEvent({
      eventType: 'login',
      action: 'User logged in',
      description: `${userName} (${userRole}) logged in`,
      outcome: 'success',
    });

    return session;
  }

  endSession(reason: 'logout' | 'timeout' | 'terminated' = 'logout'): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.status = reason === 'logout' ? 'ended' : reason;
    this.sessions.set(this.currentSession.id, this.currentSession);

    // Log logout event
    this.logEvent({
      eventType: reason === 'timeout' ? 'session_timeout' : 'logout',
      action: `Session ${reason}`,
      description: `User session ended: ${reason}`,
      outcome: 'success',
    });

    this.currentSession = null;
    this.saveState();
  }

  getCurrentSession(): AuditSession | null {
    return this.currentSession;
  }

  // ==========================================
  // Event Logging
  // ==========================================

  logEvent(eventData: {
    eventType: AuditEventType;
    action: string;
    description: string;
    outcome: 'success' | 'failure' | 'partial';
    patientId?: string;
    patientMRN?: string;
    resourceType?: string;
    resourceId?: string;
    previousValue?: string;
    newValue?: string;
    failureReason?: string;
    metadata?: Record<string, unknown>;
  }): AuditEvent {
    const session = this.currentSession;
    const riskScore = RISK_SCORES[eventData.eventType] || 1;
    const complianceFlags = COMPLIANCE_MAPPINGS[eventData.eventType] || [];

    // Increase risk for failures
    const adjustedRiskScore = eventData.outcome === 'failure' ? riskScore * 1.5 : riskScore;

    const event: AuditEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType: eventData.eventType,
      severity: this.determineSeverity(eventData.eventType, adjustedRiskScore),
      userId: session?.userId || 'system',
      userName: session?.userName || 'System',
      userRole: session?.userRole || 'system',
      ipAddress: session?.ipAddress,
      deviceId: session?.deviceId,
      deviceType: session?.deviceType,
      sessionId: session?.id || 'no_session',
      patientId: eventData.patientId,
      patientMRN: eventData.patientMRN,
      resourceType: eventData.resourceType,
      resourceId: eventData.resourceId,
      action: eventData.action,
      description: eventData.description,
      previousValue: eventData.previousValue,
      newValue: eventData.newValue,
      outcome: eventData.outcome,
      failureReason: eventData.failureReason,
      metadata: eventData.metadata,
      complianceFlags,
      riskScore: adjustedRiskScore,
    };

    this.events.push(event);

    // Update session statistics
    if (session) {
      session.eventCount++;
      if (eventData.patientId) {
        session.patientAccessCount++;
      }
      if (adjustedRiskScore >= 7) {
        session.highRiskEventCount++;
      }
      this.sessions.set(session.id, session);
    }

    // Check for compliance violations
    this.checkComplianceViolations(event);

    // Async save
    this.saveState();

    return event;
  }

  private determineSeverity(eventType: AuditEventType, riskScore: number): AuditSeverity {
    if (eventType === 'security_event' || eventType === 'break_glass') {
      return 'security';
    }
    if (riskScore >= 8) {
      return 'critical';
    }
    if (riskScore >= 5) {
      return 'warning';
    }
    return 'info';
  }

  // ==========================================
  // Specialized Logging Methods
  // ==========================================

  logPatientAccess(
    patientId: string,
    patientMRN: string,
    accessType: 'view' | 'create' | 'update' | 'delete',
    resourceType: string,
    resourceId?: string,
    details?: string
  ): AuditEvent {
    const eventTypeMap: Record<string, AuditEventType> = {
      view: 'patient_view',
      create: 'patient_create',
      update: 'patient_update',
      delete: 'patient_delete',
    };

    return this.logEvent({
      eventType: eventTypeMap[accessType] || 'patient_view',
      action: `Patient ${accessType}`,
      description: details || `Accessed patient ${resourceType}`,
      outcome: 'success',
      patientId,
      patientMRN,
      resourceType,
      resourceId,
    });
  }

  logClinicalDecision(
    patientId: string,
    patientMRN: string,
    decision: string,
    rationale: string,
    aiAssisted: boolean,
    metadata?: Record<string, unknown>
  ): AuditEvent {
    return this.logEvent({
      eventType: 'clinical_decision',
      action: 'Clinical decision made',
      description: `${decision}. Rationale: ${rationale}. AI-assisted: ${aiAssisted}`,
      outcome: 'success',
      patientId,
      patientMRN,
      resourceType: 'clinical_decision',
      metadata: { ...metadata, aiAssisted, decision, rationale },
    });
  }

  logAIInteraction(
    interactionType: 'query' | 'recommendation_accept' | 'recommendation_reject',
    aiPersona: string,
    query: string,
    response: string,
    patientId?: string,
    patientMRN?: string
  ): AuditEvent {
    const eventTypeMap: Record<string, AuditEventType> = {
      query: 'ai_interaction',
      recommendation_accept: 'ai_recommendation_accept',
      recommendation_reject: 'ai_recommendation_reject',
    };

    return this.logEvent({
      eventType: eventTypeMap[interactionType],
      action: `AI ${interactionType.replace('_', ' ')}`,
      description: `AI Persona: ${aiPersona}. Query: ${query.substring(0, 100)}...`,
      outcome: 'success',
      patientId,
      patientMRN,
      resourceType: 'ai_interaction',
      metadata: { aiPersona, query, response: response.substring(0, 500) },
    });
  }

  logMedicationEvent(
    eventType: 'prescribe' | 'administer' | 'dispense',
    patientId: string,
    patientMRN: string,
    medication: string,
    dose: string,
    route?: string,
    verifiedBy?: string
  ): AuditEvent {
    const eventTypeMap: Record<string, AuditEventType> = {
      prescribe: 'medication_prescribe',
      administer: 'medication_administer',
      dispense: 'medication_dispense',
    };

    return this.logEvent({
      eventType: eventTypeMap[eventType],
      action: `Medication ${eventType}`,
      description: `${medication} ${dose}${route ? ` via ${route}` : ''}`,
      outcome: 'success',
      patientId,
      patientMRN,
      resourceType: 'medication',
      metadata: { medication, dose, route, verifiedBy },
    });
  }

  logEmergencyAccess(
    patientId: string,
    patientMRN: string,
    reason: string,
    breakGlass: boolean = false
  ): AuditEvent {
    return this.logEvent({
      eventType: breakGlass ? 'break_glass' : 'emergency_access',
      action: breakGlass ? 'Break glass access' : 'Emergency access',
      description: `Emergency access to patient record. Reason: ${reason}`,
      outcome: 'success',
      patientId,
      patientMRN,
      resourceType: 'emergency_access',
      metadata: { reason, breakGlass },
    });
  }

  logDataExport(
    exportType: string,
    recordCount: number,
    destination: string,
    patientIds?: string[]
  ): AuditEvent {
    return this.logEvent({
      eventType: 'data_export',
      action: 'Data export',
      description: `Exported ${recordCount} ${exportType} records to ${destination}`,
      outcome: 'success',
      resourceType: 'data_export',
      metadata: { exportType, recordCount, destination, patientIds },
    });
  }

  logSecurityEvent(
    eventDescription: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, unknown>
  ): AuditEvent {
    return this.logEvent({
      eventType: 'security_event',
      action: 'Security event',
      description: eventDescription,
      outcome: 'success',
      resourceType: 'security',
      metadata: { ...metadata, securitySeverity: severity },
    });
  }

  // ==========================================
  // Compliance Checking
  // ==========================================

  private checkComplianceViolations(event: AuditEvent): void {
    // Check for excessive patient access
    if (event.patientId && this.currentSession) {
      const recentPatientAccess = this.events.filter(
        e => e.patientId === event.patientId &&
             e.sessionId === this.currentSession?.id &&
             e.timestamp > new Date(Date.now() - 3600000).toISOString()
      ).length;

      if (recentPatientAccess > 50) {
        this.createViolation({
          standard: 'australian_privacy_act',
          requirement: 'Minimum necessary access',
          description: `Excessive access to patient ${event.patientMRN} (${recentPatientAccess} accesses in 1 hour)`,
          severity: 'medium',
          relatedEvents: [event.id],
        });
      }
    }

    // Check for after-hours access
    const hour = new Date(event.timestamp).getHours();
    if ((hour < 6 || hour > 22) && event.riskScore && event.riskScore >= 5) {
      this.createViolation({
        standard: 'iso_27001',
        requirement: 'Access monitoring',
        description: `High-risk action performed outside business hours: ${event.action}`,
        severity: 'low',
        relatedEvents: [event.id],
      });
    }

    // Check for break glass without proper documentation
    if (event.eventType === 'break_glass' && !event.metadata?.reason) {
      this.createViolation({
        standard: 'hipaa',
        requirement: 'Emergency access documentation',
        description: 'Break glass access without documented reason',
        severity: 'high',
        relatedEvents: [event.id],
      });
    }
  }

  private createViolation(data: {
    standard: ComplianceStandard;
    requirement: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    relatedEvents: string[];
  }): ComplianceViolation {
    const violation: ComplianceViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...data,
      status: 'open',
    };

    this.violations.push(violation);
    return violation;
  }

  // ==========================================
  // Querying and Filtering
  // ==========================================

  queryEvents(filter: AuditFilter): AuditEvent[] {
    let results = [...this.events];

    if (filter.startDate) {
      results = results.filter(e => e.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      results = results.filter(e => e.timestamp <= filter.endDate!);
    }
    if (filter.eventTypes?.length) {
      results = results.filter(e => filter.eventTypes!.includes(e.eventType));
    }
    if (filter.severities?.length) {
      results = results.filter(e => filter.severities!.includes(e.severity));
    }
    if (filter.userIds?.length) {
      results = results.filter(e => filter.userIds!.includes(e.userId));
    }
    if (filter.patientIds?.length) {
      results = results.filter(e => e.patientId && filter.patientIds!.includes(e.patientId));
    }
    if (filter.resourceTypes?.length) {
      results = results.filter(e => e.resourceType && filter.resourceTypes!.includes(e.resourceType));
    }
    if (filter.outcomes?.length) {
      results = results.filter(e => filter.outcomes!.includes(e.outcome));
    }
    if (filter.complianceFlags?.length) {
      results = results.filter(e => 
        e.complianceFlags?.some(f => filter.complianceFlags!.includes(f))
      );
    }
    if (filter.minRiskScore !== undefined) {
      results = results.filter(e => (e.riskScore || 0) >= filter.minRiskScore!);
    }
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      results = results.filter(e =>
        e.action.toLowerCase().includes(searchLower) ||
        e.description.toLowerCase().includes(searchLower) ||
        e.userName.toLowerCase().includes(searchLower)
      );
    }

    return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getEventById(eventId: string): AuditEvent | undefined {
    return this.events.find(e => e.id === eventId);
  }

  getRecentEvents(count: number = 100): AuditEvent[] {
    return this.events.slice(-count).reverse();
  }

  getHighRiskEvents(hours: number = 24): AuditEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return this.events.filter(e => 
      e.timestamp >= cutoff && (e.riskScore || 0) >= 7
    ).reverse();
  }

  // ==========================================
  // Reports
  // ==========================================

  generateReport(
    reportType: AuditReport['reportType'],
    title: string,
    period: { start: string; end: string },
    filter?: AuditFilter
  ): AuditReport {
    const fullFilter: AuditFilter = {
      ...filter,
      startDate: period.start,
      endDate: period.end,
    };

    const events = this.queryEvents(fullFilter);

    // Calculate summary statistics
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniquePatients = new Set<string>();
    let highRiskEvents = 0;
    let complianceViolations = 0;

    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;
      uniqueUsers.add(event.userId);
      if (event.patientId) uniquePatients.add(event.patientId);
      if ((event.riskScore || 0) >= 7) highRiskEvents++;
      if (event.complianceFlags?.length) complianceViolations++;
    });

    const report: AuditReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentSession?.userName || 'System',
      period,
      filters: fullFilter,
      summary: {
        totalEvents: events.length,
        eventsByType,
        eventsBySeverity,
        eventsByOutcome,
        uniqueUsers: uniqueUsers.size,
        uniquePatients: uniquePatients.size,
        highRiskEvents,
        complianceViolations,
      },
      events: events.slice(0, 1000), // Limit events in report
      recommendations: this.generateRecommendations(events),
    };

    // Log report generation
    this.logEvent({
      eventType: 'report_generate',
      action: 'Audit report generated',
      description: `Generated ${reportType} report: ${title}`,
      outcome: 'success',
      resourceType: 'audit_report',
      resourceId: report.id,
    });

    return report;
  }

  private generateRecommendations(events: AuditEvent[]): string[] {
    const recommendations: string[] = [];

    // Check for high failure rate
    const failures = events.filter(e => e.outcome === 'failure').length;
    if (failures / events.length > 0.1) {
      recommendations.push('High failure rate detected. Review system stability and user training.');
    }

    // Check for excessive after-hours access
    const afterHours = events.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22;
    }).length;
    if (afterHours / events.length > 0.2) {
      recommendations.push('Significant after-hours activity detected. Review access policies.');
    }

    // Check for high-risk events
    const highRisk = events.filter(e => (e.riskScore || 0) >= 7).length;
    if (highRisk > 10) {
      recommendations.push(`${highRisk} high-risk events detected. Review and investigate.`);
    }

    return recommendations;
  }

  // ==========================================
  // Compliance Violations
  // ==========================================

  getOpenViolations(): ComplianceViolation[] {
    return this.violations.filter(v => v.status === 'open' || v.status === 'investigating');
  }

  getViolationsByStandard(standard: ComplianceStandard): ComplianceViolation[] {
    return this.violations.filter(v => v.standard === standard);
  }

  async resolveViolation(violationId: string, resolution: string, resolvedBy: string): Promise<void> {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.status = 'resolved';
      violation.resolution = resolution;
      violation.resolvedAt = new Date().toISOString();
      violation.assignedTo = resolvedBy;
      await this.saveState();
    }
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(hours: number = 24): {
    totalEvents: number;
    eventsPerHour: number;
    highRiskEvents: number;
    uniqueUsers: number;
    uniquePatients: number;
    failureRate: number;
    openViolations: number;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

    const uniqueUsers = new Set(recentEvents.map(e => e.userId));
    const uniquePatients = new Set(recentEvents.filter(e => e.patientId).map(e => e.patientId));
    const failures = recentEvents.filter(e => e.outcome === 'failure').length;
    const highRisk = recentEvents.filter(e => (e.riskScore || 0) >= 7).length;

    return {
      totalEvents: recentEvents.length,
      eventsPerHour: Math.round(recentEvents.length / hours * 10) / 10,
      highRiskEvents: highRisk,
      uniqueUsers: uniqueUsers.size,
      uniquePatients: uniquePatients.size,
      failureRate: recentEvents.length > 0 ? Math.round(failures / recentEvents.length * 100 * 10) / 10 : 0,
      openViolations: this.getOpenViolations().length,
    };
  }

  // ==========================================
  // Risk Analysis
  // ==========================================

  analyzeRiskIndicators(): RiskIndicator[] {
    const indicators: RiskIndicator[] = [];
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentEvents = this.events.filter(e => e.timestamp >= last24h);

    // Break glass usage
    const breakGlassEvents = recentEvents.filter(e => e.eventType === 'break_glass');
    indicators.push({
      type: 'break_glass_usage',
      description: 'Break glass access events in last 24 hours',
      score: breakGlassEvents.length * 10,
      threshold: 5,
      triggered: breakGlassEvents.length > 0,
      relatedEvents: breakGlassEvents.map(e => e.id),
    });

    // Failed login attempts
    const failedLogins = recentEvents.filter(e => e.eventType === 'login' && e.outcome === 'failure');
    indicators.push({
      type: 'failed_logins',
      description: 'Failed login attempts in last 24 hours',
      score: failedLogins.length * 2,
      threshold: 10,
      triggered: failedLogins.length >= 5,
      relatedEvents: failedLogins.map(e => e.id),
    });

    // Data exports
    const dataExports = recentEvents.filter(e => e.eventType === 'data_export');
    indicators.push({
      type: 'data_exports',
      description: 'Data export events in last 24 hours',
      score: dataExports.length * 5,
      threshold: 20,
      triggered: dataExports.length >= 4,
      relatedEvents: dataExports.map(e => e.id),
    });

    // After hours high-risk access
    const afterHoursHighRisk = recentEvents.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return (hour < 6 || hour > 22) && (e.riskScore || 0) >= 7;
    });
    indicators.push({
      type: 'after_hours_high_risk',
      description: 'High-risk actions outside business hours',
      score: afterHoursHighRisk.length * 8,
      threshold: 15,
      triggered: afterHoursHighRisk.length >= 2,
      relatedEvents: afterHoursHighRisk.map(e => e.id),
    });

    return indicators;
  }
}

export const clinicalAudit = new ClinicalAuditService();
