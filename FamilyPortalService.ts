/**
 * Patient Family Communication Portal Service
 * MediVac One v3.0 - Family Engagement System
 * 
 * Provides secure communication between families and care teams
 */

// Types
export type FamilyMemberRole = 'primary_contact' | 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'other';
export type MessagePriority = 'urgent' | 'high' | 'normal' | 'low';
export type UpdateType = 'status' | 'procedure' | 'discharge' | 'visit' | 'general';
export type VisitStatus = 'requested' | 'approved' | 'declined' | 'completed' | 'cancelled';

export interface FamilyMember {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  relationship: FamilyMemberRole;
  email: string;
  phone: string;
  isVerified: boolean;
  isPrimaryContact: boolean;
  notificationPreferences: NotificationPreferences;
  language: string;
  registeredAt: Date;
  lastActiveAt: Date;
}

export interface NotificationPreferences {
  statusUpdates: boolean;
  procedureAlerts: boolean;
  visitReminders: boolean;
  messageNotifications: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface PatientUpdate {
  id: string;
  patientId: string;
  type: UpdateType;
  title: string;
  message: string;
  priority: MessagePriority;
  isPublic: boolean;
  attachments: UpdateAttachment[];
  createdBy: string;
  createdAt: Date;
  readBy: string[];
  expiresAt?: Date;
}

export interface UpdateAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  name: string;
  url: string;
  thumbnailUrl?: string;
  consentRequired: boolean;
  consentGiven: boolean;
}

export interface FamilyMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'family' | 'staff';
  senderName: string;
  content: string;
  attachments: MessageAttachment[];
  priority: MessagePriority;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  name: string;
  url: string;
  size: number;
}

export interface VisitRequest {
  id: string;
  patientId: string;
  familyMemberId: string;
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  visitors: VisitorInfo[];
  purpose: string;
  specialRequests?: string;
  status: VisitStatus;
  approvedBy?: string;
  approvedAt?: Date;
  declineReason?: string;
  createdAt: Date;
}

export interface VisitorInfo {
  name: string;
  relationship: string;
  isMinor: boolean;
  requiresAssistance: boolean;
}

export interface CarePlanView {
  id: string;
  patientId: string;
  diagnosis: string;
  treatmentPlan: string;
  medications: MedicationSummary[];
  upcomingProcedures: ProcedureSummary[];
  dietaryRestrictions: string[];
  activityLevel: string;
  expectedDischarge?: Date;
  careTeam: CareTeamMember[];
  lastUpdated: Date;
}

export interface MedicationSummary {
  name: string;
  purpose: string;
  frequency: string;
}

export interface ProcedureSummary {
  name: string;
  scheduledDate: Date;
  description: string;
}

export interface CareTeamMember {
  name: string;
  role: string;
  specialty?: string;
  photoUrl?: string;
}

export interface SatisfactionSurvey {
  id: string;
  patientId: string;
  familyMemberId: string;
  overallRating: number;
  communicationRating: number;
  careQualityRating: number;
  staffCourtesyRating: number;
  facilityRating: number;
  comments: string;
  wouldRecommend: boolean;
  submittedAt: Date;
}

// Service Implementation
class FamilyPortalServiceImpl {
  private familyMembers: Map<string, FamilyMember> = new Map();
  private updates: Map<string, PatientUpdate> = new Map();
  private messages: Map<string, FamilyMessage[]> = new Map();
  private visitRequests: Map<string, VisitRequest> = new Map();
  private carePlans: Map<string, CarePlanView> = new Map();
  private surveys: Map<string, SatisfactionSurvey> = new Map();
  private listeners: Set<(event: PortalEvent) => void> = new Set();

  // Family Member Management
  async registerFamilyMember(
    patientId: string,
    memberData: Omit<FamilyMember, 'id' | 'isVerified' | 'registeredAt' | 'lastActiveAt'>
  ): Promise<FamilyMember> {
    const member: FamilyMember = {
      ...memberData,
      id: `FAM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isVerified: false,
      registeredAt: new Date(),
      lastActiveAt: new Date(),
    };

    this.familyMembers.set(member.id, member);
    this.emit({ type: 'family_registered', data: member });

    // Send verification email/SMS
    await this.sendVerification(member);

    return member;
  }

  async verifyFamilyMember(memberId: string, verificationCode: string): Promise<boolean> {
    const member = this.familyMembers.get(memberId);
    if (!member) return false;

    // Simulate verification (in production, validate code)
    if (verificationCode.length === 6) {
      member.isVerified = true;
      this.familyMembers.set(memberId, member);
      this.emit({ type: 'family_verified', data: member });
      return true;
    }

    return false;
  }

  async getFamilyMembers(patientId: string): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values())
      .filter(m => m.patientId === patientId);
  }

  async updateNotificationPreferences(
    memberId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<FamilyMember | null> {
    const member = this.familyMembers.get(memberId);
    if (!member) return null;

    member.notificationPreferences = {
      ...member.notificationPreferences,
      ...preferences,
    };

    this.familyMembers.set(memberId, member);
    return member;
  }

  // Patient Updates
  async broadcastUpdate(update: Omit<PatientUpdate, 'id' | 'createdAt' | 'readBy'>): Promise<PatientUpdate> {
    const newUpdate: PatientUpdate = {
      ...update,
      id: `UPD-${Date.now()}`,
      createdAt: new Date(),
      readBy: [],
    };

    this.updates.set(newUpdate.id, newUpdate);
    this.emit({ type: 'update_broadcast', data: newUpdate });

    // Notify family members
    const familyMembers = await this.getFamilyMembers(update.patientId);
    for (const member of familyMembers) {
      if (member.isVerified && member.notificationPreferences.statusUpdates) {
        await this.sendNotification(member, newUpdate);
      }
    }

    return newUpdate;
  }

  async getPatientUpdates(patientId: string, limit: number = 20): Promise<PatientUpdate[]> {
    return Array.from(this.updates.values())
      .filter(u => u.patientId === patientId && u.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async markUpdateAsRead(updateId: string, memberId: string): Promise<void> {
    const update = this.updates.get(updateId);
    if (update && !update.readBy.includes(memberId)) {
      update.readBy.push(memberId);
      this.updates.set(updateId, update);
    }
  }

  // Messaging
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'family' | 'staff',
    senderName: string,
    content: string,
    attachments: MessageAttachment[] = [],
    priority: MessagePriority = 'normal'
  ): Promise<FamilyMessage> {
    const message: FamilyMessage = {
      id: `MSG-${Date.now()}`,
      conversationId,
      senderId,
      senderType,
      senderName,
      content,
      attachments,
      priority,
      isRead: false,
      createdAt: new Date(),
    };

    const existing = this.messages.get(conversationId) || [];
    existing.push(message);
    this.messages.set(conversationId, existing);

    this.emit({ type: 'message_sent', data: message });

    return message;
  }

  async getConversation(conversationId: string): Promise<FamilyMessage[]> {
    return this.messages.get(conversationId) || [];
  }

  async markMessageAsRead(messageId: string, conversationId: string): Promise<void> {
    const conversation = this.messages.get(conversationId);
    if (conversation) {
      const message = conversation.find(m => m.id === messageId);
      if (message) {
        message.isRead = true;
        message.readAt = new Date();
      }
    }
  }

  // Visit Scheduling
  async requestVisit(request: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>): Promise<VisitRequest> {
    const visitRequest: VisitRequest = {
      ...request,
      id: `VIS-${Date.now()}`,
      status: 'requested',
      createdAt: new Date(),
    };

    this.visitRequests.set(visitRequest.id, visitRequest);
    this.emit({ type: 'visit_requested', data: visitRequest });

    return visitRequest;
  }

  async approveVisit(requestId: string, approvedBy: string): Promise<VisitRequest | null> {
    const request = this.visitRequests.get(requestId);
    if (!request) return null;

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    this.visitRequests.set(requestId, request);
    this.emit({ type: 'visit_approved', data: request });

    // Notify family member
    const member = this.familyMembers.get(request.familyMemberId);
    if (member && member.notificationPreferences.visitReminders) {
      await this.sendVisitConfirmation(member, request);
    }

    return request;
  }

  async declineVisit(requestId: string, reason: string): Promise<VisitRequest | null> {
    const request = this.visitRequests.get(requestId);
    if (!request) return null;

    request.status = 'declined';
    request.declineReason = reason;

    this.visitRequests.set(requestId, request);
    this.emit({ type: 'visit_declined', data: request });

    return request;
  }

  async getVisitRequests(patientId: string): Promise<VisitRequest[]> {
    return Array.from(this.visitRequests.values())
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUpcomingVisits(patientId: string): Promise<VisitRequest[]> {
    const now = new Date();
    return Array.from(this.visitRequests.values())
      .filter(v => 
        v.patientId === patientId && 
        v.status === 'approved' && 
        new Date(v.requestedDate) >= now
      )
      .sort((a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime());
  }

  // Care Plan Viewing
  async getCarePlan(patientId: string): Promise<CarePlanView | null> {
    // Return existing or generate sample
    let carePlan = this.carePlans.get(patientId);
    
    if (!carePlan) {
      carePlan = this.generateSampleCarePlan(patientId);
      this.carePlans.set(patientId, carePlan);
    }

    return carePlan;
  }

  private generateSampleCarePlan(patientId: string): CarePlanView {
    return {
      id: `CP-${patientId}`,
      patientId,
      diagnosis: 'Post-operative recovery - Appendectomy',
      treatmentPlan: 'Patient is recovering well from laparoscopic appendectomy. Continue IV antibiotics for 24 hours, then transition to oral. Monitor for signs of infection. Encourage ambulation.',
      medications: [
        { name: 'Cefazolin', purpose: 'Prevent infection', frequency: 'Every 8 hours IV' },
        { name: 'Acetaminophen', purpose: 'Pain management', frequency: 'Every 6 hours as needed' },
        { name: 'Ondansetron', purpose: 'Prevent nausea', frequency: 'Every 8 hours as needed' },
      ],
      upcomingProcedures: [
        {
          name: 'Wound Check',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          description: 'Surgical site inspection and dressing change',
        },
      ],
      dietaryRestrictions: ['Clear liquids progressing to regular diet', 'No heavy meals for 48 hours'],
      activityLevel: 'Ambulate with assistance, gradually increase activity',
      expectedDischarge: new Date(Date.now() + 48 * 60 * 60 * 1000),
      careTeam: [
        { name: 'Dr. Sarah Chen', role: 'Attending Surgeon', specialty: 'General Surgery' },
        { name: 'RN Michael Torres', role: 'Primary Nurse', specialty: 'Surgical Nursing' },
        { name: 'Dr. James Wilson', role: 'Hospitalist', specialty: 'Internal Medicine' },
      ],
      lastUpdated: new Date(),
    };
  }

  // Satisfaction Surveys
  async submitSurvey(survey: Omit<SatisfactionSurvey, 'id' | 'submittedAt'>): Promise<SatisfactionSurvey> {
    const newSurvey: SatisfactionSurvey = {
      ...survey,
      id: `SRV-${Date.now()}`,
      submittedAt: new Date(),
    };

    this.surveys.set(newSurvey.id, newSurvey);
    this.emit({ type: 'survey_submitted', data: newSurvey });

    return newSurvey;
  }

  async getSurveyStats(patientId?: string): Promise<SurveyStats> {
    const surveys = patientId
      ? Array.from(this.surveys.values()).filter(s => s.patientId === patientId)
      : Array.from(this.surveys.values());

    if (surveys.length === 0) {
      return {
        totalResponses: 0,
        averageOverall: 0,
        averageCommunication: 0,
        averageCareQuality: 0,
        averageStaffCourtesy: 0,
        averageFacility: 0,
        recommendationRate: 0,
      };
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      totalResponses: surveys.length,
      averageOverall: avg(surveys.map(s => s.overallRating)),
      averageCommunication: avg(surveys.map(s => s.communicationRating)),
      averageCareQuality: avg(surveys.map(s => s.careQualityRating)),
      averageStaffCourtesy: avg(surveys.map(s => s.staffCourtesyRating)),
      averageFacility: avg(surveys.map(s => s.facilityRating)),
      recommendationRate: surveys.filter(s => s.wouldRecommend).length / surveys.length * 100,
    };
  }

  // Multi-language Support
  async translateContent(content: string, targetLanguage: string): Promise<string> {
    // Simulated translation - in production, use translation API
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'Your loved one is doing well': 'Su ser querido está bien',
        'Visit approved': 'Visita aprobada',
        'New message from care team': 'Nuevo mensaje del equipo de atención',
      },
      'zh': {
        'Your loved one is doing well': '您的亲人状况良好',
        'Visit approved': '探视已批准',
        'New message from care team': '护理团队的新消息',
      },
      'fr': {
        'Your loved one is doing well': 'Votre proche va bien',
        'Visit approved': 'Visite approuvée',
        'New message from care team': 'Nouveau message de l\'équipe soignante',
      },
    };

    return translations[targetLanguage]?.[content] || content;
  }

  // Notification Helpers
  private async sendVerification(member: FamilyMember): Promise<void> {
    console.log(`[FamilyPortal] Sending verification to ${member.email}`);
    // In production: send actual verification email/SMS
  }

  private async sendNotification(member: FamilyMember, update: PatientUpdate): Promise<void> {
    console.log(`[FamilyPortal] Notifying ${member.firstName} about update: ${update.title}`);
    // In production: send push notification, email, or SMS
  }

  private async sendVisitConfirmation(member: FamilyMember, visit: VisitRequest): Promise<void> {
    console.log(`[FamilyPortal] Sending visit confirmation to ${member.firstName}`);
    // In production: send confirmation with details
  }

  // Event System
  private emit(event: PortalEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: PortalEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Statistics
  async getPortalStats(): Promise<PortalStats> {
    return {
      totalFamilyMembers: this.familyMembers.size,
      verifiedMembers: Array.from(this.familyMembers.values()).filter(m => m.isVerified).length,
      totalUpdates: this.updates.size,
      totalMessages: Array.from(this.messages.values()).reduce((sum, conv) => sum + conv.length, 0),
      pendingVisits: Array.from(this.visitRequests.values()).filter(v => v.status === 'requested').length,
      approvedVisits: Array.from(this.visitRequests.values()).filter(v => v.status === 'approved').length,
      surveysCompleted: this.surveys.size,
    };
  }
}

// Additional Types
export interface SurveyStats {
  totalResponses: number;
  averageOverall: number;
  averageCommunication: number;
  averageCareQuality: number;
  averageStaffCourtesy: number;
  averageFacility: number;
  recommendationRate: number;
}

export interface PortalStats {
  totalFamilyMembers: number;
  verifiedMembers: number;
  totalUpdates: number;
  totalMessages: number;
  pendingVisits: number;
  approvedVisits: number;
  surveysCompleted: number;
}

export interface PortalEvent {
  type: 'family_registered' | 'family_verified' | 'update_broadcast' | 'message_sent' | 
        'visit_requested' | 'visit_approved' | 'visit_declined' | 'survey_submitted';
  data: unknown;
}

// Export singleton
export const FamilyPortalService = new FamilyPortalServiceImpl();
export default FamilyPortalService;
