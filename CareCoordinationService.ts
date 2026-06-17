/**
 * Care Coordination Dashboard Service
 * MediVac One v3.2 - Unified Care Team Coordination
 * 
 * Comprehensive care coordination tracking for referrals,
 * consultations, and interdisciplinary team activities.
 */

// Referral Types
export type ReferralType = 
  | 'specialty_consult'
  | 'imaging'
  | 'laboratory'
  | 'physical_therapy'
  | 'occupational_therapy'
  | 'speech_therapy'
  | 'social_work'
  | 'case_management'
  | 'nutrition'
  | 'pharmacy'
  | 'wound_care'
  | 'palliative_care'
  | 'home_health'
  | 'dme'
  | 'external_facility';

export type ReferralStatus = 
  | 'pending'
  | 'sent'
  | 'acknowledged'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined';

export type ReferralPriority = 'routine' | 'urgent' | 'stat' | 'emergent';

export interface Referral {
  id: string;
  referralNumber: string;
  type: ReferralType;
  status: ReferralStatus;
  priority: ReferralPriority;
  
  // Patient Info
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientUnit: string;
  patientRoom: string;
  
  // Referral Details
  referringProviderId: string;
  referringProviderName: string;
  receivingDepartment: string;
  receivingProviderId?: string;
  receivingProviderName?: string;
  
  // Clinical Info
  reason: string;
  clinicalQuestion: string;
  relevantHistory: string;
  urgencyJustification?: string;
  
  // Scheduling
  requestedDate?: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  
  // Response
  findings?: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  specialty?: string;
  contactNumber: string;
  email: string;
  isAttending: boolean;
  isPrimary: boolean;
  assignedDate: Date;
}

export interface CareTeam {
  patientId: string;
  patientName: string;
  members: CareTeamMember[];
  lastUpdated: Date;
}

export interface TeamActivity {
  id: string;
  patientId: string;
  activityType: 'note' | 'order' | 'consult' | 'meeting' | 'discharge_planning' | 'family_meeting';
  title: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  performedAt: Date;
  participants?: string[];
  outcome?: string;
}

export interface CareConference {
  id: string;
  patientId: string;
  patientName: string;
  conferenceType: 'interdisciplinary' | 'family' | 'discharge_planning' | 'ethics' | 'palliative';
  scheduledDate: Date;
  duration: number; // minutes
  location: string;
  attendees: { name: string; role: string; confirmed: boolean }[];
  agenda: string[];
  notes?: string;
  actionItems: { task: string; assignee: string; dueDate: Date; completed: boolean }[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CoordinationMetrics {
  totalReferrals: number;
  pendingReferrals: number;
  overdueReferrals: number;
  averageResponseTime: number; // hours
  completionRate: number; // percentage
  byType: Record<ReferralType, number>;
  byStatus: Record<ReferralStatus, number>;
  byPriority: Record<ReferralPriority, number>;
}

// Mock data storage
const referrals: Map<string, Referral> = new Map();
const careTeams: Map<string, CareTeam> = new Map();
const activities: TeamActivity[] = [];
const conferences: Map<string, CareConference> = new Map();
let referralCounter = 1000;

/**
 * Care Coordination Service
 */
export const CareCoordinationService = {
  /**
   * Create a new referral
   */
  createReferral(data: Partial<Referral>): Referral {
    referralCounter++;
    const id = `REF-${Date.now()}`;
    const referralNumber = `R-${new Date().getFullYear()}-${referralCounter}`;
    
    const referral: Referral = {
      id,
      referralNumber,
      type: data.type || 'specialty_consult',
      status: 'pending',
      priority: data.priority || 'routine',
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      patientMRN: data.patientMRN || '',
      patientUnit: data.patientUnit || '',
      patientRoom: data.patientRoom || '',
      referringProviderId: data.referringProviderId || '',
      referringProviderName: data.referringProviderName || '',
      receivingDepartment: data.receivingDepartment || '',
      receivingProviderId: data.receivingProviderId,
      receivingProviderName: data.receivingProviderName,
      reason: data.reason || '',
      clinicalQuestion: data.clinicalQuestion || '',
      relevantHistory: data.relevantHistory || '',
      urgencyJustification: data.urgencyJustification,
      requestedDate: data.requestedDate,
      followUpRequired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    referrals.set(id, referral);
    
    // Log activity
    this.logActivity({
      patientId: referral.patientId,
      activityType: 'consult',
      title: `${referral.type.replace('_', ' ')} referral created`,
      description: `Referral to ${referral.receivingDepartment}: ${referral.reason}`,
      performedBy: referral.referringProviderName,
      performedByRole: 'Physician',
    });
    
    return referral;
  },

  /**
   * Update referral status
   */
  updateReferralStatus(referralId: string, status: ReferralStatus, details?: {
    scheduledDate?: Date;
    findings?: string;
    recommendations?: string;
    receivingProviderName?: string;
  }): Referral | null {
    const referral = referrals.get(referralId);
    if (!referral) return null;
    
    referral.status = status;
    referral.updatedAt = new Date();
    
    if (status === 'acknowledged') {
      referral.acknowledgedAt = new Date();
    }
    
    if (status === 'scheduled' && details?.scheduledDate) {
      referral.scheduledDate = details.scheduledDate;
    }
    
    if (status === 'completed') {
      referral.completedDate = new Date();
      if (details?.findings) referral.findings = details.findings;
      if (details?.recommendations) referral.recommendations = details.recommendations;
    }
    
    if (details?.receivingProviderName) {
      referral.receivingProviderName = details.receivingProviderName;
    }
    
    return referral;
  },

  /**
   * Get referral by ID
   */
  getReferral(referralId: string): Referral | null {
    return referrals.get(referralId) || null;
  },

  /**
   * Get referrals by patient
   */
  getReferralsByPatient(patientId: string): Referral[] {
    return Array.from(referrals.values())
      .filter(r => r.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get pending referrals
   */
  getPendingReferrals(): Referral[] {
    return Array.from(referrals.values())
      .filter(r => ['pending', 'sent', 'acknowledged'].includes(r.status))
      .sort((a, b) => {
        // Sort by priority then by date
        const priorityOrder = { emergent: 0, stat: 1, urgent: 2, routine: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  },

  /**
   * Get overdue referrals (pending > 24h for routine, > 4h for urgent, > 1h for stat)
   */
  getOverdueReferrals(): Referral[] {
    const now = Date.now();
    const thresholds: Record<ReferralPriority, number> = {
      routine: 24 * 60 * 60 * 1000, // 24 hours
      urgent: 4 * 60 * 60 * 1000,   // 4 hours
      stat: 1 * 60 * 60 * 1000,     // 1 hour
      emergent: 15 * 60 * 1000,     // 15 minutes
    };
    
    return Array.from(referrals.values())
      .filter(r => {
        if (!['pending', 'sent'].includes(r.status)) return false;
        const age = now - r.createdAt.getTime();
        return age > thresholds[r.priority];
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  /**
   * Create or update care team
   */
  updateCareTeam(patientId: string, patientName: string, members: CareTeamMember[]): CareTeam {
    const careTeam: CareTeam = {
      patientId,
      patientName,
      members,
      lastUpdated: new Date(),
    };
    
    careTeams.set(patientId, careTeam);
    return careTeam;
  },

  /**
   * Add care team member
   */
  addCareTeamMember(patientId: string, member: Omit<CareTeamMember, 'id' | 'assignedDate'>): CareTeam | null {
    const careTeam = careTeams.get(patientId);
    if (!careTeam) return null;
    
    const newMember: CareTeamMember = {
      id: `CTM-${Date.now()}`,
      assignedDate: new Date(),
      ...member,
    };
    
    careTeam.members.push(newMember);
    careTeam.lastUpdated = new Date();
    
    return careTeam;
  },

  /**
   * Get care team
   */
  getCareTeam(patientId: string): CareTeam | null {
    return careTeams.get(patientId) || null;
  },

  /**
   * Log team activity
   */
  logActivity(data: Omit<TeamActivity, 'id' | 'performedAt'>): TeamActivity {
    const activity: TeamActivity = {
      id: `ACT-${Date.now()}`,
      performedAt: new Date(),
      ...data,
    };
    
    activities.push(activity);
    return activity;
  },

  /**
   * Get activities by patient
   */
  getActivitiesByPatient(patientId: string, limit?: number): TeamActivity[] {
    const patientActivities = activities
      .filter(a => a.patientId === patientId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
    
    return limit ? patientActivities.slice(0, limit) : patientActivities;
  },

  /**
   * Schedule care conference
   */
  scheduleConference(data: Omit<CareConference, 'id' | 'status'>): CareConference {
    const id = `CONF-${Date.now()}`;
    
    const conference: CareConference = {
      id,
      status: 'scheduled',
      ...data,
    };
    
    conferences.set(id, conference);
    
    // Log activity
    this.logActivity({
      patientId: data.patientId,
      activityType: 'meeting',
      title: `${data.conferenceType} conference scheduled`,
      description: `Scheduled for ${data.scheduledDate.toLocaleString()}`,
      performedBy: 'Care Coordinator',
      performedByRole: 'Care Coordinator',
      participants: data.attendees.map(a => a.name),
    });
    
    return conference;
  },

  /**
   * Get upcoming conferences
   */
  getUpcomingConferences(): CareConference[] {
    const now = new Date();
    return Array.from(conferences.values())
      .filter(c => c.status === 'scheduled' && c.scheduledDate > now)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  },

  /**
   * Get conferences by patient
   */
  getConferencesByPatient(patientId: string): CareConference[] {
    return Array.from(conferences.values())
      .filter(c => c.patientId === patientId)
      .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  },

  /**
   * Complete conference with notes
   */
  completeConference(conferenceId: string, notes: string, actionItems: CareConference['actionItems']): CareConference | null {
    const conference = conferences.get(conferenceId);
    if (!conference) return null;
    
    conference.status = 'completed';
    conference.notes = notes;
    conference.actionItems = actionItems;
    
    // Log activity
    this.logActivity({
      patientId: conference.patientId,
      activityType: 'meeting',
      title: `${conference.conferenceType} conference completed`,
      description: notes.substring(0, 200),
      performedBy: 'Care Coordinator',
      performedByRole: 'Care Coordinator',
      participants: conference.attendees.filter(a => a.confirmed).map(a => a.name),
      outcome: `${actionItems.length} action items assigned`,
    });
    
    return conference;
  },

  /**
   * Get coordination metrics
   */
  getMetrics(): CoordinationMetrics {
    const all = Array.from(referrals.values());
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    let totalResponseTime = 0;
    let completedCount = 0;
    
    for (const referral of all) {
      byType[referral.type] = (byType[referral.type] || 0) + 1;
      byStatus[referral.status] = (byStatus[referral.status] || 0) + 1;
      byPriority[referral.priority] = (byPriority[referral.priority] || 0) + 1;
      
      if (referral.acknowledgedAt) {
        totalResponseTime += referral.acknowledgedAt.getTime() - referral.createdAt.getTime();
        completedCount++;
      }
    }
    
    const pendingReferrals = this.getPendingReferrals().length;
    const overdueReferrals = this.getOverdueReferrals().length;
    const completed = all.filter(r => r.status === 'completed').length;
    
    return {
      totalReferrals: all.length,
      pendingReferrals,
      overdueReferrals,
      averageResponseTime: completedCount > 0 
        ? Math.round((totalResponseTime / completedCount) / (60 * 60 * 1000) * 10) / 10 
        : 0,
      completionRate: all.length > 0 ? Math.round((completed / all.length) * 100) : 0,
      byType: byType as Record<ReferralType, number>,
      byStatus: byStatus as Record<ReferralStatus, number>,
      byPriority: byPriority as Record<ReferralPriority, number>,
    };
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): {
    pendingReferrals: Referral[];
    overdueReferrals: Referral[];
    upcomingConferences: CareConference[];
    recentActivities: TeamActivity[];
    metrics: CoordinationMetrics;
  } {
    return {
      pendingReferrals: this.getPendingReferrals().slice(0, 10),
      overdueReferrals: this.getOverdueReferrals().slice(0, 5),
      upcomingConferences: this.getUpcomingConferences().slice(0, 5),
      recentActivities: activities.slice(-20).reverse(),
      metrics: this.getMetrics(),
    };
  },

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    referrals.clear();
    careTeams.clear();
    activities.length = 0;
    conferences.clear();
    referralCounter = 1000;
  },
};

export default CareCoordinationService;
